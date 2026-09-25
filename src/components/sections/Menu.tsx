'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { menu, MenuCategory } from '@/data/menu'
import GoldenRule from '@/components/ui/GoldenRule'
import DietaryGlyph from '@/components/ui/DietaryGlyph'

export default function Menu() {
  const t = useTranslations('menu')
  const locale = useLocale()
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('starters')

  const categories: MenuCategory[] = ['starters', 'mains', 'desserts', 'drinks']
  const vegLabel = t('veg')
  const spicyLabel = t('spicy')

  return (
    <section id="menu" className="section-padding bg-ivory">
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-5">{t('label')}</p>
        <h2 className="section-title mb-3">{t('title')}</h2>
        <GoldenRule />

        {/* Category tabs */}
        <div
          role="tablist"
          aria-label={t('title')}
          className="mt-10 mb-10 grid grid-cols-2 border-b border-sand sm:flex sm:flex-wrap sm:gap-x-1"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`menu-panel-${cat}`}
                id={`menu-tab-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`relative min-h-11 px-3 py-3 text-xs tracking-widest uppercase transition-colors duration-200 sm:px-5 ${
                  isActive ? 'text-charcoal' : 'text-muted hover:text-charcoal'
                }`}
              >
                {t(`categories.${cat}`)}
                <span
                  aria-hidden="true"
                  className={`absolute left-5 right-5 -bottom-px h-px transition-colors duration-200 ${
                    isActive ? 'bg-gold' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-2 text-[10px] tracking-widest uppercase text-muted">
          <span className="inline-flex items-center gap-2">
            <DietaryGlyph type="veg" vegLabel={vegLabel} spicyLabel={spicyLabel} />
            {vegLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <DietaryGlyph type="spicy" vegLabel={vegLabel} spicyLabel={spicyLabel} />
            {spicyLabel}
          </span>
        </div>

        {/* Menu items */}
        <div
          key={activeCategory}
          role="tabpanel"
          id={`menu-panel-${activeCategory}`}
          aria-labelledby={`menu-tab-${activeCategory}`}
          className="divide-y divide-sand animate-fade-in"
        >
          {menu[activeCategory].map((item) => (
            <article
              key={item.id}
              className="py-6 grid grid-cols-[1fr_auto] items-baseline gap-x-6"
            >
              <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                <h3 className="font-serif italic text-lg font-normal text-charcoal leading-snug">
                  {locale === 'en' ? item.nameEN : item.nameDE}
                </h3>
                {item.dietary && (
                  <DietaryGlyph
                    type={item.dietary}
                    vegLabel={vegLabel}
                    spicyLabel={spicyLabel}
                  />
                )}
              </div>
              <span className="font-serif text-base text-charcoal tabular-nums">
                €{item.price.toFixed(2).replace('.', ',')}
              </span>
              <p className="col-span-2 mt-1 text-sm text-muted leading-relaxed max-w-prose">
                {locale === 'en' ? item.descEN : item.descDE}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
