'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Falsches Passwort')
        return
      }
      router.refresh()
    } catch {
      setError('Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
      <h1 className="font-serif text-2xl text-charcoal tracking-brand uppercase">Jilebi Admin</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        required
        className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal placeholder-muted focus:border-gold focus:outline-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40">
        {loading ? '...' : 'Anmelden'}
      </button>
    </form>
  )
}
