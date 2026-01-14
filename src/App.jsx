import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import ScrollToTop from "./ScrollToTop";
import DarkVeil from "./View/Home/DarkVeil";
import Loader from "./utils/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import Swal from "sweetalert2";
import { storeUserInfo, getUserInfo } from "./services/auth.services";
import { ThemeProvider } from "./context/ThemeContext";

const App = () => {
  const location = useLocation();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  // Fetch user info on app load if cookie exists
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip if already have user info
      if (getUserInfo()) {
        setIsAuthLoading(false);
        return;
      }

      // Skip fetch on public pages
      if (location.pathname === "/login" || location.pathname === "/register") {
        setIsAuthLoading(false);
        return;
      }

      try {
        // Try to fetch user info (cookie will be sent automatically)
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/auth/me`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.data) {
            storeUserInfo(data.data);
          }
        } else if (response.status === 401 || response.status === 403) {
          // Not logged in - expected, do not log error
        } else if (response.status >= 500) {
          // Server error - silently fail, don't block the app
          console.error("Server error during auth check:", response.status);
        } else {
          // Other errors (e.g., 4xx) - continue without auth
        }
      } catch (error) {
        // Network error or other issues - silent fail
        console.error("Auth check failed:", error.message);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();
  }, [location.pathname]);

  // Show loader while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // const noHeaderFooter =
  //   location.pathname.includes("login") || location.pathname.includes("signup");
  const noHeaderFooter = ["/login", "/register"].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="relative min-h-screen">
          {/* DarkVeil fullscreen background */}
          <div className="fixed inset-0 -z-10">
            <DarkVeil />
          </div>

          <ScrollToTop />

          {!noHeaderFooter && <NavBar />}

          {/* Suspense here so lazy-loaded routes work */}
          <Suspense
            fallback={<div className="p-8 text-center">Loading...</div>}
          >
            {/* <Suspense fallback={<Loader></Loader>}> */}
            <Outlet />
          </Suspense>

          {!noHeaderFooter && <Footer />}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
