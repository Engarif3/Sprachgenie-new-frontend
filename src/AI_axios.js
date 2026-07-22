import axios from "axios";

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

export default aiApi;
