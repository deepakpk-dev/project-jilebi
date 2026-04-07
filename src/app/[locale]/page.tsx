import { setRequestLocale } from 'next-intl/server'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'
import Reservation from '@/components/sections/Reservation'
import Gallery from '@/components/sections/Gallery'
import Footer from '@/components/sections/Footer'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main>
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Gallery />
      <Footer />
    </main>
  )
}
