import api, { publicApi } from "../axios";
import { useSyncExternalStore } from "react";

const FORCED_LOGOUT_NOTICE_KEY = "forcedLogoutNotice";
const EMPTY_USER_INFO = Object.freeze({});

// ✅ NO localStorage needed - tokens in httpOnly cookies
// User info will come from API calls, not from decoding client-side tokens

let authStore = {
  userInfo: null,
  isBootstrapResolved: false,
};
const authListeners = new Set();

export const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

export const hasAllowedRole = (currentRole, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  const normalizedCurrentRole = normalizeRole(currentRole);

  return allowedRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean)
    .includes(normalizedCurrentRole);
};

export const isAdminRole = (role) =>
  hasAllowedRole(role, ["admin", "super_admin"]);

const createAuthState = (userInfo, isBootstrapResolved = false) => {
  const safeUserInfo = userInfo ?? EMPTY_USER_INFO;
  const userId = safeUserInfo.id ?? null;
  const userRole = normalizeRole(safeUserInfo.role);

  return {
    userInfo,
    safeUserInfo,
    userId,
    userRole,
    isLoggedIn: !!userInfo,
    isAdmin: isAdminRole(userRole),
    isSuperAdmin: userRole === "super_admin",
    isBasicUser: userRole === "basic_user",
    hasRole: (allowedRoles) => hasAllowedRole(userRole, allowedRoles),
    isBootstrapResolved,
  };
};

const notifyAuthListeners = () => {
  authListeners.forEach((listener) => listener());
};

const setAuthStore = (partialState) => {
  authStore = {
    ...authStore,
    ...partialState,
  };
  notifyAuthListeners();
  return authStore;
};

const setCachedUserInfo = (userInfo) => {
  setAuthStore({ userInfo });
  return authStore.userInfo;
};

const subscribeToAuthStore = (listener) => {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
};

const getAuthSnapshot = () => authStore;

export const storeUserInfo = (userInfo) => {
  // ✅ Store user metadata in memory (not token)
  return setCachedUserInfo(userInfo);
};

export const getUserInfo = () => {
  // ✅ Return cached user info (set after login)
  return authStore.userInfo;
};

export const getSafeUserInfo = () => getAuthState().safeUserInfo;

export const isLoggedIn = () => {
  // ✅ Check if user info exists in cache
  return !!authStore.userInfo;
};

export const getAuthState = () =>
  createAuthState(authStore.userInfo, authStore.isBootstrapResolved);

export const clearUserInfo = () => {
  setCachedUserInfo(null);
};

export const markAuthBootstrapResolved = () => {
  if (authStore.isBootstrapResolved) {
    return;
  }

  setAuthStore({ isBootstrapResolved: true });
};

export const queueForcedLogoutNotice = ({
  title = "Logged out",
  text = "Your session is no longer valid. Please sign in again.",
  icon = "info",
} = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    FORCED_LOGOUT_NOTICE_KEY,
    JSON.stringify({ title, text, icon }),
  );
};

export const consumeForcedLogoutNotice = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawNotice = window.sessionStorage.getItem(FORCED_LOGOUT_NOTICE_KEY);

  if (!rawNotice) {
    return null;
  }

  window.sessionStorage.removeItem(FORCED_LOGOUT_NOTICE_KEY);

  try {
    return JSON.parse(rawNotice);
  } catch (error) {
    return null;
  }
};

export const useAuth = () => {
  const snapshot = useSyncExternalStore(
    subscribeToAuthStore,
    getAuthSnapshot,
    getAuthSnapshot,
  );

  return createAuthState(snapshot.userInfo, snapshot.isBootstrapResolved);
};

export const syncCurrentUser = async ({ preserveOnFailure = true } = {}) => {
  try {
    const response = await publicApi.get("/auth/me");
    const data = response.data;

    if (data?.data) {
      return storeUserInfo(data.data);
    }

    return setCachedUserInfo(null);
  } catch (error) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      if (authStore.userInfo) {
        queueForcedLogoutNotice({
          title: "Logged out",
          text: "Your account access changed. Please sign in again.",
          icon: "info",
        });
      }

      clearUserInfo();
      return null;
    }

    if (!preserveOnFailure) {
      clearUserInfo();
    }

    return authStore.userInfo;
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
