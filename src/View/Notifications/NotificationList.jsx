import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const formatNotificationDate = (dateValue) => {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const isExternalLink = (link) => /^https?:\/\//i.test(link || "");

// Long enough that a single-line clamp would very likely truncate it — used
// to decide whether the "See more" toggle is worth showing at all.
const LONG_MESSAGE_THRESHOLD = 140;

// Shared between the avatar dropdown popover (compact) and the full
// Dashboard Notifications page. Clicking a row expands the full message and
// marks it read the first time it's opened, matching how a real inbox works
// — the unread count only drops once the user has actually seen the content.
//
// `selectable` turns on the per-user delete affordances (checkbox + trash
// icon) used on the full Notifications page — deleting only ever hides the
// row for the current user, it never touches the shared broadcast.
const NotificationList = ({
  notifications,
  loading,
  onMarkAsRead,
  compact = false,
  emptyMessage = "No notifications yet.",
  selectable = false,
  selectedIds,
  onToggleSelect,
  onDeleteOne,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (notification) => {
    const isOpening = expandedId !== notification.id;
    setExpandedId(isOpening ? notification.id : null);

    if (isOpening && !notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
  };

  const handleToggleKeyDown = (event, notification) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle(notification);
    }
  };

  // The CTA link and "See more" toggle sit inside the row's own click
  // target, so each must stop the click from bubbling up and
  // re-toggling/collapsing the row a second time.
  const handleCtaClick = (event, notification) => {
    event.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
  };

  const handleSeeMoreClick = (event, notification) => {
    event.stopPropagation();
    handleToggle(notification);
  };

  const handleDeleteClick = (event, notification) => {
    event.stopPropagation();
    onDeleteOne?.(notification.id);
  };

  if (loading) {
    return (
      <p
        className={`py-6 text-center text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
      >
        Loading notifications...
      </p>
    );
  }

  if (notifications.length === 0) {
    return (
      <p
        className={`py-6 text-center text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={`divide-y ${isLight ? "divide-slate-200" : "divide-slate-700"}`}>
      {notifications.map((notification) => {
        const isExpanded = expandedId === notification.id;
        const isSelected = selectedIds?.has(notification.id);
        const isLongMessage =
          (notification.message || "").length > LONG_MESSAGE_THRESHOLD;
        const ctaClass =
          "mt-2 inline-flex items-center gap-1 text-sm font-semibold text-orange-500 transition-all hover:gap-2 dark:text-orange-400";

        return (
          <li
            key={notification.id}
            className={`flex items-start gap-2 ${
              isSelected ? (isLight ? "bg-orange-50" : "bg-orange-500/10") : ""
            }`}
          >
            {/* Outside the clickable message box on purpose — selecting a
            row for bulk-delete is a separate action from opening it. */}
            {selectable && (
              <input
                type="checkbox"
                checked={!!isSelected}
                onChange={() => onToggleSelect?.(notification.id)}
                className="ml-3 mt-4 h-4 w-4 shrink-0 cursor-pointer accent-orange-500"
                aria-label={`Select "${notification.topic}"`}
              />
            )}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleToggle(notification)}
              onKeyDown={(e) => handleToggleKeyDown(e, notification)}
              className={`flex w-full min-w-0 cursor-pointer items-start gap-2 px-3 py-3 text-left transition-colors ${
                isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/60"
              }`}
            >
              {!notification.isRead && (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500"
                  aria-label="Unread"
                />
              )}
              <div className={`min-w-0 flex-1 ${notification.isRead ? "ml-4" : ""}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`truncate text-sm font-semibold ${
                      notification.isRead
                        ? isLight
                          ? "text-slate-600"
                          : "text-slate-300"
                        : isLight
                          ? "text-slate-900"
                          : "text-white"
                    }`}
                  >
                    {notification.topic}
                  </p>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                    {selectable && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, notification)}
                        title="Delete for me"
                        aria-label="Delete for me"
                        className={`rounded-full p-1 transition-colors ${
                          isLight
                            ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                            : "text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </span>
                </div>
                <p
                  className={`mt-1 text-sm ${
                    isExpanded ? "whitespace-pre-wrap" : "line-clamp-1"
                  } ${isLight ? "text-slate-600" : "text-slate-400"}`}
                >
                  {notification.message}
                </p>
                {isLongMessage && (
                  <button
                    type="button"
                    onClick={(e) => handleSeeMoreClick(e, notification)}
                    className="mt-0.5 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                  >
                    {isExpanded ? "See less" : "See more"}
                  </button>
                )}
                {notification.link &&
                  (isExternalLink(notification.link) ? (
                    <a
                      href={notification.link}
                      onClick={(e) => handleCtaClick(e, notification)}
                      className={ctaClass}
                    >
                      Discover now <ChevronRight size={14} />
                    </a>
                  ) : (
                    <Link
                      to={notification.link}
                      onClick={(e) => handleCtaClick(e, notification)}
                      className={ctaClass}
                    >
                      Discover now <ChevronRight size={14} />
                    </Link>
                  ))}
                {!compact && (
                  <p
                    className={`mt-2 text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    — Admin
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default NotificationList;
