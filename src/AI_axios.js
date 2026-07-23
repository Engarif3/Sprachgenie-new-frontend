import axios from "axios";
import { reportAiServiceError } from "./utils/reportClientError";

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ CRITICAL: Send httpOnly cookies automatically
});

aiApi.interceptors.request.use(
  (config) => {
    // The AI service is on a different domain than the main backend, so the
    // httpOnly session cookie never reaches it — fall back to the JWT
    // stashed in sessionStorage at login (see Login.jsx).
    const token = sessionStorage.getItem("token");
    if (token && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// The AI microservice is a separate, far-less-trafficked deployment from the
// Main Backend, so it's worth knowing when it's unreachable specifically —
// report it under its own category (AI_SERVICE_ERROR) rather than letting it
// go unnoticed (this instance previously had no response interceptor at all).
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Deliberately cancelled requests (e.g. a paragraph-generation abort
    // controller superseding a stale request) also have no `error.response`
    // but aren't a failure worth reporting.
    if (!error.response && !axios.isCancel(error)) {
      reportAiServiceError({
        message: `Network error calling AI service ${error.config?.url || "unknown endpoint"}: ${error.message || "request failed"}`,
        path: error.config?.url,
      });
    }

    return Promise.reject(error);
  },
);

export default aiApi;
