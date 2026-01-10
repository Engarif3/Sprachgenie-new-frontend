import api from "../axios";

// ✅ NO localStorage needed - tokens in httpOnly cookies
// User info will come from API calls, not from decoding client-side tokens

let cachedUserInfo = null;

export const storeUserInfo = (userInfo) => {
  // ✅ Store user metadata in memory (not token)
  cachedUserInfo = userInfo;
  return userInfo;
};

export const getUserInfo = () => {
  // ✅ Return cached user info (set after login)
  return cachedUserInfo;
};

export const isLoggedIn = () => {
  // ✅ Check if user info exists in cache
  return !!cachedUserInfo;
};

export const removeUser = async () => {
  // ✅ Call logout endpoint to clear httpOnly cookies
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });
    cachedUserInfo = null;
  } catch (error) {
    console.error("Logout error:", error);
    cachedUserInfo = null;
  }
};

export const getNewAccessToken = async () => {
  // ✅ Refresh token sent automatically via httpOnly cookie
  return await api.post("/auth/refresh-token", {}, { withCredentials: true });
};
