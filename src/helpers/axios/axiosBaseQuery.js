// import { instance as axiosInstance } from "./axiosInstance";

import { instance as axiosInstance } from "./axiosInstance";

export const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: "" }) =>
  async ({ url, method, data, params, headers, contentType }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers: {
          ...headers, // Include any custom headers passed
          "Content-Type": contentType || "application/json",
        },
      });
      return result;
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
