/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
      colors: {
        green: {
          950: '#014d26',
          900: '#016633',
          800: '#01a050',
          400: '#4ade80',
        },
        navy: {
          950: '#020810',
          900: '#050d1a',
          800: '#0a1628',
          700: '#0d2137',
        },
      },
    },
  },
  plugins: [],
}
