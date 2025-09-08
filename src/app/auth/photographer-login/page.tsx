"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function PhotographerLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next') || '/photographer'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Call our photographer login endpoint and include the `next` param so
      // the auth callback can finish and redirect back to the requested page.
      const res = await fetch(`/api/auth/photographer-login?next=${encodeURIComponent(nextParam)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || res.statusText || 'Login failed')
      }

      // Server will return a redirect URL (or we fall back to nextParam)
      const payload = await res.json().catch(() => ({}))
      const redirectTo = payload?.redirect || nextParam
      router.push(redirectTo)
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Photographer sign in</h1>
      <form onSubmit={handleSignin} className="space-y-4">
        {/* The real app may include OAuth buttons or an email flow. This simple
            form triggers the server-side login flow and preserves the `next` URL. */}
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in as Photographer'}
        </button>
        {error && <div className="text-red-500">{error}</div>}
      </form>
    </div>
  )
}
