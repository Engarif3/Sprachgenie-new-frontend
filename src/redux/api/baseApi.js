import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../../helpers/axios/axiosBaseQuery";

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({
    baseUrl:
      import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api/v1",
  }),
  endpoints: () => ({}),
});
