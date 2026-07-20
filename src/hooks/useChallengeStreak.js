import { useCallback, useEffect, useState } from "react";
import api from "../axios";
import { useAuth } from "../services/auth.services";

// Fetches the current daily streak for the logged-in user. Used
// independently by both the Home page card and the NavBar streak
// indicator — each mounts this hook and fetches on its own, there is no
// shared cache. This is a decorative/secondary widget, so failures are
// swallowed silently rather than surfaced as an error popup.
export const useChallengeStreak = () => {
  const { isLoggedIn, userId } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    setLoading(true);

    try {
      const streakRes = await api.get("/challenge/streak");
      setCurrentStreak(streakRes.data?.data?.currentStreak ?? 0);
      setLongestStreak(streakRes.data?.data?.longestStreak ?? 0);
    } catch {
      // Decorative widget — a failed fetch just means the badge/card
      // shows nothing extra, not worth surfacing to the user.
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void refetch();
  }, [refetch, userId]);

  return { currentStreak, longestStreak, loading, refetch };
};

export default useChallengeStreak;
