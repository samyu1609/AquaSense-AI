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
        aqua: {
          50: '#f0fdfc',
          100: '#ccfbf7',
          200: '#99f6ed',
          300: '#5eead4',
          400: '#35C9CF',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#0E4A56',
          900: '#072B34',
          950: '#051F26',
        },
        sand: '#E8DFC8',
      },
    },
  },
  plugins: [],
}
