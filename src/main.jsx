import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./Routes/Routes";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import Providers from "./lib/Providers/Providers";

// When a new deployment changes chunk filenames, users with the old version
// loaded will get a 404 on lazy-imported chunks. Reload automatically to
// pick up the new build instead of showing a crash screen.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Providers>
      <HelmetProvider>
        <RouterProvider router={router}>
          <Toaster position="top-center" />
        </RouterProvider>
      </HelmetProvider>
    </Providers>
  </React.StrictMode>,
);
