import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function PracticePage() {
  const quizzes = [
    { name: "Physics: Laws of Motion", questions: 20, difficulty: "Medium", icon: "⚛️" },
    { name: "Chemistry: Equilibrium", questions: 15, difficulty: "Hard", icon: "🧪" },
    { name: "Math: Limits", questions: 25, difficulty: "Easy", icon: "📐" },
    { name: "CS: Data Structures", questions: 18, difficulty: "Medium", icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Practice
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Test your knowledge with practice problems and quizzes.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            + Create Quiz
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.name}
              as="article"
              className="flex items-start gap-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="text-2xl" aria-hidden="true">
                {quiz.icon}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{quiz.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{quiz.questions} questions · {quiz.difficulty}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
              >
                Start
              </button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
