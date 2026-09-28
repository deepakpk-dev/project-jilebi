'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { galleryImages } from '@/data/gallery'
import Lightbox from '@/components/ui/Lightbox'

export default function Gallery() {
  const t = useTranslations('gallery')
  const locale = useLocale()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const prevIndexRef = useRef<number | null>(null)

  // Restore focus to the originating thumbnail when the lightbox closes
  useEffect(() => {
    if (prevIndexRef.current !== null && lightboxIndex === null) {
      buttonRefs.current[prevIndexRef.current]?.focus()
    }
    prevIndexRef.current = lightboxIndex
  }, [lightboxIndex])

  return (
    <section id="gallery" className="gallery-section section-padding">
      <div className="page-width">
        <div className="section-heading-row">
          <div><p className="section-eyebrow">03 / {t('label')}</p><h2 className="display-title">{t('title')}<br /><em>{t('title_accent')}</em></h2></div>
          <p className="body-copy">{t('intro')}</p>
        </div>

        <ul className="gallery-grid">
          {galleryImages.map((img, i) => {
            const alt = locale === 'en' ? img.alt.en : img.alt.de
            const sizes = i === 0
              ? '(min-width: 768px) 40vw, 100vw'
              : i === galleryImages.length - 1
                ? '100vw'
                : '(min-width: 768px) 31vw, 50vw'
            return (
              <li key={img.src}>
                <button
                  ref={(el) => {
                    buttonRefs.current[i] = el
                  }}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={alt}
                  className="gallery-tile group"
                >
                  <span className="gallery-tile-image">
                    <Image
                      src={`/gallery/${img.src}`}
                      alt={alt}
                      fill
                      sizes={sizes}
                      className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/15 group-focus-visible:bg-charcoal/15 transition-colors duration-300"
                    />
                  </span>
                  <span className="gallery-caption"><span>{alt}</span><span aria-hidden="true">↗</span></span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          src={galleryImages[lightboxIndex].src}
          alt={locale === 'en' ? galleryImages[lightboxIndex].alt.en : galleryImages[lightboxIndex].alt.de}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex(
              (lightboxIndex - 1 + galleryImages.length) % galleryImages.length,
            )
          }
          onNext={() =>
            setLightboxIndex((lightboxIndex + 1) % galleryImages.length)
          }
          prevLabel={t('prev')}
          nextLabel={t('next')}
          closeLabel={t('close')}
        />
      )}
    </section>
  )
}
