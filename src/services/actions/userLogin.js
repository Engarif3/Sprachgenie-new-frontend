export const userLogin = async (loginData) => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
      // cache: "no-store",
      credentials: "include",
    }
  );

  // Check if response is JSON
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  // Read Retry-After header if present
  const retryAfterHeader =
    res.headers.get("retry-after") || res.headers.get("Retry-After");
  const retryAfter = retryAfterHeader
    ? parseInt(retryAfterHeader, 10)
    : undefined;

  // Handle rate limit (429) or other error responses
  if (!res.ok) {
    const status = res.status;
    if (isJson) {
      const errorData = await res.json();
      return {
        success: false,
        status,
        message: errorData.message || "An error occurred",
        retryAfter,
      };
    } else {
      const errorText = await res.text();
      return {
        success: false,
        status,
        message: errorText || "An unexpected error occurred",
        retryAfter,
      };
    }
  }

  // Parse successful response
  const loggedInInfo = await res.json();
  return loggedInInfo;
};
