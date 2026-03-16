/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8ec',
          100: '#f9ecd0',
          200: '#f3d79e',
          300: '#ecc069',
          400: '#e5a536',
          500: '#df8d1a', // Gold accent
          600: '#c67013',
          700: '#a55415',
          800: '#844218',
          900: '#6a3617',
          950: '#3d1c09',
        },
        navy: {
          900: '#0a192f',
          950: '#050c18',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
