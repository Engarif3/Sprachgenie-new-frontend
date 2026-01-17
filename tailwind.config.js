// /** @type {import('tailwindcss').Config} */
// import daisyui from "daisyui";
// export default {
//   content: ["./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {
//       fontFamily: {
//         custom1: ["Domine"],
//         custom2: ["Amaranth"],
//         custom3: ["Oswald"],
//         custom4: ["Ubuntu"],
//         custom5: ["Rubik"],
//       },
//     },
//   },
//   plugins: [daisyui],
// };
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
      // --- ADD THIS SECTION ---
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg) translate(-50%, -50%)" },
          "100%": { transform: "rotate(360deg) translate(-50%, -50%)" },
        },
      },
      animation: { rotate: "rotate 5s linear infinite" },
      // ------------------------
    },
  },
  plugins: [daisyui],
};
