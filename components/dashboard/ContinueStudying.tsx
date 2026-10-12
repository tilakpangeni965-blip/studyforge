"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useStudentSubjects } from "@/lib/hooks/useStudentSubjects";

export function ContinueStudying() {
  const { subjects: allSubjects, loading } = useStudentSubjects();
  const subjects = allSubjects.slice(0, 4);

  if (loading) {
    return (
      <section aria-labelledby="continue-heading">
        <div className="mb-4">
          <h2
            id="continue-heading"
            className="text-base font-semibold text-white"
          >
            Continue Studying
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pick up where you left off
          </p>
        </div>
        <div className="text-center text-zinc-400">Loading...</div>
      </section>
    )
  }

  if (subjects.length === 0) {
    return (
      <section aria-labelledby="continue-heading">
        <div className="mb-4">
          <h2
            id="continue-heading"
            className="text-base font-semibold text-white"
          >
            Continue Studying
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pick up where you left off
          </p>
        </div>
        <Card>
          <div className="py-8 text-center">
            <p className="text-zinc-400">No subjects yet. Add your first subject to get started!</p>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section aria-labelledby="continue-heading">
      <div className="mb-4">
        <h2
          id="continue-heading"
          className="text-base font-semibold text-white"
        >
          Continue Studying
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Pick up where you left off
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            as="article"
            className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {subject.icon}
              </span>
              <div
                className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${subject.color || 'from-blue-500 to-violet-500'}`}
                aria-hidden="true"
              />
            </div>
            <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
            <div className="mt-5">
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
            <Link
              href="/notes"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              Review notes
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
