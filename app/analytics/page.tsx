"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useStudentSubjects } from "@/lib/hooks/useStudentSubjects";

export default function AnalyticsPage() {
  const { subjects, loading } = useStudentSubjects();
  const averageProgress = subjects.length
    ? Math.round(subjects.reduce((total, subject) => total + subject.progress, 0) / subjects.length)
    : 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">Your saved subject progress, kept up to date as it changes.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Subjects" value={loading ? "…" : String(subjects.length)} hint="Saved to your account" />
          <Metric label="Average progress" value={loading ? "…" : `${averageProgress}%`} hint="Across your subjects" />
          <Metric label="Focus time" value="Not tracked" hint="No saved focus sessions" />
          <Metric label="Study streak" value="Not tracked" hint="Study activity is not recorded" />
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-white">Progress by subject</h2>
          <p className="mt-1 text-sm text-zinc-400">Current progress saved for each of your subjects.</p>
          {loading ? (
            <p className="mt-6 text-sm text-zinc-400">Loading your subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-400">Add a subject to start tracking your progress.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {subjects.map((subject) => (
                <li key={subject.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-zinc-200">{subject.icon || "📚"} {subject.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-400">{subject.progress}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${subject.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={subject.progress}
                    className="h-2 overflow-hidden rounded-full bg-white/8"
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${subject.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card as="article">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </Card>
  );
}
