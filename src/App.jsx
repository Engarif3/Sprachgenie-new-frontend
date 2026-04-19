import "./i18n";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import ScrollToTop from "./ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import RadioMiniPlayer from "./View/Radio/RadioMiniPlayer";
import Swal from "sweetalert2";
import { publicApi } from "./axios";
import {
  hasAuthSessionHint,
  markAuthBootstrapResolved,
  syncCurrentUser,
} from "./services/auth.services";
import { RadioPlayerProvider } from "./context/RadioPlayerContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

const AUTH_SYNC_INTERVAL_MS = 60000;
const VISITOR_TRACK_DELAY_MS = 1500;
const DarkVeil = lazy(() => import("./View/Home/DarkVeil"));

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const showGlobalDarkVeil = isDark && location.pathname === "/";
  const appBackgroundClass = isDark
    ? showGlobalDarkVeil
      ? "bg-transparent"
      : "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950"
    : "bg-gray-50";

  // Same auth & env logic...
  useEffect(() => {
    const requiredEnvVars = [
      "VITE_BACKEND_API_URL",
      "VITE_DELETE_PASSWORD",
      "VITE_ADMIN_EMAILS",
    ];
    const missingVars = requiredEnvVars.filter((v) => !import.meta.env[v]);
    if (missingVars.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Configuration Error",
        text: `Missing required environment variables: ${missingVars.join(
          ", ",
        )}`,
        allowOutsideClick: false,
      });
    }
  }, []);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        await publicApi.post("/visitors/track");
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    let timeoutId;
    let idleCallbackId;

    const scheduleTrackVisitor = () => {
      void trackVisitor();
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(scheduleTrackVisitor, {
        timeout: VISITOR_TRACK_DELAY_MS,
      });
    } else {
      timeoutId = window.setTimeout(
        scheduleTrackVisitor,
        VISITOR_TRACK_DELAY_MS,
      );
    }

    return () => {
      if (typeof idleCallbackId === "number") {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const handleLogoutNavigation = () => {
      navigate("/login");
    };

    window.addEventListener("auth:logout", handleLogoutNavigation);

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (hasAuthSessionHint()) {
          await syncCurrentUser();
        }
      } finally {
        if (isMounted) {
          markAuthBootstrapResolved();
        }
      }
    };

    const syncVisibleSession = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (!hasAuthSessionHint()) {
        return;
      }

      await syncCurrentUser();
    };

    initializeAuth();

    const intervalId = window.setInterval(
      syncVisibleSession,
      AUTH_SYNC_INTERVAL_MS,
    );
    window.addEventListener("focus", syncVisibleSession);
    document.addEventListener("visibilitychange", syncVisibleSession);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", handleLogoutNavigation);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncVisibleSession);
      document.removeEventListener("visibilitychange", syncVisibleSession);
    };
  }, [navigate]);

  const noHeaderFooter = ["/login", "/register"].some((p) =>
    location.pathname.startsWith(p),
  );

  return (
    <div className={`relative min-h-screen ${appBackgroundClass}`}>
      {/* Dark mode overlay */}
      {showGlobalDarkVeil && (
        <>
          <div className="fixed inset-0 -z-20 bg-slate-950" />
          <div className="fixed inset-0 -z-10">
            <Suspense fallback={null}>
              <DarkVeil />
            </Suspense>
          </div>
        </>
      )}

      <ScrollToTop />
      {!noHeaderFooter && <NavBar />}

      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Outlet />
      </Suspense>

      {!noHeaderFooter && <Footer />}
      {!noHeaderFooter && <RadioMiniPlayer />}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RadioPlayerProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </RadioPlayerProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
