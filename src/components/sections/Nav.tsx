'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()

  const altLocale = locale === 'de' ? 'en' : 'de'
  const cleanPath = pathname.replace(/^\/(de|en)/, '') || '/'
  const altPath = locale === 'de' ? `/en${cleanPath === '/' ? '' : cleanPath}` : cleanPath

  const navLinks = [
    { href: '#about', label: t('about') },
    { href: '#menu', label: t('menu') },
    { href: '#gallery', label: t('gallery') },
    { href: '#contact', label: t('contact') },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-sand">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href={locale === 'de' ? '/' : '/en'} className="font-serif text-lg tracking-brand uppercase text-charcoal">
          Jilebi
        </Link>

        {/* Nav links — hidden on mobile */}
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
            href={altPath}
            className="text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors"
          >
            {t('lang')}
          </Link>
        </div>

        {/* CTA */}
        <a href="#reservation" className="btn-primary text-xs hidden md:inline-block">
          {t('reserve')}
        </a>

        {/* Mobile: language + CTA only */}
        <div className="flex md:hidden items-center gap-4">
          <Link href={altPath} className="text-xs tracking-widest uppercase text-gold">
            {t('lang')}
          </Link>
          <a href="#reservation" className="btn-primary text-xs">
            {t('reserve')}
          </a>
        </div>
      </div>
    </nav>
  )
}
