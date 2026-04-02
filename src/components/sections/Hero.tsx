import { useTranslations } from 'next-intl'
import GoldenRule from '@/components/ui/GoldenRule'

export default function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center section-padding bg-ivory">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('eyebrow')}</p>
          <h1 className="font-serif text-5xl md:text-6xl font-normal text-charcoal leading-tight mb-2">
            {t('headline')}
          </h1>
          <p className="font-serif text-5xl md:text-6xl font-normal italic text-gold leading-tight">
            {t('headline_accent')}
          </p>
          <GoldenRule className="mt-6" />
          <p className="text-muted text-sm leading-relaxed max-w-md mt-4 mb-8">{t('tagline')}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#menu" className="btn-primary">{t('cta_menu')}</a>
            <a href="#reservation" className="btn-outline">{t('cta_reserve')}</a>
          </div>
        </div>

        {/* Hero image placeholder */}
        <div className="relative h-80 lg:h-[480px] bg-sand rounded-sm overflow-hidden flex items-center justify-center">
          {/* Replace with: <Image src="/hero.jpg" alt="Jilebi signature dish" fill className="object-cover" /> */}
          <p className="text-xs tracking-widest uppercase text-muted">Hero photo</p>
        </div>
      </div>
    </section>
  )
}
