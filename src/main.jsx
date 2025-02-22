import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./Routes/Routes";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import Providers from "./lib/Providers/Providers";
// import AuthProvider from "./providers/AuthProvider";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Providers>
      <HelmetProvider>
        <RouterProvider router={router}>
          <Toaster position="top-center" />
        </RouterProvider>
      </HelmetProvider>
    </Providers>
  </React.StrictMode>
);
