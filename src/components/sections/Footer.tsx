import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer id="contact" className="bg-charcoal text-ivory section-padding">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
        {/* Brand */}
        <div>
          <div className="font-serif text-3xl tracking-brand uppercase mb-4">
            Jilebi
          </div>
          <p className="text-sm text-ivory/70 leading-relaxed max-w-[28ch]">
            {locale === 'en'
              ? 'Authentic Indian Restaurant · Nürtingen'
              : 'Authentisches Indisches Restaurant · Nürtingen'}
          </p>
          <span className="block w-8 h-px bg-gold/60 my-6" />
          <div className="flex gap-5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-xs tracking-widest uppercase text-ivory/70 hover:text-gold transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-xs tracking-widest uppercase text-ivory/70 hover:text-gold transition-colors"
            >
              Facebook
            </a>
          </div>
        </div>

        {/* Hours */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-5">
            {t('hours_title')}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ivory/60 font-serif italic">{t('lunch')}</dt>
            <dd className="text-ivory/90 tabular-nums">{t('lunch_hours')}</dd>
            <dt className="text-ivory/60 font-serif italic">{t('dinner')}</dt>
            <dd className="text-ivory/90 tabular-nums">{t('dinner_hours')}</dd>
          </dl>
          <p className="mt-5 text-[10px] tracking-widest uppercase text-ivory/60">
            {t('closed_note')}
          </p>
        </div>

        {/* Address + contact */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-5">
            {t('address_title')}
          </p>
          <address className="not-italic text-sm text-ivory/85 leading-relaxed">
            Jilebi
            <br />
            Marktstraße 8
            <br />
            72622 Nürtingen
            <br />
            Deutschland
          </address>
          <div className="mt-5">
            <a
              href="tel:+4970229040300"
              className="flex min-h-11 items-center text-sm text-ivory/85 hover:text-gold transition-colors"
            >
              +49 7022 904 030
            </a>
            <a
              href="mailto:info@jilebi.de"
              className="flex min-h-11 items-center text-sm text-ivory/85 hover:text-gold transition-colors"
            >
              info@jilebi.de
            </a>
          </div>

          <div className="mt-6 overflow-hidden h-32 ring-1 ring-ivory/10">
            <iframe
              src="https://www.google.com/maps?q=Marktstra%C3%9Fe+8,+72622+N%C3%BCrtingen,+Germany&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Jilebi location"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto mt-16 flex flex-col items-start justify-between gap-4 border-t border-ivory/15 pt-6 sm:flex-row sm:items-center">
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
          <p className="text-xs text-ivory/60">{t('copyright')}</p>
          <p className="max-w-[34ch] text-[10px] leading-relaxed tracking-widest uppercase text-gold/80 sm:max-w-none">
            {t('demo_notice')}
          </p>
        </div>
        <div className="flex gap-6">
          <Link
            href="/impressum"
            className="inline-flex min-h-11 items-center text-xs text-ivory/70 hover:text-ivory transition-colors"
          >
            {t('impressum')}
          </Link>
          <Link
            href="/datenschutz"
            className="inline-flex min-h-11 items-center text-xs text-ivory/70 hover:text-ivory transition-colors"
          >
            {t('datenschutz')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
