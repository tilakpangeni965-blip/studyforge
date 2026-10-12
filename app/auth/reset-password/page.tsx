"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/Card"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setUpdated(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image src="/icon.png" alt="StudyForge logo" width={56} height={56} priority className="mx-auto mb-4 h-14 w-14 rounded-xl bg-white object-cover shadow-[0_0_20px_rgba(99,102,241,0.18)]" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-zinc-400">Use at least 6 characters for your StudyForge account.</p>
        </div>

        {updated ? (
          <div className="space-y-4 text-center">
            <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Your password has been updated. You can now sign in with it.</p>
            <Link href="/auth/signin" className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90">Go to sign in</Link>
          </div>
        ) : <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">New password</label>
            <input id="password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-zinc-300">Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90 disabled:opacity-50">
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>}

        <p className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">Back to sign in</Link>
        </p>
      </Card>
    </div>
  )
}
