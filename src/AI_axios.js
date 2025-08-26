import axios from "axios";

const aiApi = axios.create({
  //   baseURL: "http://localhost:5000",
  baseURL: "https://sprachgenie-ai.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default aiApi;
