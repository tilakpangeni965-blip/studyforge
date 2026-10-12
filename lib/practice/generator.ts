import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import type { PracticeDifficulty, PracticeQuestion } from "@/types/practice";

export async function generatePracticeQuestions({
  subject,
  topic,
  difficulty,
  questionCount,
}: {
  subject: string | null;
  topic: string;
  difficulty: PracticeDifficulty;
  questionCount: number;
}) {
  const content = await generateWithDeepSeek([
    {
      role: "system",
      content: "You create accurate, age-appropriate educational multiple-choice quizzes. Output valid JSON only with keys title and questions. Every question must contain prompt, options (exactly four strings), correctIndex (integer 0-3), and explanation (short teaching explanation).",
    },
    {
      role: "user",
      content: `Create a ${difficulty} level multiple-choice practice quiz about this topic. Generate exactly ${questionCount} distinct questions, each with four plausible options, one correct answer, and an explanation. Avoid trick questions and ambiguous wording. Subject: ${subject || "General study"}. Topic: ${topic}. Return JSON shaped like {"title":"...","questions":[{"prompt":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}.`,
    },
  ], { maxTokens: 4096, json: true });

  let parsed: { title?: unknown; questions?: unknown };
  try {
    parsed = JSON.parse(content) as { title?: unknown; questions?: unknown };
  } catch {
    throw new Error("DeepSeek returned invalid quiz data. Please try again.");
  }
  if (typeof parsed.title !== "string" || !Array.isArray(parsed.questions) || parsed.questions.length !== questionCount) {
    throw new Error("DeepSeek returned an incomplete quiz. Please try again.");
  }

  const questions = parsed.questions.map((value): PracticeQuestion => {
    if (!value || typeof value !== "object") throw new Error("DeepSeek returned an invalid question.");
    const question = value as Record<string, unknown>;
    if (
      typeof question.prompt !== "string" || question.prompt.trim().length < 5 || question.prompt.length > 1200
      || !Array.isArray(question.options) || question.options.length !== 4
      || question.options.some((option) => typeof option !== "string" || option.trim().length === 0 || option.length > 400)
      || !Number.isInteger(question.correctIndex) || Number(question.correctIndex) < 0 || Number(question.correctIndex) > 3
      || typeof question.explanation !== "string" || question.explanation.length > 1200
    ) throw new Error("DeepSeek returned an invalid question.");
    return {
      prompt: question.prompt.trim(),
      options: question.options.map((option) => String(option).trim()),
      correctIndex: Number(question.correctIndex),
      explanation: question.explanation.trim(),
    };
  });

  return { title: parsed.title.trim().slice(0, 160) || topic, questions };
}
