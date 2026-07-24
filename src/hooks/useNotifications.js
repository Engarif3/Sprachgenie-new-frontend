import { useCallback, useEffect, useRef, useState } from "react";
import api from "../axios";
import { useAuth } from "../services/auth.services";

const POLL_INTERVAL_MS = 30000;

// Polls the unread broadcast-notification count for the logged-in user, and
// provides on-demand fetching of the full list + marking items as read.
// Shared by the avatar dropdown bell and the Dashboard Notifications page so
// both stay in sync without duplicating the fetch/poll logic.
export const useNotifications = () => {
  const { isLoggedIn, userId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const refetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    try {
      // Background poll every 30s — a mobile connection blip here is
      // routine noise, not worth an Error Logs entry (see axios.js).
      const res = await api.get("/notifications/unread-count", {
        skipErrorReporting: true,
      });
      setUnreadCount(res.data?.data?.count ?? 0);
    } catch {
      // Decorative badge — a failed poll just leaves the last known count.
    }
  }, [isLoggedIn]);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const markAsRead = useCallback(
    async (notificationId) => {
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.isRead) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.post(`/notifications/${notificationId}/read`);
      } catch {
        // Best-effort — a failed call leaves it marked locally; the next
        // poll/fetch resyncs from the server if something actually went wrong.
      }
    },
    [notifications],
  );

  // Deletes are per-user only — the server never touches the shared
  // notification, so other users keep seeing it. Removed optimistically;
  // unread count is refetched afterwards rather than guessed locally, since
  // some of the removed ids may have been unread and some already read.
  const deleteNotifications = useCallback(
    async (notificationIds) => {
      if (!notificationIds || notificationIds.length === 0) return false;

      try {
        await api.delete("/notifications/mine", {
          data: { notificationIds },
        });
        setNotifications((prev) =>
          prev.filter((n) => !notificationIds.includes(n.id)),
        );
        await refetchUnreadCount();
        return true;
      } catch {
        return false;
      }
    },
    [refetchUnreadCount],
  );

  useEffect(() => {
    void refetchUnreadCount();
  }, [refetchUnreadCount, userId]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(refetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [isLoggedIn, refetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotifications,
    refetchUnreadCount,
  };
};

export default useNotifications;
