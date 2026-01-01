import axios from "axios";
import Swal from "sweetalert2";

const api = axios.create({
  // baseURL: "http://localhost:3000",
  baseURL: "https://sprcahgenie-new-backend.vercel.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
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
