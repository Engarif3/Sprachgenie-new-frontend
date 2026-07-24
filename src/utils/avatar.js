export const AVATAR_COUNT = 20;

export const AVATAR_IDS = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`,
);

export const avatarAssetUrl = (avatarId) => `/avatars/${avatarId}.svg`;

// `/auth/me` returns a lowercase role, but `/user/me` echoes the raw Prisma
// enum (uppercase) — normalize so callers don't have to care which one fed
// this user object.
const normalizeRole = (role) => String(role || "").trim().toLowerCase();

// Whether THIS PARTICULAR user (by their own role) is currently allowed to
// show an uploaded photo — SUPER_ADMIN always can; ADMIN and BASIC_USER are
// each gated by their own independent toggle in ProfileSettings.
export const isImageUploadAllowedForUser = (user, settings) => {
  const role = normalizeRole(user?.role);

  if (role === "super_admin") {
    return true;
  }

  if (role === "admin") {
    return settings?.allowImageUploadAdmin ?? true;
  }

  return settings?.allowImageUploadBasicUser ?? true;
};

// Single source of truth for "what image should this user's avatar show,"
// used everywhere a profile photo is rendered (navbar, dashboard, admin
// tables). A chosen preset avatar always wins over an uploaded photo — see
// user.sevice.ts's updateMyProfile for why. When uploads are disabled for
// this user's role, an uploaded photo is ignored entirely even if one
// exists. Returns null when nothing should render, so callers fall back to
// their existing initials avatar.
export const getAvatarUrl = (user, settings) => {
  if (!user) return null;

  if (user.avatarId) {
    return avatarAssetUrl(user.avatarId);
  }

  if (isImageUploadAllowedForUser(user, settings) && user.profilePhoto) {
    return user.profilePhoto;
  }

  return null;
};
