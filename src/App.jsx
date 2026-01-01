import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import ScrollToTop from "./ScrollToTop";
import DarkVeil from "./View/Home/DarkVeil";
import Loader from "./utils/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import Swal from "sweetalert2";

const App = () => {
  const location = useLocation();

  // Validate required environment variables on app load
  useEffect(() => {
    const requiredEnvVars = [
      "VITE_BACKEND_API_URL",
      "VITE_DELETE_PASSWORD",
      "VITE_ADMIN_EMAILS",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !import.meta.env[varName]
    );

    if (missingVars.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Configuration Error",
        text: `Missing required environment variables: ${missingVars.join(
          ", "
        )}`,
        allowOutsideClick: false,
      });
    }
  }, []);

  // const noHeaderFooter =
  //   location.pathname.includes("login") || location.pathname.includes("signup");
  const noHeaderFooter = ["/login", "/register"].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        {/* DarkVeil fullscreen background */}
        <div className="fixed inset-0 -z-10">
          <DarkVeil />
        </div>

        <ScrollToTop />

        {!noHeaderFooter && <NavBar />}

        {/* Suspense here so lazy-loaded routes work */}
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          {/* <Suspense fallback={<Loader></Loader>}> */}
          <Outlet />
        </Suspense>

        {!noHeaderFooter && <Footer />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
