/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/Card"
import { createClient } from '@/lib/supabase/client'

export function StatsGrid() {
  const [subjectCount, setSubjectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubjectCount(count || 0)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  const stats = [
    {
      id: "streak",
      icon: "�",
      label: "Current Streak",
      value: "0 days",
      hint: "Keep it going",
    },
    {
      id: "focus",
      icon: "⏱",
      label: "Focus Time",
      value: "0h 0m",
      hint: "Today",
    },
    {
      id: "subjects",
      icon: "📚",
      label: "Subjects",
      value: loading ? "..." : subjectCount.toString(),
      hint: "Total subjects",
    },
    {
      id: "goal",
      icon: "🎯",
      label: "Weekly Goal",
      value: "0%",
      hint: "Start tracking",
    },
  ]

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Study stats
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            as="article"
            className="transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
              <span className="text-base" aria-hidden="true">
                {stat.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
