/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",      // le fichier App
    "./app/**/*.{js,jsx,ts,tsx}", // toutes les pages Expo Router
    "./components/**/*.{js,jsx,ts,tsx}" // tes composants partagés
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
