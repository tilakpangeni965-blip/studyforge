"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkTutorRateLimit } from "@/lib/tutor/rate-limit";
import { generatePracticeQuestions } from "@/lib/practice/generator";
import type { PracticeDifficulty, PracticeQuizSummary, PracticeSubject } from "@/types/practice";

async function makeSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot write cookies; server actions can.
        }
      },
    },
  });
}

async function getSignedInClient() {
  const supabase = await makeSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, error: "Please sign in to use practice quizzes." };
  return { supabase, user, error: null };
}

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "";
}

function viewQuestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = item as Record<string, unknown>;
    if (typeof question.prompt !== "string" || !Array.isArray(question.options)) return [];
    return [{ prompt: question.prompt, options: question.options.map(String) }];
  });
}

export async function getPracticeDashboard() {
  const auth = await getSignedInClient();
  if (auth.error || !auth.user) return { error: auth.error, subjects: [], quizzes: [] };

  try {
    const [subjectResult, quizResult, attemptResult] = await Promise.all([
      auth.supabase.from("subjects").select("id, name").eq("user_id", auth.user.id).order("name"),
      auth.supabase.from("practice_quizzes").select("id, subject_id, title, topic, difficulty, questions, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
      auth.supabase.from("practice_quiz_attempts").select("quiz_id, score, total, completed_at").eq("user_id", auth.user.id).order("completed_at", { ascending: false }),
    ]);
    if (subjectResult.error) throw subjectResult.error;
    if (quizResult.error) throw quizResult.error;
    if (attemptResult.error) throw attemptResult.error;

    const subjects: PracticeSubject[] = (subjectResult.data ?? []).map((subject) => ({ id: subject.id, name: subject.name }));
    const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));
    const attemptsByQuiz = new Map<string, Array<{ score: number; total: number }>>();
    for (const attempt of attemptResult.data ?? []) {
      const current = attemptsByQuiz.get(attempt.quiz_id) ?? [];
      current.push({ score: attempt.score, total: attempt.total });
      attemptsByQuiz.set(attempt.quiz_id, current);
    }
    const quizzes: PracticeQuizSummary[] = (quizResult.data ?? []).map((quiz) => {
      const attempts = attemptsByQuiz.get(quiz.id) ?? [];
      const best = attempts.reduce<{ score: number; total: number } | null>((top, current) => {
        if (!top || current.score / current.total > top.score / top.total) return current;
        return top;
      }, null);
      return {
        id: quiz.id,
        subjectId: quiz.subject_id,
        subjectName: quiz.subject_id ? subjectNames.get(quiz.subject_id) ?? null : null,
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty as PracticeDifficulty,
        questions: viewQuestions(quiz.questions),
        createdAt: quiz.created_at,
        bestScore: best?.score ?? null,
        bestTotal: best?.total ?? null,
        attemptCount: attempts.length,
      };
    });
    return { error: null, subjects, quizzes };
  } catch (error) {
    console.error("[practice] load failed", error);
    const detail = messageOf(error);
    return {
      error: /practice_quiz|schema cache|function.*practice/i.test(detail)
        ? "Practice quizzes need database migration 0005. Apply it in the Supabase SQL Editor, then reload this page."
        : "Could not load practice quizzes. Please try again.",
      subjects: [],
      quizzes: [],
    };
  }
}

