import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function Hero() {
  const t = useTranslations('hero')
  return (
    <section className="hero-section">
      <div className="hero-topline"><span>{t('eyebrow')}</span><span>{t('welcome')}</span></div>
      <div className="hero-composition">
        <div className="hero-copy">
          <h1 className="hero-wordmark">Jilebi<span aria-hidden="true">.</span></h1>
          <p className="hero-headline">{t('headline')}<br /><em>{t('headline_accent')}</em></p>
          <p className="hero-description">{t('tagline')}</p>
          <div className="hero-actions">
            <a href="#reservation" className="btn-primary">{t('cta_reserve')}<span aria-hidden="true">↗</span></a>
            <a href="#menu" className="text-link">{t('cta_menu')}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-dish"><Image src="/gallery/thali.jpg" alt={t('image_alt')} fill sizes="(min-width: 1024px) 47vw, 90vw" className="object-cover" priority loading="eager" /></div>
          <div className="hero-inset"><Image src="/hero.jpg" alt={t('courtyard_alt')} fill sizes="(min-width: 1024px) 16vw, 32vw" className="object-cover" /><span>{t('inset_caption')}</span></div>
          <div className="hero-seal"><span aria-hidden="true">✳</span><span>{t('seal')}</span></div>
        </div>
      </div>
      <div className="hero-bottom"><span>{t('bottom_note')}</span><a href="#about">{t('discover')}<span aria-hidden="true">↓</span></a></div>
    </section>
  )
}
