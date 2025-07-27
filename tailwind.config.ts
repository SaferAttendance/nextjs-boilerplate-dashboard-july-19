import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)'],
      },
      colors: {
        'brand-blue': '#93BEE6',
        'brand-light': '#B8D4F0',
        'brand-dark': '#6B9BD9',
        'accent-emerald': '#10B981',
        'accent-purple': '#8B5CF6',
        'accent-orange': '#F59E0B',
        'accent-rose': '#F43F5E',
        'accent-cyan': '#06B6D4',
        'accent-indigo': '#6366F1',
        'safety-red': '#DC2626',
        'safety-green': '#059669',
      },
    },
  },
  plugins: [],
}
export default config
