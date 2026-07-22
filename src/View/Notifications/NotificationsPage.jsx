import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationList from "./NotificationList";

const confirmDelete = ({ title, text }) =>
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  });

const NotificationsPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotifications,
  } = useNotifications();
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deleting can drop items the user had selected — keep selection in sync.
  useEffect(() => {
    setSelectedIds((prev) => {
      const stillPresent = new Set(
        notifications.filter((n) => prev.has(n.id)).map((n) => n.id),
      );
      return stillPresent.size === prev.size ? prev : stillPresent;
    });
  }, [notifications]);

  const allSelected =
    notifications.length > 0 && selectedIds.size === notifications.length;

  const handleToggleSelectAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(notifications.map((n) => n.id)),
    );
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteOne = async (id) => {
    const result = await confirmDelete({
      title: "Delete this notification?",
      text: "It'll be gone from your inbox, but other users will still see it.",
    });
    if (!result.isConfirmed) return;

    await deleteNotifications([id]);
  };

  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    const result = await confirmDelete({
      title: `Delete ${count} notification${count === 1 ? "" : "s"}?`,
      text: "They'll be gone from your inbox, but other users will still see them.",
    });
    if (!result.isConfirmed) return;

    await deleteNotifications([...selectedIds]);
    setSelectedIds(new Set());
  };

  return (
    <div className="mx-auto max-w-3xl p-4 pb-12 md:p-8">
      <div className="mb-6">
        <h1
          className={`text-3xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
        >
          🔔 Notifications
        </h1>
        <p className={`mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          Announcements from the Sprachgenie team.
        </p>
      </div>

      {notifications.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <label
            className={`flex items-center gap-2 text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleToggleSelectAll}
              className="h-4 w-4 accent-orange-500"
            />
            Select all
          </label>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Delete selected ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${
          isLight
            ? "border-slate-200 bg-white"
            : "border-slate-700 bg-slate-900/60"
        }`}
      >
        <NotificationList
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onDeleteOne={handleDeleteOne}
        />
      </div>
    </div>
  );
};

export default NotificationsPage;
