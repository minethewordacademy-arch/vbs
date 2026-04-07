/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enables .dark class for manual toggling
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // if you have any other folders with components, add them here
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, etc. here later
    },
  },
  plugins: [],
}