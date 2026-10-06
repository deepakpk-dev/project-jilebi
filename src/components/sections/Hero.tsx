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
        <figure className="hero-visual">
          <div className="hero-photo-frame">
            <div className="hero-dish"><Image src="/gallery/butter-chicken.jpg" alt={t('image_alt')} fill sizes="(min-width: 1500px) 560px, (min-width: 1024px) 43vw, 90vw" className="object-cover" priority loading="eager" /></div>
          </div>
          <figcaption className="hero-photo-caption">{t('image_caption')}</figcaption>
        </figure>
      </div>
      <div className="hero-bottom"><span>{t('bottom_note')}</span><a href="#about">{t('discover')}<span aria-hidden="true">↓</span></a></div>
    </section>
  )
}
