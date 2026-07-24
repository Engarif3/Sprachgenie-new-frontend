import { useCallback, useEffect, useState } from "react";
import api from "../axios";
import { useAuth } from "../services/auth.services";

const DEFAULT_SETTINGS = {
  allowImageUploadAdmin: true,
  allowImageUploadBasicUser: true,
};

// Whether custom profile-photo uploads are currently allowed for ADMIN and
// BASIC_USER accounts, each toggled independently by a super admin (who can
// always upload regardless). Every place that renders an avatar needs this
// to decide between an uploaded photo and a preset/initials fallback — see
// utils/avatar.js's getAvatarUrl/isImageUploadAllowedForUser. Defaults to
// allowed while loading so avatars don't flicker to a fallback on first
// render.
export const useProfileSettings = () => {
  const { isLoggedIn } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/profile-settings");
      const data = res.data?.data;
      setSettings({
        allowImageUploadAdmin: data?.allowImageUploadAdmin ?? true,
        allowImageUploadBasicUser: data?.allowImageUploadBasicUser ?? true,
      });
    } catch {
      // Leave the last known value — avatars just keep rendering as before.
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { settings, loading, refetch };
};

export default useProfileSettings;
