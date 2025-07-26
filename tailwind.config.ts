import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'brand-blue': '#93BEE6',
        'brand-light': '#B8D4F0',
        'brand-dark': '#6B9BD9',
      },
    },
  },
  plugins: [],
}
export default config
