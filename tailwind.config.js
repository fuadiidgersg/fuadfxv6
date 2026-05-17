/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-main': '#06080f',
        'bg-sidebar': '#0d1117',
        'bg-card': '#0d1117',
        'border-color': '#1c2128',
        'accent': '#3b82f6',
      }
    },
  },
  plugins: [],
}