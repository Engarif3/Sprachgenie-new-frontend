import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Allow connections from outside the container
    port: 5173, // Set the port to 3001 (or another port you prefer)
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
