import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../services/auth.services";
import { useNotifications } from "../hooks/useNotifications";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { getAvatarUrl } from "../utils/avatar";
import Container from "../utils/Container";
import { useEffect, useRef, useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { ChevronRight } from "lucide-react";

// Which section each route lives under — used only to visually highlight the
// relevant section header on load/navigation (the flyout itself never
// auto-opens; it's transient, shown only while an admin has clicked it).
const SECTION_ROUTES = {
  admin: [
    "/dashboard/update-user-status",
    "/dashboard/update-basic-user-status",
  ],
  content: [
    "/dashboard/create-word",
    "/dashboard/topic",
    "/dashboard/update-topic",
    "/dashboard/generate-story",
    "/dashboard/stories-management",
    "/dashboard/create-conversation",
    "/dashboard/update-conversation",
    "/dashboard/conversation-category",
    "/dashboard/update-conversation-category",
  ],
  reports: [
    "/dashboard/word-reports",
    "/dashboard/get-reports",
    "/dashboard/conjugation-reports",
  ],
  settings: [
    "/dashboard/global-limits",
    "/dashboard/user-limits",
    "/dashboard/ip-rate-limits",
    "/dashboard/profile-photo-settings",
  ],
  analytics: [
    "/dashboard/users-favorite-count",
    "/dashboard/get-usage",
    "/dashboard/ip-usage",
  ],
  monitoring: [
    "/dashboard/registration-metadata",
    "/dashboard/system-status",
    "/dashboard/visitors-info",
    "/dashboard/visitors",
    "/dashboard/error-logs",
  ],
};

// Data-driven so every section renders through the same trigger+flyout
// markup below instead of six hand-written near-duplicates. `roles` on an
// item restricts it to that role only; items with no `roles` are visible to
// both admin and super_admin (the outer gate that wraps this whole block).
const NAV_SECTIONS = [
  {
    key: "admin",
    icon: "👥",
    label: "Admin",
    items: [
      { to: "/dashboard/update-user-status", icon: "👤", label: "All Users", roles: ["super_admin"] },
      { to: "/dashboard/update-basic-user-status", icon: "👤", label: "Users", roles: ["admin"] },
    ],
  },
  {
    key: "content",
    icon: "📝",
    label: "Content",
    items: [
      { to: "/dashboard/create-word", icon: "➕", label: "Create Word" },
      { to: "/dashboard/level", icon: "🎚️", label: "Create Level" },
      { to: "/dashboard/topic", icon: "📚", label: "Create Topic", roles: ["super_admin"] },
      { to: "/dashboard/update-topic", icon: "✏️", label: "Update Topic", roles: ["super_admin"] },
      { to: "/dashboard/generate-story", icon: "📖", label: "Generate Story" },
      { to: "/dashboard/stories-management", icon: "🗂️", label: "Stories Management" },
      { to: "/dashboard/create-conversation", icon: "➕", label: "Create Conversation" },
      { to: "/dashboard/update-conversation", icon: "✏️", label: "Update Conversation" },
      { to: "/dashboard/conversation-category", icon: "🏷️", label: "Create Category", roles: ["super_admin"] },
      { to: "/dashboard/update-conversation-category", icon: "✏️", label: "Update Category", roles: ["super_admin"] },
    ],
  },
  {
    key: "reports",
    icon: "🚩",
    label: "Reports",
    items: [
      { to: "/dashboard/word-reports", icon: "🚩", label: "Word Reports", roles: ["super_admin"] },
      { to: "/dashboard/get-reports", icon: "📋", label: "AI Paragraph Reports" },
      { to: "/dashboard/conjugation-reports", icon: "🔤", label: "Conjugation Reports" },
    ],
  },
  {
    key: "settings",
    icon: "⚙️",
    label: "Settings",
    items: [
      { to: "/dashboard/global-limits", icon: "🌍", label: "Global Limits" },
      { to: "/dashboard/user-limits", icon: "⚙️", label: "User Limits" },
      { to: "/dashboard/ip-rate-limits", icon: "🛡️", label: "IP Rate Limits" },
      { to: "/dashboard/profile-photo-settings", icon: "🖼️", label: "Profile Photo Settings", roles: ["super_admin"] },
    ],
  },
  {
    key: "analytics",
    icon: "📊",
    label: "Analytics",
    items: [
      { to: "/dashboard/users-favorite-count", icon: "❤️", label: "Favorites Stats" },
      { to: "/dashboard/get-usage", icon: "🤖", label: "AI Usage" },
      { to: "/dashboard/ip-usage", icon: "📡", label: "IP Usage" },
    ],
  },
  {
    key: "monitoring",
    icon: "🩺",
    label: "Monitoring",
    items: [
      { to: "/dashboard/registration-metadata", icon: "🛡️", label: "Registration Signals" },
      { to: "/dashboard/system-status", icon: "🖥️", label: "System Status" },
      { to: "/dashboard/visitors-info", icon: "👥", label: "Visitors Info" },
      { to: "/dashboard/visitors", icon: "🌍", label: "Visitors Detail" },
      { to: "/dashboard/error-logs", icon: "🚨", label: "Error Logs" },
    ],
  },
];

const FLYOUT_WIDTH = 256; // matches w-64 below

const getActiveSection = (pathname) =>
  Object.keys(SECTION_ROUTES).find((section) =>
    SECTION_ROUTES[section].some((route) => pathname.startsWith(route)),
  ) || null;

const getUserInitials = (name, email) => {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const formatRoleLabel = (role) => {
  if (!role) {
    return "User";
  }

  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Which section's flyout is currently open (null = none). Only one at a
  // time — opening a new one implicitly replaces the last.
  const [openSection, setOpenSection] = useState(null);
  const [flyoutStyle, setFlyoutStyle] = useState({});
  const sectionButtonRefs = useRef({});
  const flyoutRef = useRef(null);

  const {
    safeUserInfo: userInfo,
    userId,
    userRole: role,
    isBootstrapResolved,
  } = useAuth();
  const { unreadCount } = useNotifications();
  const { settings: profileSettings } = useProfileSettings();
  const avatarUrl = isBootstrapResolved
    ? getAvatarUrl(userInfo, profileSettings)
    : null;

  const activeSection = getActiveSection(location.pathname);

  // A flyout is transient — never carry it across a navigation.
  useEffect(() => {
    setOpenSection(null);
  }, [location.pathname]);

  // Close on outside click (not on the trigger button that opened it, and
  // not on the flyout panel itself).
  useEffect(() => {
    if (!openSection) return;

    const handleClickOutside = (event) => {
      const buttonNode = sectionButtonRefs.current[openSection];
      const clickedButton = buttonNode && buttonNode.contains(event.target);
      const clickedFlyout =
        flyoutRef.current && flyoutRef.current.contains(event.target);

      if (!clickedButton && !clickedFlyout) {
        setOpenSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSection]);

  // The flyout's fixed position is computed once, from the trigger button's
  // rect, at the moment it opens — rather than trying to keep it live in
  // sync, just close it if the layout underneath it could have shifted.
  useEffect(() => {
    if (!openSection) return;

    const close = () => setOpenSection(null);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [openSection]);

  const toggleSection = (key) => {
    if (openSection === key) {
      setOpenSection(null);
      return;
    }

    const node = sectionButtonRefs.current[key];
    if (node) {
      const rect = node.getBoundingClientRect();
      const left = Math.min(
        rect.right + 8,
        window.innerWidth - FLYOUT_WIDTH - 8,
      );

      setFlyoutStyle({
        top: rect.top,
        left,
        maxHeight: window.innerHeight - rect.top - 16,
      });
    }

    setOpenSection(key);
  };

  const closeFlyoutAndDrawer = () => {
    setOpenSection(null);
    setIsOpen(false);
  };

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const navItemClass = (isActive) =>
    `group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "border-sky-500/30 bg-gradient-to-r from-slate-900 to-sky-700 text-white shadow-lg shadow-sky-900/20 dark:border-sky-500/20 dark:from-sky-600 dark:to-blue-700"
        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-white/5 dark:hover:text-white"
    }`;

  const sectionHeaderClass = (isHighlighted) =>
    `flex w-full cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
      isHighlighted
        ? "border-sky-200 bg-sky-50/80 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200"
        : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-white/5"
    }`;

  return (
    <Container>
      <div className="mb-12 flex min-h-screen">
        <button
          className="fixed left-4 top-20 z-50 rounded-2xl border border-sky-500/30 bg-white/95 p-2.5 text-slate-900 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:scale-105 hover:bg-slate-100 dark:border-sky-500/20 dark:bg-slate-900/95 dark:text-white dark:hover:bg-slate-800 md:hidden lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] md:hidden lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside
          className={`fixed z-40 flex h-screen w-72 flex-col overflow-y-auto border-r border-slate-200/80 bg-white/95 text-slate-900 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-300 ease-out dark:border-slate-800/70 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-white dark:shadow-black/30 md:static ${
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="sticky top-0 border-b border-slate-200/80 bg-white/90 px-6 py-5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-sky-900/20 dark:border-sky-500/20">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt={userInfo?.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {getUserInitials(userInfo?.name, userInfo?.email)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dashboard
                </h2>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Control Panel
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-sky-500/10 dark:bg-sky-500/10 dark:text-slate-300">
              Signed in as{" "}
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {userInfo?.name || "User"}
              </span>
            </div>
          </div>

          <nav
            className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5"
            onScroll={() => setOpenSection(null)}
          >
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Dashboard Overview"
            >
              <span className="text-lg">🏠</span>
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Manage Your Profile"
            >
              <span className="text-lg">👤</span>
              <span>Profile</span>
            </NavLink>

            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Your Favorite Words"
            >
              <span className="text-lg">❤️</span>
              <span>Favorites</span>
            </NavLink>

            <NavLink
              to="/dashboard/leaderboard"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Weekly XP Leaderboard"
            >
              <span className="text-lg">🏆</span>
              <span>Leaderboard</span>
            </NavLink>

            <NavLink
              to="/dashboard/notifications"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Announcements"
            >
              <span className="text-lg">🔔</span>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            {role === "super_admin" && (
              <NavLink
                to="/dashboard/broadcast-notifications"
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => setIsOpen(false)}
                title="Broadcast an announcement to all users"
              >
                <span className="text-lg">📢</span>
                <span>Broadcast Notifications</span>
              </NavLink>
            )}

            {(role === "admin" || role === "super_admin") && (
              <>
                <div className="my-4 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700/50" />
                </div>
                <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Management
                </p>

                {NAV_SECTIONS.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) => !item.roles || item.roles.includes(role),
                  );
                  if (visibleItems.length === 0) return null;

                  const isOpenSection = openSection === section.key;
                  const isHighlighted =
                    isOpenSection || activeSection === section.key;

                  return (
                    <div key={section.key} className="relative">
                      <button
                        ref={(node) => {
                          sectionButtonRefs.current[section.key] = node;
                        }}
                        type="button"
                        onClick={() => toggleSection(section.key)}
                        className={sectionHeaderClass(isHighlighted)}
                        aria-expanded={isOpenSection}
                        aria-haspopup="true"
                      >
                        <span className="flex items-center gap-2">
                          <span>{section.icon}</span>
                          <span>{section.label}</span>
                        </span>
                        <ChevronRight
                          size={16}
                          className={`shrink-0 transition-colors duration-200 ${
                            isHighlighted
                              ? "text-sky-500"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                      </button>

                      {isOpenSection && (
                        <div
                          ref={flyoutRef}
                          style={{
                            top: flyoutStyle.top,
                            left: flyoutStyle.left,
                            maxHeight: flyoutStyle.maxHeight,
                            width: FLYOUT_WIDTH,
                          }}
                          className="fixed z-50 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900"
                          role="menu"
                        >
                          {visibleItems.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) => navItemClass(isActive)}
                              onClick={closeFlyoutAndDrawer}
                              role="menuitem"
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>

          <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/90">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50/70 px-3 py-3 transition-colors duration-300 hover:border-sky-300/60 dark:border-sky-500/20 dark:from-sky-500/10 dark:to-indigo-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-200 bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-md dark:border-sky-500/20">
                  {avatarUrl ? (
                    <img
                      key={avatarUrl}
                      src={avatarUrl}
                      alt={userInfo?.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {getUserInitials(userInfo?.name, userInfo?.email)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    User Profile
                  </p>
                  <p className="truncate bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-sm font-bold text-transparent dark:from-sky-300 dark:to-indigo-300">
                    {userInfo?.name || "User"}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
                    {formatRoleLabel(role)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main
          className="mt-16 flex-1 overflow-y-auto pl-0 transition-all duration-300 md:mt-0 md:pl-6 lg:pl-6"
          onClick={() => setIsOpen(false)}
        >
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default DashboardLayout;
