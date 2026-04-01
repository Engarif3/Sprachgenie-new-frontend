import { publicApi } from "../../axios";

export const userLogin = async (loginData) => {
  try {
    const response = await publicApi.post("/auth/login", loginData);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const retryAfterHeader = error.response?.headers?.["retry-after"];
    const retryAfter = retryAfterHeader
      ? parseInt(retryAfterHeader, 10)
      : undefined;
    const responseData = error.response?.data;

    return {
      success: false,
      status,
      message:
        (typeof responseData === "string"
          ? responseData
          : responseData?.message) ||
        error.message ||
        "An unexpected error occurred",
      retryAfter,
    };
  }
};
