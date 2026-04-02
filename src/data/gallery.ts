// Add your actual image filenames to /public/gallery/
// Format: { src: filename, alt: { de: string, en: string } }
export type GalleryImage = {
  src: string
  alt: { de: string; en: string }
}

export const galleryImages: GalleryImage[] = [
  { src: 'butter-chicken.jpg', alt: { de: 'Butter Chicken', en: 'Butter Chicken' } },
  { src: 'interior-1.jpg', alt: { de: 'Restaurantinnenraum', en: 'Restaurant interior' } },
  { src: 'tandoor.jpg', alt: { de: 'Tandoor-Ofen', en: 'Tandoor oven' } },
  { src: 'thali.jpg', alt: { de: 'Thali-Gericht', en: 'Thali plate' } },
  { src: 'dessert.jpg', alt: { de: 'Gulab Jamun Dessert', en: 'Gulab Jamun dessert' } },
  { src: 'interior-2.jpg', alt: { de: 'Tischdekoration', en: 'Table setting' } },
]
