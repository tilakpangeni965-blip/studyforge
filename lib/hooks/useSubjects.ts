/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Subject = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  progress: number
  created_at: string
  updated_at: string
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchSubjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subjects:', error)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubjects(data || [])
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false)
  }

  useEffect(() => {
    fetchSubjects()
  }, [supabase])

  async function createSubject(name: string, icon: string, color: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        name,
        icon,
        color,
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    setSubjects((prev) => [data, ...prev])
    return { data }
  }

  async function updateSubject(id: string, updates: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    setSubjects((prev) => prev.map((s) => (s.id === id ? data : s)))
    return { data }
  }

  async function deleteSubject(id: string) {
    const { error } = await supabase.from('subjects').delete().eq('id', id)

    if (error) {
      return { error: error.message }
    }

    setSubjects((prev) => prev.filter((s) => s.id !== id))
    return { success: true }
  }

  return {
    subjects,
    loading,
    createSubject,
    updateSubject,
    deleteSubject,
    refetch: fetchSubjects,
  }
}
