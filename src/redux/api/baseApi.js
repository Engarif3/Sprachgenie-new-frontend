import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../../helpers/axios/axiosBaseQuery";

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({
    baseUrl: "https://sprcahgenie-new-backend.vercel.app/api/v1",
  }),
  endpoints: () => ({}),
});
