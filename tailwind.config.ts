import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FDFAF5',
        charcoal: '#1C1C1C',
        gold: '#C9923A',
        'gold-ink': '#8C631F',
        muted: '#7A6E5A',
        sand: '#E8E0D4',
        leaf: '#6F8F4A',
        chili: '#B65C3F',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
        brand: '0.25em',
      },
    },
  },
  plugins: [],
}

export default config
