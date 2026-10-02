/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        magic: {
          dark: '#0f141c',
          card: '#18202d',
          gold: '#cba358',
          goldLight: '#f3d38c',
          crimson: '#740001',
          emerald: '#1a472a',
          bronze: '#946b2d',
          amber: '#d3a625',
          parchment: {
            DEFAULT: '#fbf6ea',
            light: '#fffdf8',
            dark: '#f0e6cf',
            border: '#dec9a5'
          }
        }
      },
      fontFamily: {
        magical: ['"Cinzel"', '"Cinzel Decorative"', 'Georgia', 'serif'],
        reading: ['"Lora"', '"Merriweather"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(203, 163, 88, 0.45)',
        'glow-parchment': '0 4px 20px rgba(100, 65, 23, 0.15)',
        'magic-card': '0 8px 30px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
