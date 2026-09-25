'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function LogoutButton() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs tracking-widest uppercase text-muted hover:text-chili disabled:opacity-40 transition-colors"
    >
      {t('logout')}
    </button>
  )
}
