/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
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
        reading: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Rounded"', '"SF Pro Text"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
