"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/supabase/auth'
import { Card } from '@/components/ui/Card'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const result = await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.message) {
      setMessage(result.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/icon.png"
            alt="StudyForge logo"
            width={56}
            height={56}
            priority
            className="mx-auto mb-4 h-14 w-14 rounded-xl bg-white object-cover shadow-[0_0_20px_rgba(99,102,241,0.18)] transition duration-300 ease-out hover:scale-110 hover:rotate-3 hover:shadow-[0_0_28px_rgba(99,102,241,0.35)] motion-reduce:transform-none"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start your learning journey with StudyForge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-zinc-300">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 transition-colors duration-200 hover:border-white/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 transition-colors duration-200 hover:border-white/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 transition-colors duration-200 hover:border-white/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          {message && (
            <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(99,102,241,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-0 disabled:translate-y-0 disabled:opacity-50 motion-reduce:transform-none"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-400 transition-colors duration-200 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
