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
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default aiApi;
