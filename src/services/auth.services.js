import api from "../axios";
import { useSyncExternalStore } from "react";

// ✅ NO localStorage needed - tokens in httpOnly cookies
// User info will come from API calls, not from decoding client-side tokens

let cachedUserInfo = null;
const authListeners = new Set();

const notifyAuthListeners = () => {
  authListeners.forEach((listener) => listener());
};

const setCachedUserInfo = (userInfo) => {
  cachedUserInfo = userInfo;
  notifyAuthListeners();
  return cachedUserInfo;
};

const subscribeToAuthStore = (listener) => {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
};

const getAuthSnapshot = () => cachedUserInfo;

export const storeUserInfo = (userInfo) => {
  // ✅ Store user metadata in memory (not token)
  return setCachedUserInfo(userInfo);
};

export const getUserInfo = () => {
  // ✅ Return cached user info (set after login)
  return cachedUserInfo;
};

export const isLoggedIn = () => {
  // ✅ Check if user info exists in cache
  return !!cachedUserInfo;
};

export const clearUserInfo = () => {
  setCachedUserInfo(null);
};

export const useAuth = () => {
  const userInfo = useSyncExternalStore(
    subscribeToAuthStore,
    getAuthSnapshot,
    getAuthSnapshot,
  );

  return {
    userInfo,
    isLoggedIn: !!userInfo,
  };
};

export const syncCurrentUser = async ({ preserveOnFailure = true } = {}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/auth/me`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      return data?.data ? storeUserInfo(data.data) : setCachedUserInfo(null);
    }

    if (response.status === 401 || response.status === 403) {
      clearUserInfo();
      return null;
    }

    if (!preserveOnFailure) {
      clearUserInfo();
    }

    return cachedUserInfo;
  } catch (error) {
    if (!preserveOnFailure) {
      clearUserInfo();
    }

    return preserveOnFailure ? cachedUserInfo : null;
  }
};

export const removeUser = async () => {
  // ✅ Call logout endpoint to clear httpOnly cookies
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearUserInfo();
  }
};

export const getNewAccessToken = async () => {
  // ✅ Refresh token sent automatically via httpOnly cookie
  return await api.post("/auth/refresh-token", {}, { withCredentials: true });
};
