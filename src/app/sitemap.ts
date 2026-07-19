import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const page = (path: string, priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
    alternates: {
      languages: {
        de: `${SITE_URL}/de${path.replace(/^\/(de|en)/, '')}`,
        en: `${SITE_URL}/en${path.replace(/^\/(de|en)/, '')}`,
      },
    },
  })

  return [
    page('/de', 1),
    page('/en', 1),
    page('/de/impressum', 0.3),
    page('/en/impressum', 0.3),
    page('/de/datenschutz', 0.3),
    page('/en/datenschutz', 0.3),
  ]
}
