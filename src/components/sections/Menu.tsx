'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { menu, MenuCategory } from '@/data/menu'
import DietaryGlyph from '@/components/ui/DietaryGlyph'

const categories: MenuCategory[] = ['starters', 'mains', 'desserts', 'drinks']
const categoryImages = { starters: 'tandoor.jpg', mains: 'butter-chicken.jpg', desserts: 'dessert.jpg', drinks: 'thali.jpg' }

export default function Menu() {
  const t = useTranslations('menu')
  const locale = useLocale()
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('starters')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const vegLabel = t('veg')
  const spicyLabel = t('spicy')

  return (
    <section id="menu" className="menu-section section-padding">
      <div className="page-width">
        <div className="section-heading-row">
          <div><p className="section-eyebrow">02 / {t('label')}</p><h2 className="display-title">{t('title')}<br /><em>{t('title_accent')}</em></h2></div>
          <p className="body-copy menu-intro">{t('intro')}</p>
        </div>
        <div className="menu-layout">
          <figure className="menu-photo">
            <Image key={activeCategory} src={`/gallery/${categoryImages[activeCategory]}`} alt={t(`image_alt.${activeCategory}`)} fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover animate-fade" />
            <figcaption><span>{t('photo_note')}</span><span>{t(`categories.${activeCategory}`)}</span></figcaption>
          </figure>
          <div className="menu-content">
            <div role="tablist" aria-label={t('label')} className="menu-tabs">
              {categories.map((cat, index) => (
                <button key={cat} ref={(el) => { tabRefs.current[index] = el }} type="button" role="tab" aria-selected={activeCategory === cat} aria-controls={`menu-panel-${cat}`} id={`menu-tab-${cat}`} tabIndex={activeCategory === cat ? 0 : -1}
                  onClick={() => setActiveCategory(cat)}
                  onKeyDown={(event) => {
                    const next = event.key === 'ArrowRight' ? (index + 1) % categories.length : event.key === 'ArrowLeft' ? (index + categories.length - 1) % categories.length : event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : null
                    if (next === null) return
                    event.preventDefault()
                    setActiveCategory(categories[next])
                    tabRefs.current[next]?.focus()
                  }}
                >{t(`categories.${cat}`)}</button>
              ))}
            </div>
            <div key={activeCategory} role="tabpanel" tabIndex={0} id={`menu-panel-${activeCategory}`} aria-labelledby={`menu-tab-${activeCategory}`} className="menu-items animate-fade-in">
              {menu[activeCategory].map((item, index) => (
                <article key={item.id} className="menu-item">
                  <span className="menu-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div><h3>{locale === 'en' ? item.nameEN : item.nameDE}{item.dietary && <DietaryGlyph type={item.dietary} vegLabel={vegLabel} spicyLabel={spicyLabel} />}</h3><p>{locale === 'en' ? item.descEN : item.descDE}</p></div>
                  <span className="menu-price">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(item.price)}</span>
                </article>
              ))}
            </div>
            <div className="menu-legend"><span><DietaryGlyph type="veg" vegLabel={vegLabel} spicyLabel={spicyLabel} />{vegLabel}</span><span><DietaryGlyph type="spicy" vegLabel={vegLabel} spicyLabel={spicyLabel} />{spicyLabel}</span></div>
            <p className="menu-footnote">{t('footnote')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
