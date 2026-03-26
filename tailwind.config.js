/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green:     "#1B3A1E",
          "green-mid": "#243F27",
          "green-dark": "#111E12",
          cream:     "#F4EFE4",
          "cream-dim": "#D9D1C0",
          orange:    "#E07830",
          "orange-light": "#F0924A",
        },
      },
      fontFamily: {
        serif:  ['"Playfair Display"', "Georgia", "serif"],
        script: ['"Dancing Script"', "cursive"],
        sans:   ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
