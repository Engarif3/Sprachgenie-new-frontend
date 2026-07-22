import { useCallback, useEffect, useState } from "react";
import api from "../axios";
import { useAuth } from "../services/auth.services";

// Whether custom profile-photo uploads are currently allowed, set by a
// super admin. Every place that renders an avatar needs this to decide
// between an uploaded photo and a preset/initials fallback (see
// utils/avatar.js's getAvatarUrl). Defaults to true while loading so
// avatars don't flicker to a fallback on first render.
export const useProfileSettings = () => {
  const { isLoggedIn } = useAuth();
  const [allowImageUpload, setAllowImageUpload] = useState(true);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/profile-settings");
      setAllowImageUpload(res.data?.data?.allowImageUpload ?? true);
    } catch {
      // Leave the last known value — avatars just keep rendering as before.
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { allowImageUpload, loading, refetch };
};

export default useProfileSettings;
