import "./i18n";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import ScrollToTop from "./ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import RadioMiniPlayer from "./View/Radio/RadioMiniPlayer";
import VisitorLocationConsent, {
  getStoredLocationConsent,
  setStoredLocationConsent,
} from "./components/VisitorLocationConsent";
import { requestBrowserGeolocation } from "./utils/browserGeolocation";
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

// Runs in every open tab of every logged-in user, each one passing through
// the backend's Redis-backed rate limiter — the focus/visibilitychange
// triggers elsewhere in this file already catch a session change the
// moment someone comes back to the tab, so this periodic timer only needs
// to cover a tab left open and idle in the background; 3 minutes instead
// of 1 cuts that idle-tab cost by two thirds with no user-visible effect.
const AUTH_SYNC_INTERVAL_MS = 180000;
const VISITOR_TRACK_DELAY_MS = 1500;
// Gates the exact-GPS request to once per tab session — without this, every
// refresh re-triggers navigator.geolocation.getCurrentPosition(), which
// re-shows the browser's native permission prompt each time.
const LOCATION_SESSION_CAPTURED_KEY = "sg_visitor_location_captured_session";
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
  const noHeaderFooter = ["/login", "/register"].some((p) =>
    location.pathname.startsWith(p),
  );

  const [locationConsent, setLocationConsent] = useState(() =>
    getStoredLocationConsent(),
  );
  const hasGrantedLocation = locationConsent === "granted";

  const handleLocationConsentDecision = (granted) => {
    const value = granted ? "granted" : "denied";
    setStoredLocationConsent(value);
    setLocationConsent(value);
  };

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
        let alreadyCapturedThisSession = false;
        try {
          alreadyCapturedThisSession = Boolean(
            window.sessionStorage.getItem(LOCATION_SESSION_CAPTURED_KEY),
          );
        } catch {
          // Storage disabled (e.g. private browsing) — fall back to
          // requesting once for this page load, same as before this change.
        }

        const shouldCaptureGeolocation =
          hasGrantedLocation && !alreadyCapturedThisSession;

        const browserGeolocation = shouldCaptureGeolocation
          ? await requestBrowserGeolocation()
          : null;

        if (shouldCaptureGeolocation) {
          try {
            window.sessionStorage.setItem(LOCATION_SESSION_CAPTURED_KEY, "1");
          } catch {
            // Ignore — worst case we ask again next reload.
          }
        }

        await publicApi.post(
          "/visitors/track",
          browserGeolocation
            ? { registrationMetadata: { browserGeolocation } }
            : undefined,
        );
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
  }, [hasGrantedLocation]);

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

      // Passive refresh (fires on every tab focus + every 60s) — a stray
      // 401 here shouldn't force-logout someone mid-edit on another page.
      await syncCurrentUser({ forceLogoutOn401: false });
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

      {!noHeaderFooter && locationConsent === null && (
        <VisitorLocationConsent onDecision={handleLocationConsentDecision} />
      )}

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
