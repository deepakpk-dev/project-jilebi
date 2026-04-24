import { Link } from '@/i18n/navigation'

export default function ImpressumPage({ params }: { params: { locale: string } }) {
  return (
    <main className="section-padding max-w-2xl mx-auto">
      {params.locale === 'en' && (
        <p className="text-xs text-muted mb-6 italic">
          This page is only available in German as required by German law (TMG § 5).
        </p>
      )}
      <h1 className="section-title mb-6">Impressum</h1>

      <section className="text-sm text-muted leading-relaxed space-y-4">
        <section>
          <h2 className="text-charcoal font-medium mb-1">Angaben gemäß § 5 TMG</h2>
          <p>Jilebi Restaurant<br />
          Musterstraße 1<br />
          72622 Nürtingen<br />
          Deutschland</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-1">Kontakt</h2>
          <p>Telefon: +49 7022 123 456<br />
          E-Mail: info@jilebi.de</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-1">Verantwortlich für den Inhalt</h2>
          <p>[Ihr Name]<br />Musterstraße 1, 72622 Nürtingen</p>
        </section>
      </section>

      <Link href="/" className="inline-block mt-8 text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors">
        ← Zurück
      </Link>
    </main>
  )
}
