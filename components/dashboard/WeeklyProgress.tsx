"use client";

import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useStudentSubjects } from "@/lib/hooks/useStudentSubjects";

export function WeeklyProgress() {
  const { subjects, loading } = useStudentSubjects();
  const averageProgress = subjects.length
    ? Math.round(subjects.reduce((total, subject) => total + subject.progress, 0) / subjects.length)
    : 0;

  return (
    <Card aria-labelledby="weekly-progress-heading" className="relative overflow-hidden bg-gradient-to-br from-surface-raised to-surface">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <h2
          id="weekly-progress-heading"
          className="text-lg font-semibold text-ink"
        >
          Your progress
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {loading ? 'Loading...' : subjects.length ? `Average progress across ${subjects.length} subject${subjects.length === 1 ? '' : 's'}` : "Add subjects to start tracking"}
        </p>

        <div className="mt-8">
          <p className="text-6xl font-semibold tracking-tight text-ink">
            {loading ? '...' : `${averageProgress}%`}
          </p>
        </div>

        <div className="mt-6">
          <ProgressBar
            value={loading ? 0 : averageProgress}
            label="Average subject progress"
          />
        </div>

        <p className="mt-4 text-sm text-ink-muted">
          {loading ? 'Loading...' : subjects.length ? 'Updated from your saved subject progress' : 'Create your first subject to begin'}
        </p>
      </div>
    </Card>
  )
}
