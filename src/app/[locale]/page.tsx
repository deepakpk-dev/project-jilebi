import { setRequestLocale } from 'next-intl/server'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'
import Reservation from '@/components/sections/Reservation'
import Gallery from '@/components/sections/Gallery'
import Footer from '@/components/sections/Footer'
import { SITE_URL } from '@/lib/site'

// schema.org/Restaurant structured data. Every value is a static literal that
// mirrors the visible Footer (address/phone) and the seeded opening hours —
// Google flags markup that contradicts the page. Do not interpolate any
// user/db-derived string here without escaping '<'.
function restaurantJsonLd(locale: string) {
  const serviceDays = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Jilebi',
    servesCuisine: 'Indian',
    priceRange: '€€',
    url: `${SITE_URL}/${locale}`,
    image: `${SITE_URL}/hero.jpg`,
    telephone: '+49 7022 904 030',
    email: 'info@jilebi.de',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Marktstraße 8',
      postalCode: '72622',
      addressLocality: 'Nürtingen',
      addressCountry: 'DE',
    },
    acceptsReservations: 'True',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: serviceDays,
        opens: '12:00',
        closes: '14:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: serviceDays,
        opens: '18:00',
        closes: '22:00',
      },
    ],
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main id="main">
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Gallery />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(locale)) }}
      />
    </main>
  )
}
