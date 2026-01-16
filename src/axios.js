import axios from "axios";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ CRITICAL: Send httpOnly cookies automatically
});

// ✅ NO Authorization header needed - cookies are sent automatically
// Request interceptor removed - httpOnly cookies handle authentication

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
  }
);

export default api;
