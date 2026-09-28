'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'

export default function Nav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const altLocale = locale === 'de' ? 'en' : 'de'

  const navLinks = [
    { href: '#about', label: t('about') },
    { href: '#menu', label: t('menu') },
    { href: '#gallery', label: t('gallery') },
    { href: '#contact', label: t('contact') },
  ]

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        {/* Wordmark */}
        <Link href="/" className="nav-wordmark">
          Jilebi<span aria-hidden="true">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={`/${locale}${link.href}`}
              className="text-xs tracking-widest uppercase text-muted hover:text-charcoal transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={pathname}
            locale={altLocale}
            className="text-xs tracking-widest uppercase text-gold-ink hover:text-charcoal transition-colors"
          >
            {t('lang')}
          </Link>
        </div>

        {/* Desktop CTA */}
        <a href={`/${locale}#reservation`} className="btn-primary text-xs hidden lg:inline-flex">
          {t('reserve')}<span aria-hidden="true">↗</span>
        </a>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-1">
          <a
            href={`/${locale}#reservation`}
            aria-label={t('reserve')}
            onClick={() => setMobileOpen(false)}
            className="btn-primary px-3 tracking-[0.1em]"
          >
            {t('reserve_short')}
          </a>
          <Link href={pathname} locale={altLocale} className="inline-flex min-h-11 min-w-11 items-center justify-center text-xs tracking-widest uppercase text-gold-ink">
            {t('lang')}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('close_menu') : t('open_menu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            className="relative w-11 h-11 flex items-center justify-center text-charcoal"
          >
            <span
              className={`absolute block w-5 h-px bg-charcoal transition-transform duration-200 ${
                mobileOpen ? 'rotate-45' : '-translate-y-1.5'
              }`}
            />
            <span
              className={`absolute block w-5 h-px bg-charcoal transition-opacity duration-200 ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute block w-5 h-px bg-charcoal transition-transform duration-200 ${
                mobileOpen ? '-rotate-45' : 'translate-y-1.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav-panel"
        hidden={!mobileOpen}
        className="mobile-nav-panel lg:hidden"
      >
        <div className="px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={`/${locale}${link.href}`}
              onClick={() => setMobileOpen(false)}
              className="text-xs tracking-widest uppercase text-charcoal hover:text-gold-ink transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href={`/${locale}#reservation`}
            onClick={() => setMobileOpen(false)}
            className="btn-primary text-xs self-start"
          >
            {t('reserve')}
          </a>
        </div>
      </div>
    </nav>
  )
}
