import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:3000",
  // baseURL: "https://sprcahgenie-new-backend.vercel.app",
  baseURL: "https://sprcahgenie-new-backend.vercel.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, //
});

export default api;
