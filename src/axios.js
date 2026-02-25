import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "sonner";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_API_URL ||
    "https://api.simplegerman.de/api/v1",
  // Don't set default Content-Type header
  // Let axios/browser automatically set it based on data type:
  // - JSON objects → application/json
  // - FormData → multipart/form-data
  withCredentials: true, // ✅ CRITICAL: Send httpOnly cookies automatically
});

// ✅ Request interceptor: Add auth token from localStorage as fallback if cookies don't work
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If data is FormData, don't set Content-Type header
    // Let the browser handle it automatically with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // ✅ Cookies cleared server-side, just redirect
      window.location.href = "/login";
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again",
      });
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
