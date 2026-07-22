export const AVATAR_COUNT = 20;

export const AVATAR_IDS = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`,
);

export const avatarAssetUrl = (avatarId) => `/avatars/${avatarId}.svg`;

// Single source of truth for "what image should this user's avatar show,"
// used everywhere a profile photo is rendered (navbar, dashboard, admin
// tables). A chosen preset avatar always wins over an uploaded photo — see
// user.sevice.ts's updateMyProfile for why. When uploads are disabled
// site-wide, an uploaded photo is ignored entirely even if one exists.
// Returns null when nothing should render, so callers fall back to their
// existing initials avatar.
export const getAvatarUrl = (user, allowImageUpload) => {
  if (!user) return null;

  if (user.avatarId) {
    return avatarAssetUrl(user.avatarId);
  }

  if (allowImageUpload && user.profilePhoto) {
    return user.profilePhoto;
  }

  return null;
};
