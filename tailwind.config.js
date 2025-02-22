/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        custom1: ["Domine"],
        custom2: ["Amaranth"],
        custom3: ["Oswald"],
        custom4: ["Ubuntu"],
        custom5: ["Rubik"],
      },
    },
  },
  plugins: [daisyui],
};
