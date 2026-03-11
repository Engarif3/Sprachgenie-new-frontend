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

const frontendBuildMetadata = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __NETLIFY_CONTEXT__: JSON.stringify(process.env.CONTEXT || "unknown"),
  __NETLIFY_DEPLOY_URL__: JSON.stringify(
    process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL || "",
  ),
  __NETLIFY_BRANCH__: JSON.stringify(
    process.env.BRANCH || process.env.HEAD || "",
  ),
  __NETLIFY_COMMIT_REF__: JSON.stringify(process.env.COMMIT_REF || ""),
};

export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [react()],
  define: frontendBuildMetadata,
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
        pure_funcs: ["console.log", "console.info", "console.debug"],
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
    cssCodeSplit: true,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
