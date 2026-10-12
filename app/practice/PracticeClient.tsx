"use client";

import { useState } from "react";
import { createPracticeQuiz, submitPracticeQuiz } from "@/app/practice/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import type { PracticeAttemptResult, PracticeDifficulty, PracticeQuizSummary, PracticeSubject } from "@/types/practice";

type Dashboard = Awaited<ReturnType<typeof import("@/app/practice/actions").getPracticeDashboard>>;

export function PracticeClient({ initial }: { initial: Dashboard }) {
  const [subjects] = useState<PracticeSubject[]>(initial.subjects);
  const [quizzes, setQuizzes] = useState<PracticeQuizSummary[]>(initial.quizzes);
  const [error, setError] = useState(initial.error);
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("beginner");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [generating, setGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<PracticeQuizSummary | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const response = await createPracticeQuiz({
        subjectId: subjectId || null,
        topic,
        difficulty,
        questionCount,
      });
      if (response.error || !response.quiz) {
        setError(response.error || "Could not generate the quiz.");
        return;
      }
      setQuizzes((current) => [response.quiz!, ...current]);
      setTopic("");
      startQuiz(response.quiz);
    } catch {
      setError("Could not generate the quiz. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function startQuiz(quiz: PracticeQuizSummary) {
    setActiveQuiz(quiz);
    setAnswers(Array(quiz.questions.length).fill(-1));
    setResult(null);
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeQuiz) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitPracticeQuiz(activeQuiz.id, answers);
      if (response.error || !response.result) {
        setError(response.error || "Could not save your result.");
        return;
      }
      setResult(response.result);
      setQuizzes((current) => current.map((quiz) => quiz.id === activeQuiz.id
        ? { ...quiz, attemptCount: quiz.attemptCount + 1, ...(quiz.bestScore === null || response.result!.score / response.result!.total > quiz.bestScore / (quiz.bestTotal || 1) ? { bestScore: response.result!.score, bestTotal: response.result!.total } : {}) }
        : quiz));
    } catch {
      setError("Could not save your result. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Practice</h1>
        <p className="mt-1 text-sm text-zinc-400">Generate quizzes from a topic and track your progress.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}

      {activeQuiz ? (
        <Card as="section" aria-labelledby="active-quiz-title" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <button type="button" onClick={() => { setActiveQuiz(null); setResult(null); setError(null); }} className="mb-3 text-sm text-zinc-400 hover:text-white">← All quizzes</button>
              <h2 id="active-quiz-title" className="text-xl font-semibold text-white">{activeQuiz.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">{activeQuiz.subjectName ? `${activeQuiz.subjectName} · ` : ""}{activeQuiz.difficulty} · {activeQuiz.questions.length} questions</p>
            </div>
            {result && <Badge variant="success">Score: {result.score} / {result.total}</Badge>}
          </div>

          <form onSubmit={submit} className="space-y-5">
            {activeQuiz.questions.map((question, index) => (
              <fieldset key={`${activeQuiz.id}-${index}`} className="rounded-xl border border-hairline bg-surface-raised/60 p-4">
                <legend className="px-1 text-sm font-medium text-white">{index + 1}. {question.prompt}</legend>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const feedback = result?.feedback[index];
                    const correct = feedback?.correctIndex === optionIndex;
                    const selected = answers[index] === optionIndex;
                    return (
                      <label key={optionIndex} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${correct ? "border-success/50 bg-success-soft/50 text-white" : selected && feedback && !feedback.isCorrect ? "border-danger/40 bg-danger-soft/40 text-white" : "border-hairline text-zinc-300 hover:bg-surface-hover"}`}>
                        <input type="radio" name={`question-${index}`} value={optionIndex} disabled={!!result} checked={selected} onChange={() => setAnswers((current) => current.map((value, i) => i === index ? optionIndex : value))} className="mt-0.5 accent-current" />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
                {result && <p className="mt-3 text-sm leading-6 text-zinc-400">{result.feedback[index]?.explanation}</p>}
              </fieldset>
            ))}
            {!result ? (
              <Button type="submit" loading={submitting} loadingLabel="Saving result…">Submit answers</Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => startQuiz(activeQuiz)}>Try again</Button>
            )}
          </form>
        </Card>
      ) : (
        <>
          <Card as="section" aria-labelledby="create-quiz-title">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="create-quiz-title" className="font-semibold text-white">Create a practice quiz</h2>
                <p className="mt-1 text-sm text-zinc-400">DeepSeek uses your topic and subject name to create questions. Your notes and other study data are not sent.</p>
              </div>
              <Badge variant="success">Free · Unlimited quizzes</Badge>
            </div>
            <form onSubmit={generate} className="grid gap-4 md:grid-cols-2">
              <Field label="Topic" htmlFor="quiz-topic" hint="For example, fractions, cell biology, or the French Revolution.">
                <Input id="quiz-topic" value={topic} onChange={(event) => setTopic(event.target.value)} minLength={2} maxLength={120} required placeholder="What do you want to practice?" />
              </Field>
              <Field label="Subject" htmlFor="quiz-subject" hint="Optional. Choose one of your saved subjects.">
                <Select id="quiz-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                  <option value="">General study</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </Select>
              </Field>
              <Field label="Difficulty" htmlFor="quiz-difficulty">
                <Select id="quiz-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as PracticeDifficulty)}>
                  <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                </Select>
              </Field>
              <Field label="Question count" htmlFor="quiz-question-count">
                <Select id="quiz-question-count" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value) as 5 | 10)}>
                  <option value={5}>5 questions</option><option value={10}>10 questions</option>
                </Select>
              </Field>
              <div className="md:col-span-2"><Button type="submit" loading={generating} loadingLabel="Generating quiz…">Generate quiz</Button></div>
            </form>
          </Card>

          <section className="space-y-3" aria-labelledby="saved-quizzes-title">
            <div className="flex items-center justify-between"><h2 id="saved-quizzes-title" className="font-semibold text-white">Your quizzes</h2><span className="text-xs text-zinc-500">{quizzes.length} saved</span></div>
            {quizzes.length === 0 ? (
              <Card><p className="py-5 text-center text-sm text-zinc-400">No quizzes yet. Generate one to get started.</p></Card>
            ) : quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-white">{quiz.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{quiz.subjectName ? `${quiz.subjectName} · ` : ""}{quiz.topic} · {quiz.questions.length} questions · {quiz.difficulty}</p>
                  <p className="mt-1 text-xs text-zinc-500">{quiz.attemptCount} {quiz.attemptCount === 1 ? "attempt" : "attempts"}{quiz.bestScore !== null && quiz.bestTotal ? ` · Best ${quiz.bestScore}/${quiz.bestTotal}` : ""}</p>
                </div>
                <Button variant="secondary" onClick={() => startQuiz(quiz)}>Start quiz</Button>
              </Card>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
