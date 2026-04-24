import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const HOURS = [
  { dayDE: 'Montag', dayEN: 'Monday', hours: null },
  { dayDE: 'Dienstag', dayEN: 'Tuesday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Mittwoch', dayEN: 'Wednesday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Donnerstag', dayEN: 'Thursday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Freitag', dayEN: 'Friday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Samstag', dayEN: 'Saturday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Sonntag', dayEN: 'Sunday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
]

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const closedLabel = locale === 'en' ? 'Closed' : 'Geschlossen'

  return (
    <footer id="contact" className="bg-charcoal text-ivory section-padding">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <div className="font-serif text-2xl tracking-brand uppercase mb-3">Jilebi</div>
          <p className="text-xs text-ivory/50 leading-relaxed">
            {locale === 'en' ? 'Authentic Indian Restaurant · Nürtingen' : 'Authentisches Indisches Restaurant · Nürtingen'}
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-xs tracking-widest uppercase text-ivory/50 hover:text-gold transition-colors">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-xs tracking-widest uppercase text-ivory/50 hover:text-gold transition-colors">Facebook</a>
          </div>
        </div>

        {/* Hours */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('hours_title')}</p>
          <div className="space-y-1">
            {HOURS.map((h) => (
              <div key={h.dayDE} className="flex justify-between text-xs text-ivory/70">
                <span>{locale === 'en' ? h.dayEN : h.dayDE}</span>
                <span className={!h.hours ? 'text-ivory/30' : ''}>{h.hours ?? closedLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Address + contact */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('address_title')}</p>
          <address className="not-italic text-xs text-ivory/70 leading-relaxed mb-4">
            Jilebi<br />
            Musterstraße 1<br />
            72622 Nürtingen<br />
            Deutschland
          </address>
          <a href="tel:+4970221234567" className="block text-xs text-ivory/70 hover:text-gold transition-colors mb-1">+49 7022 123 456</a>
          <a href="mailto:info@jilebi.de" className="block text-xs text-ivory/70 hover:text-gold transition-colors">info@jilebi.de</a>

          {/* Google Maps embed */}
          <div className="mt-4 rounded-sm overflow-hidden h-32">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10532.0!2d9.337!3d48.628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4799c5b4b3b3b3b3%3A0x0!2zNDjCsDM3JzQxLjAiTiA5wrAyMCcxMy4yIkU!5e0!3m2!1sde!2sde!4v1000000000000!5m2!1sde!2sde"
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
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-ivory/30">{t('copyright')}</p>
        <div className="flex gap-6">
          <Link href="/impressum" className="text-xs text-ivory/30 hover:text-ivory transition-colors">
            {t('impressum')}
          </Link>
          <Link href="/datenschutz" className="text-xs text-ivory/30 hover:text-ivory transition-colors">
            {t('datenschutz')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
