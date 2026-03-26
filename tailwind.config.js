/** @type {import('tailwindcss').Config} */
// In Tailwind v4, brand colors and fonts are defined via @theme in index.css.
// This file only needs to declare the content paths for class scanning.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}
