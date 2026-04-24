import { Link } from '@/i18n/navigation'

export default function DatenschutzPage({ params }: { params: { locale: string } }) {
  return (
    <main className="section-padding max-w-2xl mx-auto">
      {params.locale === 'en' && (
        <p className="text-xs text-muted mb-6 italic">
          This page is only available in German as required by German law (TMG § 5).
        </p>
      )}
      <h1 className="section-title mb-6">Datenschutzerklärung</h1>

      <div className="text-sm text-muted leading-relaxed space-y-6">
        <section>
          <h2 className="text-charcoal font-medium mb-2">1. Verantwortlicher</h2>
          <p>Jilebi Restaurant, Musterstraße 1, 72622 Nürtingen (info@jilebi.de)</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">2. Erhobene Daten bei Tischreservierungen</h2>
          <p>Bei einer Tischreservierung erheben wir folgende personenbezogene Daten: Name, E-Mail-Adresse, Telefonnummer, Personenanzahl, gewünschtes Datum und Uhrzeit sowie optionale Anmerkungen. Diese Daten werden ausschließlich zur Bearbeitung Ihrer Reservierungsanfrage verwendet.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">3. Rechtsgrundlage</h2>
          <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">4. Speicherdauer</h2>
          <p>Reservierungsdaten werden nach Ablauf von 6 Monaten nach dem Reservierungsdatum gelöscht.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">5. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung. Wenden Sie sich hierfür an info@jilebi.de.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">6. Google Maps</h2>
          <p>Diese Website verwendet Google Maps zur Darstellung unseres Standorts. Anbieter: Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Datenschutzerklärung: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-charcoal transition-colors">policies.google.com/privacy</a></p>
        </section>
      </div>

      <Link href="/" className="inline-block mt-8 text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors">
        ← Zurück
      </Link>
    </main>
  )
}
