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
    <nav className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-sand">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-serif text-lg tracking-brand uppercase text-charcoal"
        >
          Jilebi
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest uppercase text-muted hover:text-charcoal transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={pathname}
            locale={altLocale}
            className="text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors"
          >
            {t('lang')}
          </Link>
        </div>

        {/* Desktop CTA */}
        <a href="#reservation" className="btn-primary text-xs hidden md:inline-block">
          {t('reserve')}
        </a>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-4">
          <Link
            href={pathname}
            locale={altLocale}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-xs tracking-widest uppercase text-gold"
          >
            {t('lang')}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('close_menu') : t('open_menu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            className="relative flex h-11 w-11 items-center justify-center text-charcoal"
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
        className={`md:hidden overflow-hidden border-t border-sand bg-ivory transition-[max-height] duration-300 ease-out ${
          mobileOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center text-xs tracking-widest uppercase text-charcoal hover:text-gold transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#reservation"
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
