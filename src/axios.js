import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "sonner";
import {
  clearUserInfo,
  queueForcedLogoutNotice,
} from "./services/auth.services";
import { reportClientError } from "./utils/reportClientError";

const backendBaseURL =
  import.meta.env.VITE_BACKEND_API_URL || "https://api.simplegerman.de/api/v1";

// Stable per-browser UUID stored in localStorage so the backend can identify
// returning visitors accurately even when multiple users share the same IP.
const getOrCreateVisitorId = () => {
  try {
    const KEY = "sg_vid";
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // private/incognito mode may block localStorage
  }
};

const applyFormDataInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error) => Promise.reject(error),
  );
};

const api = axios.create({
  baseURL: backendBaseURL,
  // Don't set default Content-Type header
  // Let axios/browser automatically set it based on data type:
  // - JSON objects → application/json
  // - FormData → multipart/form-data
  withCredentials: true, // ✅ CRITICAL: Send httpOnly cookies automatically
});

export const publicApi = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
});

export const externalApi = axios.create({
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

applyFormDataInterceptor(publicApi);

// ✅ Request interceptor: Add auth token from localStorage as fallback if cookies don't work
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const visitorId = getOrCreateVisitorId();
    if (visitorId) config.headers["x-visitor-id"] = visitorId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

publicApi.interceptors.request.use((config) => {
  const visitorId = getOrCreateVisitorId();
  if (visitorId) config.headers["x-visitor-id"] = visitorId;
  return config;
});

applyFormDataInterceptor(api);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // The request never reached the backend (network error, timeout, CORS
    // failure) — the backend can't log what it never saw, so only the
    // frontend knows this happened.
    if (!error.response) {
      reportClientError({
        message: `Network error calling ${error.config?.url || "unknown endpoint"}: ${error.message || "request failed"}`,
        path: error.config?.url,
      });
    }

    // Handle 401 Unauthorized - redirect to login with SPA-friendly navigation
    if (error.response?.status === 401) {
      queueForcedLogoutNotice({
        icon: "warning",
        title: "Logged out",
        text:
          error.response?.data?.message ||
          "Your access changed or your session expired. Please log in again.",
      });
      clearUserInfo();
      window.dispatchEvent(new CustomEvent("auth:logout"));
      // Fallback for non-SPA contexts
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text:
          error.response?.data?.message ||
          "You don't have permission for this action",
      });
    }

    // Handle 429 Too Many Requests - show a non-blocking toast instead of modal
    if (error.response?.status === 429) {
      const message =
        error.response?.data?.message ||
        "Too many requests. Please try again later.";
      const retryAfter =
        error.response?.data?.retryAfter ||
        error.response?.headers?.["retry-after"] ||
        null;
      // Show a brief toast instead of blocking modal
      toast.error(message);
      // Attach retry info so component can use it
      error.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // Most 404s are expected, don't show global alert
      return Promise.reject(error);
    }

    // Handle 500+ Server errors
    if (error.response?.status >= 500) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Please try again later or contact support",
      });
    }

    return Promise.reject(error);
  },
);

export default api;
