/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from 'react'
import { Stat } from "@/components/ui/Stat"
import { createClient } from '@/lib/supabase/client'

export function StatsGrid() {
  const [subjectCount, setSubjectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setLoading(false)
        return
      }

      const { count } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (mounted) {
        setSubjectCount(count || 0)
        setLoading(false)
      }
    }

    fetchStats()
    return () => {
      mounted = false
    }
  }, [])

  const stats = [
    {
      {
        id: "subjects",
        icon: "📚",
        label: "Subjects",
        value: loading ? "..." : subjectCount.toString(),
        hint: "Total subjects",
      },
      {
        id: "streak",
        icon: "🔥",
        label: "Current Streak",
        value: "—",
        hint: "Not connected yet",
      },
      {
        id: "focus",
        icon: "⏱",
        label: "Focus Time",
        value: "—",
        hint: "Not connected yet",
      },
      {
        id: "goal",
        icon: "🎯",
        label: "Weekly Goal",
        value: "—",
        hint: "Not connected yet",
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
            loading={loading && stat.id === "subjects"}
          />
        ))}
      </div>
    </section>
  )
}
