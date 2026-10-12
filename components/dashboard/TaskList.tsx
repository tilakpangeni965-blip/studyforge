"use client";

import { Card } from "@/components/ui/Card";
import { useStudentSubjects } from "@/lib/hooks/useStudentSubjects";

export function TaskList() {
  const { subjects, loading } = useStudentSubjects();
  const focusSubjects = [...subjects].sort((a, b) => a.progress - b.progress).slice(0, 4);

  return (
    <Card aria-labelledby="focus-subjects-heading">
      <h2 id="focus-subjects-heading" className="text-base font-semibold text-white">
        Subjects to focus on
      </h2>
      <p className="mt-1 text-sm text-zinc-400">Based on the progress saved in your account</p>

      {loading ? (
        <p className="mt-5 text-sm text-zinc-400">Loading your subjects…</p>
      ) : focusSubjects.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-400">Add a subject to see your progress here.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {focusSubjects.map((subject) => (
            <li key={subject.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/6 px-3 py-3">
              <span className="min-w-0 truncate text-sm font-medium text-zinc-100">
                <span className="mr-2" aria-hidden="true">{subject.icon || "📚"}</span>
                {subject.name}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-zinc-400">{subject.progress}% complete</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
