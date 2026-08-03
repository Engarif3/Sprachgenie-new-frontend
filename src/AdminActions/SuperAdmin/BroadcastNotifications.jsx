import { useEffect, useState } from "react";
import api from "../../axios";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
};

const BroadcastNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTopic, setEditTopic] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [retentionDaysInput, setRetentionDaysInput] = useState("");
  const [displayLimitInput, setDisplayLimitInput] = useState("");
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  // { type: "single", id, topic } | { type: "bulk", ids } | { type: "all" }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Unbounded — ignores the end-user displayLimit, so older broadcasts
      // stay manageable here even after they've aged out of everyone's inbox.
      const response = await api.get("/notifications/admin/all");
      setNotifications(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await api.get("/notifications/settings");
      const data = response.data?.data;
      setRetentionDaysInput(String(data?.retentionDays ?? 30));
      setDisplayLimitInput(String(data?.displayLimit ?? 20));
      setAutoDeleteEnabled(data?.autoDeleteEnabled ?? true);
    } catch (err) {
      console.error("Error fetching notification settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  // Deleting/refetching can drop items that were selected — keep in sync.
  useEffect(() => {
    setSelectedIds((prev) => {
      const stillPresent = new Set(
        notifications.filter((n) => prev.has(n.id)).map((n) => n.id),
      );
      return stillPresent.size === prev.size ? prev : stillPresent;
    });
  }, [notifications]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleSaveSettings = async () => {
    const retentionDays = parseInt(retentionDaysInput, 10);
    const displayLimit = parseInt(displayLimitInput, 10);

    if (!Number.isInteger(retentionDays) || retentionDays < 1) {
      showError("Auto-delete after must be a whole number of days (1 or more)");
      return;
    }
    if (!Number.isInteger(displayLimit) || displayLimit < 1) {
      showError("Notifications to show users must be a whole number (1 or more)");
      return;
    }

    setSavingSettings(true);
    try {
      await api.patch("/notifications/settings", {
        autoDeleteEnabled,
        retentionDays,
        displayLimit,
      });
      showSuccess("Notification settings saved!");
    } catch (err) {
      console.error("Error saving notification settings:", err);
      showError(
        err.response?.data?.message || "Failed to save notification settings",
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !message.trim()) {
      showError("Topic and message are both required");
      return;
    }

    setBroadcasting(true);
    try {
      await api.post("/notifications", {
        topic: topic.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
      });
      setTopic("");
      setMessage("");
      setLink("");
      showSuccess("Notification broadcast to all users!");
      fetchNotifications();
    } catch (err) {
      console.error("Error broadcasting notification:", err);
      showError(
        err.response?.data?.message || "Failed to broadcast notification",
      );
    } finally {
      setBroadcasting(false);
    }
  };

  const openEditModal = (notification) => {
    setEditingId(notification.id);
    setEditTopic(notification.topic);
    setEditMessage(notification.message);
    setEditLink(notification.link || "");
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditTopic("");
    setEditMessage("");
    setEditLink("");
  };

  const handleSaveEdit = async () => {
    if (!editTopic.trim() || !editMessage.trim()) {
      showError("Topic and message cannot be empty");
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/notifications/${editingId}`, {
        topic: editTopic.trim(),
        message: editMessage.trim(),
        link: editLink.trim() || undefined,
      });
      showSuccess("Notification updated successfully!");
      closeEditModal();
      fetchNotifications();
    } catch (err) {
      console.error("Error updating notification:", err);
      showError(err.response?.data?.message || "Failed to update notification");
    } finally {
      setEditLoading(false);
    }
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

  const allSelected =
    notifications.length > 0 && selectedIds.size === notifications.length;

  const handleToggleSelectAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(notifications.map((n) => n.id)),
    );
  };

  const openDeleteConfirm = (target) => {
    setDeleteTarget(target);
    setConfirmText("");
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setConfirmText("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || confirmText.trim().toUpperCase() !== "OK") return;

    setDeleting(true);
    try {
      if (deleteTarget.type === "single") {
        await api.delete(`/notifications/${deleteTarget.id}`);
        showSuccess("Notification deleted successfully!");
      } else if (deleteTarget.type === "bulk") {
        await api.delete("/notifications/admin/bulk", {
          data: { notificationIds: deleteTarget.ids },
        });
        showSuccess(`${deleteTarget.ids.length} notifications deleted!`);
        setSelectedIds(new Set());
      } else if (deleteTarget.type === "all") {
        await api.delete("/notifications/admin/all");
        showSuccess("All notifications deleted!");
        setSelectedIds(new Set());
      }
      closeDeleteConfirm();
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting notification(s):", err);
      showError(
        err.response?.data?.message || "Failed to delete notification(s)",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <PageHeader
            title="Broadcast Notifications"
            subtitle="Send an announcement that every user will see as a notification"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Settings */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 mb-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            ⚙️ Settings
          </h2>

          {settingsLoading ? (
            <p className="text-slate-500 dark:text-gray-400">
              Loading settings...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="notification-retention-days"
                    className="block text-slate-800 dark:text-white font-semibold mb-2"
                  >
                    Auto-delete after (days)
                  </label>
                  <input
                    id="notification-retention-days"
                    type="number"
                    min="1"
                    value={retentionDaysInput}
                    onChange={(e) => setRetentionDaysInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <label className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoDeleteEnabled}
                      onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Auto-delete enabled
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="notification-display-limit"
                    className="block text-slate-800 dark:text-white font-semibold mb-2"
                  >
                    Notifications shown to users
                  </label>
                  <input
                    id="notification-display-limit"
                    type="number"
                    min="1"
                    value={displayLimitInput}
                    onChange={(e) => setDisplayLimitInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                    Only the most recent {displayLimitInput || "N"} broadcasts
                    appear in a user's inbox. Older ones stay here for you to
                    manage until they auto-delete.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleBroadcast}
          className="rounded-lg border border-slate-200 bg-white p-8 mb-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none"
        >
          <div className="mb-6">
            <label
              htmlFor="notification-topic"
              className="block text-slate-800 dark:text-white font-semibold mb-2"
            >
              Topic *
            </label>
            <input
              id="notification-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. New feature: AI-generated stories"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="notification-message"
              className="block text-slate-800 dark:text-white font-semibold mb-2"
            >
              Message *
            </label>
            <textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the announcement..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              rows="4"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="notification-link"
              className="block text-slate-800 dark:text-white font-semibold mb-2"
            >
              Link (optional)
            </label>
            <input
              id="notification-link"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://... or /stories/some-story-id"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
              If set, users will see a "Discover now →" button that takes
              them straight there. Leave empty to hide it.
            </p>
          </div>

          <Button type="submit" disabled={broadcasting} fullWidth size="lg">
            {broadcasting ? "Broadcasting..." : "📢 Broadcast to All Users"}
          </Button>
        </form>

        {/* Broadcast history */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Broadcast History
          </h2>

          {notifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-300">
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
                  onClick={() =>
                    openDeleteConfirm({
                      type: "bulk",
                      ids: [...selectedIds],
                    })
                  }
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Delete Selected ({selectedIds.size})
                </button>
              )}

              <button
                type="button"
                onClick={() => openDeleteConfirm({ type: "all" })}
                className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Delete All
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-slate-500 dark:text-gray-400 text-center py-8">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-slate-500 dark:text-gray-400 text-center py-8">
            No notifications broadcast yet.
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 rounded-lg border p-6 transition-colors ${
                  selectedIds.has(notification.id)
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(notification.id)}
                  onChange={() => handleToggleSelect(notification.id)}
                  className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer accent-orange-500"
                  aria-label={`Select "${notification.topic}"`}
                />
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {notification.topic}
                    </h3>
                    <p className="text-slate-600 dark:text-gray-300 whitespace-pre-wrap mb-2">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 truncate">
                        🔗 {notification.link}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-gray-500">
                      Broadcast {formatDate(notification.createdAt)}
                      {notification.creator?.name &&
                        ` by ${notification.creator.name}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(notification)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        openDeleteConfirm({
                          type: "single",
                          id: notification.id,
                          topic: notification.topic,
                        })
                      }
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                Edit Notification
              </h2>

              <div className="mb-6">
                <label
                  htmlFor="edit-notification-topic"
                  className="block text-white font-semibold mb-2"
                >
                  Topic
                </label>
                <input
                  id="edit-notification-topic"
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="edit-notification-message"
                  className="block text-white font-semibold mb-2"
                >
                  Message
                </label>
                <textarea
                  id="edit-notification-message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                  rows="4"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="edit-notification-link"
                  className="block text-white font-semibold mb-2"
                >
                  Link (optional)
                </label>
                <input
                  id="edit-notification-link"
                  type="text"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="https://... or /stories/some-story-id"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {editLoading ? "Saving..." : "✅ Save Changes"}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-red-700">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                ⚠️ Permanently Delete{" "}
                {deleteTarget.type === "all"
                  ? "All Notifications"
                  : deleteTarget.type === "bulk"
                    ? `${deleteTarget.ids.length} Notifications`
                    : "Notification"}
              </h2>

              <p className="text-gray-300 mb-2">
                {deleteTarget.type === "single" &&
                  `"${deleteTarget.topic}" will be permanently deleted for ALL users.`}
                {deleteTarget.type === "bulk" &&
                  `${deleteTarget.ids.length} notifications will be permanently deleted for ALL users.`}
                {deleteTarget.type === "all" &&
                  "Every broadcast notification will be permanently deleted for ALL users."}
              </p>
              <p className="text-red-300 text-sm font-semibold mb-6">
                This cannot be undone.
              </p>

              <label
                htmlFor="delete-confirm-input"
                className="block text-white font-semibold mb-2"
              >
                Type <span className="text-red-400">OK</span> to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="OK"
                autoFocus
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={
                    deleting || confirmText.trim().toUpperCase() !== "OK"
                  }
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastNotifications;
