import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Footer() {
  const t = useTranslations('footer')
  return (
    <footer id="contact" className="site-footer section-padding">
      <div className="page-width">
        <div className="footer-heading"><h2>{t('title')}</h2><a href="#main" className="footer-top" aria-label={t('back_top')}>↑</a></div>
        <div className="footer-grid">
          <div><p className="footer-brand">Jilebi.</p><p className="footer-subtitle">{t('subtitle')}</p></div>
          <div><h3>{t('hours_title')}</h3><dl><div><dt>{t('lunch')}</dt><dd>{t('lunch_hours')}</dd></div><div><dt>{t('dinner')}</dt><dd>{t('dinner_hours')}</dd></div></dl><p className="footer-closed">{t('closed_note')}</p></div>
          <div><h3>{t('address_title')}</h3><address>Marktstraße 8<br />72622 Nürtingen</address><a className="footer-directions" href="https://www.google.com/maps/search/?api=1&query=Marktstra%C3%9Fe+8+72622+N%C3%BCrtingen" target="_blank" rel="noreferrer">{t('directions')} ↗</a></div>
          <div><h3>{t('email_label')} / {t('phone_label')}</h3><a href="mailto:info@jilebi.de">info@jilebi.de</a><a href="tel:+4970229040300">+49 7022 904 030</a></div>
        </div>
        <div className="footer-bottom"><p>{t('copyright')}</p><p className="footer-demo">{t('demo_notice')}</p><div><Link href="/impressum">{t('impressum')}</Link><Link href="/datenschutz">{t('datenschutz')}</Link></div></div>
      </div>
    </footer>
  )
}
