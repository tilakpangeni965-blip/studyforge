"use client";

import { Stat } from "@/components/ui/Stat"
import { useStudentSubjects } from "@/lib/hooks/useStudentSubjects";

export function StatsGrid() {
  const { subjects, loading } = useStudentSubjects();
  const averageProgress = subjects.length
    ? Math.round(subjects.reduce((total, subject) => total + subject.progress, 0) / subjects.length)
    : 0;

  const stats = [
    {
      id: "subjects",
      icon: "📚",
      label: "Subjects",
      value: String(subjects.length),
      hint: "Your saved subjects",
    },
    {
      id: "progress",
      icon: "📈",
      label: "Average progress",
      value: `${averageProgress}%`,
      hint: subjects.length ? `Across ${subjects.length} subject${subjects.length === 1 ? "" : "s"}` : "Add a subject to start",
    },
    {
      id: "focus",
      icon: "⏱",
      label: "Focus time",
      value: "Not tracked",
      hint: "No saved focus sessions yet",
    },
    {
      id: "streak",
      icon: "🔥",
      label: "Study streak",
      value: "Not tracked",
      hint: "Study activity is not recorded yet",
    },
  ]

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Study stats
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Stat
            key={stat.id}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            loading={loading && (stat.id === "subjects" || stat.id === "progress")}
          />
        ))}
      </div>
    </section>
  )
}
