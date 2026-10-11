/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { createClient } from '@/lib/supabase/client'

export function WeeklyProgress() {
  const [subjectCount, setSubjectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
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

    fetchData()
  }, [supabase])

  return (
    <Card aria-labelledby="weekly-progress-heading" className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217]">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <h2
          id="weekly-progress-heading"
          className="text-lg font-semibold text-white"
        >
          Your progress
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {loading ? 'Loading...' : subjectCount > 0 ? `You have ${subjectCount} subject${subjectCount > 1 ? 's' : ''}` : "Add subjects to start tracking"}
        </p>

        <div className="mt-8">
          <p className="text-6xl font-semibold tracking-tight text-white">
            {loading ? '...' : subjectCount > 0 ? subjectCount.toString() : '0'}
          </p>
        </div>

        <div className="mt-6">
          <ProgressBar
            value={loading ? 0 : Math.min(100, subjectCount * 25)}
            label="Weekly study progress"
          />
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          {loading ? 'Loading...' : subjectCount > 0 ? 'Start studying to track your progress' : 'Create your first subject to begin'}
        </p>
      </div>
    </Card>
  )
}
