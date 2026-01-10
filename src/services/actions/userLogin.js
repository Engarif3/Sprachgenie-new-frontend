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

  // Handle rate limit (429) or other non-JSON responses
  if (res.status === 429) {
    const errorText = await res.text();
    return {
      success: false,
      message: errorText || "Too many login attempts, please try again later",
    };
  }

  // Check if response is JSON
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const errorText = await res.text();
    return {
      success: false,
      message: errorText || "An unexpected error occurred",
    };
  }

  const loggedInInfo = await res.json();
  return loggedInInfo;
};
