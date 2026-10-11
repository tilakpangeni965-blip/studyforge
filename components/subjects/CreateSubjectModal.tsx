"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

type CreateSubjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, icon: string, color: string) => Promise<void>
}

const ICONS = ['📚', '⚛️', '🧪', '📐', '💻', '🎨', '🎵', '🌍', '📖', '✏️']
const COLORS = [
  'from-blue-500 to-violet-500',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
  'from-indigo-500 to-blue-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-yellow-600',
]

export function CreateSubjectModal({ isOpen, onClose, onCreate }: CreateSubjectModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState('from-blue-500 to-violet-500')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim()) {
      setError('Subject name is required')
      setLoading(false)
      return
    }

    await onCreate(name, icon, color)
    setLoading(false)
    setName('')
    setIcon('📚')
    setColor('from-blue-500 to-violet-500')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold text-white">Create Subject</h2>
        <p className="mt-1 text-sm text-zinc-400">Add a new subject to track your progress</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Physics"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`rounded-lg p-2 text-2xl transition-colors ${
                    icon === i ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 rounded-lg bg-gradient-to-r transition-all ${
                    color === c ? 'ring-2 ring-white/50' : 'hover:ring-1 hover:ring-white/20'
                  } ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
