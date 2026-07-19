import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'
import Nav from '@/components/sections/Nav'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: '%s · Jilebi' },
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: 'Jilebi',
      url: `/${locale}`,
      images: ['/hero.jpg'],
      locale: locale === 'de' ? 'de_DE' : 'en_GB',
      alternateLocale: locale === 'de' ? 'en_GB' : 'de_DE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/hero.jpg'],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        de: '/de',
        en: '/en',
        'x-default': '/de',
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-charcoal focus:text-ivory focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:uppercase"
        >
          {locale === 'de' ? 'Zum Inhalt springen' : 'Skip to content'}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Nav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
