import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function About() {
  const t = useTranslations('about')
  return (
    <section id="about" className="story-section section-padding">
      <div className="story-layout page-width">
        <div className="story-image">
          <Image src="/about.jpg" alt={t('image_alt')} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" />
          <span className="photo-caption">{t('caption')}</span>
        </div>
        <div className="story-copy">
          <p className="section-eyebrow">01 / {t('label')}</p>
          <h2 className="display-title">{t('title')}<br /><em>{t('title_accent')}</em></h2>
          <p className="story-intro">{t('intro')}</p>
          <p className="body-copy">{t('body')}</p>
          <a href="#menu" className="text-link">{t('cta')}<span aria-hidden="true">↗</span></a>
          <div className="story-signature"><span aria-hidden="true">J.</span><p>{t('signature')}</p></div>
        </div>
      </div>
    </section>
  )
}
