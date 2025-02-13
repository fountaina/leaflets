/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./views/partials/*.{html,js,ejs}",
    "./views/*.{html,js,ejs}"
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["light", "dark", "cupcake"],
  },
  plugins: [require("daisyui")],
}