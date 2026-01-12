// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "tailwindcss";

// // https://vite.dev/config/
// export default defineConfig({
//   server: {
//     // Allow connections from outside the container
//     port: 5173, // Set the port to 3001 (or another port you prefer)
//   },
//   plugins: [react()],
//   css: {
//     postcss: {
//       plugins: [tailwindcss()],
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and React Router into a separate chunk
          react: ["react", "react-dom", "react-router-dom"],
          // Split UI libraries
          ui: ["lucide-react"],
          // Split SweetAlert2 (large library)
          swal: ["sweetalert2"],
          // Split GSAP and animation libraries
          animations: ["gsap", "motion"],
          // Split utilities
          utils: ["axios", "idb", "pako"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
