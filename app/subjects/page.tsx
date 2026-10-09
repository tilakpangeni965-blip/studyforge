import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function SubjectsPage() {
  const subjects = [
    { name: "Physics", topic: "Chapter 5 · Laws of Motion", progress: 72, icon: "⚛️" },
    { name: "Chemistry", topic: "Chemical Equilibrium", progress: 64, icon: "🧪" },
    { name: "Mathematics", topic: "Limits and Continuity", progress: 81, icon: "📐" },
    { name: "Computer Science", topic: "Data Structures", progress: 45, icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Subjects
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your subjects and track progress across different courses.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            + Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject) => (
            <Card
              key={subject.name}
              as="article"
              className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {subject.icon}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
                  <p className="text-sm text-zinc-400">{subject.topic}</p>
                </div>
              </div>
              <div className="mt-auto">
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Progress</span>
                  <span className="font-medium text-zinc-300">
                    {subject.progress}%
                  </span>
                </div>
                <ProgressBar
                  value={subject.progress}
                  label={`${subject.name} progress`}
                />
              </div>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
              >
                View Details
              </button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