export async function createPracticeQuiz(input: {
  subjectId: string | null;
  topic: string;
  difficulty: PracticeDifficulty;
  questionCount: 5 | 10;
}) {
  const auth = await getSignedInClient();
  if (auth.error || !auth.user) return { error: auth.error, quiz: null };

  const topic = typeof input.topic === "string" ? input.topic.trim() : "";
  const difficulty = input.difficulty;
  const questionCount = input.questionCount;
  if (topic.length < 2 || topic.length > 120) return { error: "Enter a topic between 2 and 120 characters.", quiz: null };
  if (!["beginner", "intermediate", "advanced"].includes(difficulty) || ![5, 10].includes(questionCount)) {
    return { error: "Choose a valid quiz difficulty and question count.", quiz: null };
  }

  try {
    if (input.subjectId && !/^[0-9a-f-]{36}$/i.test(input.subjectId)) return { error: "Choose a valid subject.", quiz: null };
    let subjectName: string | null = null;
    if (input.subjectId) {
      const { data: subject, error } = await auth.supabase.from("subjects").select("name").eq("id", input.subjectId).eq("user_id", auth.user.id).maybeSingle();
      if (error) throw error;
      if (!subject) return { error: "That subject could not be found.", quiz: null };
      subjectName = subject.name;
    }

    const rate = await checkTutorRateLimit(auth.supabase, auth.user.id);
    if (!rate.ok) return { error: `Please wait ${Math.ceil((rate.resetInMs ?? 1000) / 1000)} seconds before generating another quiz.`, quiz: null };

    const generated = await generatePracticeQuestions({ subject: subjectName, topic, difficulty, questionCount });
    const { data: quizId, error: saveError } = await auth.supabase.rpc("create_practice_quiz", {
      p_subject_id: input.subjectId,
      p_topic: topic,
      p_title: generated.title,
      p_difficulty: difficulty,
      p_questions: generated.questions,
    });
    if (saveError) throw saveError;
    const { data: quiz, error: fetchError } = await auth.supabase
      .from("practice_quizzes")
      .select("id, subject_id, title, topic, difficulty, questions, created_at")
      .eq("id", String(quizId))
      .eq("user_id", auth.user.id)
      .single();
    if (fetchError) throw fetchError;
    const responseQuiz: PracticeQuizSummary = {
      id: quiz.id,
      subjectId: quiz.subject_id,
      subjectName,
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty as PracticeDifficulty,
      questions: viewQuestions(quiz.questions),
      createdAt: quiz.created_at,
      bestScore: null,
      bestTotal: null,
      attemptCount: 0,
    };
    return { error: null, quiz: responseQuiz };
  } catch (error) {
    console.error("[practice] quiz generation failed", error);
    const detail = messageOf(error);
    return {
      error: /practice_quiz|schema cache|function.*practice/i.test(detail)
        ? "Practice quizzes need database migration 0005. Apply it in the Supabase SQL Editor, then try again."
        : /DEEPSEEK_API_KEY/.test(detail)
          ? "DeepSeek quiz generation is not configured on this server yet. Add DEEPSEEK_API_KEY to the server environment, then restart the app."
          : "Could not generate that quiz. Please try again.",
      quiz: null,
    };
  }
}

export async function submitPracticeQuiz(quizId: string, answers: number[]) {
  const auth = await getSignedInClient();
  if (auth.error || !auth.user) return { error: auth.error, result: null };
  if (!/^[0-9a-f-]{36}$/i.test(quizId) || !Array.isArray(answers) || answers.length > 10 || answers.some((answer) => !Number.isInteger(answer) || answer < -1 || answer > 3)) {
    return { error: "Your quiz answers could not be submitted.", result: null };
  }
  try {
    const { data, error } = await auth.supabase.rpc("record_practice_quiz_attempt", { p_quiz_id: quizId, p_answers: answers });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined;
    if (!row || typeof row.score !== "number" || typeof row.total !== "number" || !Array.isArray(row.feedback)) {
      throw new Error("The quiz result was incomplete.");
    }
    return {
      error: null,
      result: {
        score: row.score,
        total: row.total,
        feedback: row.feedback.map((value) => {
          const feedback = value as Record<string, unknown>;
          return {
            correctIndex: Number(feedback.correctIndex),
            isCorrect: feedback.isCorrect === true,
            explanation: String(feedback.explanation ?? ""),
          };
        }),
      },
    };
  } catch (error) {
    console.error("[practice] submit failed", error);
    return { error: "Could not save your quiz result. Please try again.", result: null };
  }
}
