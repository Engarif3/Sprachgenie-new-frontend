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

  // Handle rate limit (429) or other error responses
  if (!res.ok) {
    if (isJson) {
      const errorData = await res.json();
      return {
        success: false,
        message: errorData.message || "An error occurred",
      };
    } else {
      const errorText = await res.text();
      return {
        success: false,
        message: errorText || "An unexpected error occurred",
      };
    }
  }

  // Parse successful response
  const loggedInInfo = await res.json();
  return loggedInInfo;
};
