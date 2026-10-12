"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/Card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const { error: requestError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (requestError) {
      setError(requestError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image src="/icon.png" alt="StudyForge logo" width={56} height={56} priority className="mx-auto mb-4 h-14 w-14 rounded-xl bg-white object-cover shadow-[0_0_20px_rgba(99,102,241,0.18)]" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-400">We&apos;ll email you a secure link to choose a new password.</p>
        </div>

        {sent ? (
          <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            If an account exists for that email, a password reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="you@example.com" />
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">Back to sign in</Link>
        </p>
      </Card>
    </div>
  )
}
