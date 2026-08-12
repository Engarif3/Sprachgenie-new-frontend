import { createPortal } from "react-dom";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../services/auth.services";
import { useNotifications } from "../hooks/useNotifications";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { getAvatarUrl } from "../utils/avatar";
import Container from "../utils/Container";
import { useEffect, useRef, useState } from "react";
import {
  IoClose,
  IoMenu,
  IoHomeOutline,
  IoPersonOutline,
  IoHeartOutline,
  IoTrophyOutline,
  IoNotificationsOutline,
  IoMegaphoneOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoFlagOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoPulseOutline,
  IoAddOutline,
  IoOptionsOutline,
  IoLibraryOutline,
  IoPencilOutline,
  IoBookOutline,
  IoFolderOpenOutline,
  IoPricetagOutline,
  IoVolumeHighOutline,
  IoGlobeOutline,
  IoShieldOutline,
  IoImageOutline,
  IoHardwareChipOutline,
  IoRadioOutline,
  IoShieldCheckmarkOutline,
  IoDesktopOutline,
  IoAlertCircleOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
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
    "/dashboard/how-to-say-in-german",
  ],
  reports: ["/dashboard/reports"],
  settings: [
    "/dashboard/global-limits",
    "/dashboard/user-limits",
    "/dashboard/ip-rate-limits",
    "/dashboard/profile-photo-settings",
    "/dashboard/backup-management",
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
    icon: IoPeopleOutline,
    label: "Admin",
    items: [
      {
        to: "/dashboard/update-user-status",
        icon: IoPersonOutline,
        label: "All Users",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/update-basic-user-status",
        icon: IoPersonOutline,
        label: "Users",
        roles: ["admin"],
      },
    ],
  },
  {
    key: "content",
    icon: IoDocumentTextOutline,
    label: "Content",
    items: [
      {
        to: "/dashboard/create-word",
        icon: IoAddOutline,
        label: "Create Word",
      },
      { to: "/dashboard/level", icon: IoOptionsOutline, label: "Create Level" },
      {
        to: "/dashboard/topic",
        icon: IoLibraryOutline,
        label: "Create Topic",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/update-topic",
        icon: IoPencilOutline,
        label: "Update Topic",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/generate-story",
        icon: IoBookOutline,
        label: "Generate Story",
      },
      {
        to: "/dashboard/stories-management",
        icon: IoFolderOpenOutline,
        label: "Stories Management",
      },
      {
        to: "/dashboard/create-conversation",
        icon: IoAddOutline,
        label: "Create Conversation",
      },
      {
        to: "/dashboard/update-conversation",
        icon: IoPencilOutline,
        label: "Update Conversation",
      },
      {
        to: "/dashboard/conversation-category",
        icon: IoPricetagOutline,
        label: "Create Category",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/update-conversation-category",
        icon: IoPencilOutline,
        label: "Update Category",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/how-to-say-in-german",
        icon: IoVolumeHighOutline,
        label: "How to Say It in German",
        roles: ["super_admin"],
      },
    ],
  },
  {
    key: "reports",
    icon: IoFlagOutline,
    label: "Reports",
    items: [
      { to: "/dashboard/reports", icon: IoFlagOutline, label: "Reports" },
    ],
  },
  {
    key: "settings",
    icon: IoSettingsOutline,
    label: "Settings",
    items: [
      {
        to: "/dashboard/global-limits",
        icon: IoGlobeOutline,
        label: "Global Limits",
      },
      {
        to: "/dashboard/user-limits",
        icon: IoSettingsOutline,
        label: "User Limits",
      },
      {
        to: "/dashboard/ip-rate-limits",
        icon: IoShieldOutline,
        label: "IP Rate Limits",
      },
      {
        to: "/dashboard/profile-photo-settings",
        icon: IoImageOutline,
        label: "Profile Photo Settings",
        roles: ["super_admin"],
      },
      {
        to: "/dashboard/backup-management",
        icon: IoCloudUploadOutline,
        label: "Backup Management",
        roles: ["super_admin"],
      },
    ],
  },
  {
    key: "analytics",
    icon: IoStatsChartOutline,
    label: "Analytics",
    items: [
      {
        to: "/dashboard/users-favorite-count",
        icon: IoHeartOutline,
        label: "Favorites Stats",
      },
      {
        to: "/dashboard/get-usage",
        icon: IoHardwareChipOutline,
        label: "AI Usage",
      },
      { to: "/dashboard/ip-usage", icon: IoRadioOutline, label: "IP Usage" },
    ],
  },
  {
    key: "monitoring",
    icon: IoPulseOutline,
    label: "Monitoring",
    items: [
      {
        to: "/dashboard/registration-metadata",
        icon: IoShieldCheckmarkOutline,
        label: "Registration Signals",
      },
      {
        to: "/dashboard/system-status",
        icon: IoDesktopOutline,
        label: "System Status",
      },
      {
        to: "/dashboard/visitors-info",
        icon: IoPeopleOutline,
        label: "Visitors Info",
      },
      {
        to: "/dashboard/visitors",
        icon: IoGlobeOutline,
        label: "Visitors Detail",
      },
      {
        to: "/dashboard/error-logs",
        icon: IoAlertCircleOutline,
        label: "Error Logs",
      },
    ],
  },
];

const FLYOUT_WIDTH = 256; // matches w-64 below
// Keeps the flyout fully on-screen (with breathing room) instead of running
// off the bottom edge for a button near the end of the list. There's no DOM
// node to measure yet when we compute this (it's used to position the panel
// before/as it renders), so the height is estimated from each nav item's
// known rendered size (px-4 py-3 text-sm row) rather than measured live.
const FLYOUT_MARGIN = 16;
const FLYOUT_ITEM_HEIGHT = 46;
const FLYOUT_ITEM_GAP = 4;
const FLYOUT_PADDING = 16;

const estimateFlyoutHeight = (itemCount) =>
  itemCount * FLYOUT_ITEM_HEIGHT +
  Math.max(itemCount - 1, 0) * FLYOUT_ITEM_GAP +
  FLYOUT_PADDING;

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
  const roleLabel = formatRoleLabel(role);

  // Computed once per render (role rarely changes) so both the flyout
  // positioning math and the render map below read from the same list.
  const visibleSectionItems = NAV_SECTIONS.reduce((acc, section) => {
    acc[section.key] = section.items.filter(
      (item) => !item.roles || item.roles.includes(role),
    );
    return acc;
  }, {});

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

  // Close on any scroll. The flyout is fixed to a viewport position computed
  // when it opens — but the sidebar itself is only position:fixed on mobile;
  // on desktop it's a normal in-flow block that scrolls away with the rest
  // of the page. So the moment ANY scrolling happens (the page itself, the
  // sidebar's own nav list, or the main content area), the button can move
  // out from under the flyout while the flyout stays put, leaving it
  // floating disconnected over unrelated content. Listening on window with
  // capture:true catches scroll events from all of those nested scrollable
  // elements too (scroll doesn't bubble, but capturing on an ancestor still
  // sees it), not just the window's own scroll.
  useEffect(() => {
    if (!openSection) return;

    const close = () => setOpenSection(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openSection]);

  const computeFlyoutStyle = (key) => {
    const node = sectionButtonRefs.current[key];
    if (!node) return null;

    const rect = node.getBoundingClientRect();
    const left = Math.min(rect.right + 8, window.innerWidth - FLYOUT_WIDTH - 8);
    const height = estimateFlyoutHeight(
      (visibleSectionItems[key] || []).length,
    );

    // Anchored to the button's top edge whenever there's room below it —
    // same as just following the button. Only when a long list opened near
    // the bottom of the screen wouldn't fit does it flip to hang from the
    // button's BOTTOM edge and grow upward instead, so it stays right next
    // to the button (e.g. near the footer) rather than jumping away to
    // wherever there happens to be enough clear space.
    const fitsBelow = rect.top + height + FLYOUT_MARGIN <= window.innerHeight;
    let top = fitsBelow ? rect.top : rect.bottom - height;
    top = Math.max(
      FLYOUT_MARGIN,
      Math.min(top, window.innerHeight - FLYOUT_MARGIN - height),
    );

    return { top, left };
  };

  const toggleSection = (key) => {
    if (openSection === key) {
      setOpenSection(null);
      return;
    }

    const style = computeFlyoutStyle(key);
    if (style) setFlyoutStyle(style);
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

          <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-10 pt-5">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Dashboard Overview"
            >
              <IoHomeOutline size={18} aria-hidden="true" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Manage Your Profile"
            >
              <IoPersonOutline size={18} aria-hidden="true" />
              <span>Profile</span>
            </NavLink>

            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Your Favorite Words"
            >
              <IoHeartOutline size={18} aria-hidden="true" />
              <span>Favorites</span>
            </NavLink>

            <NavLink
              to="/dashboard/leaderboard"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Weekly XP Leaderboard"
            >
              <IoTrophyOutline size={18} aria-hidden="true" />
              <span>Leaderboard</span>
            </NavLink>

            <NavLink
              to="/dashboard/notifications"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Announcements"
            >
              <IoNotificationsOutline size={18} aria-hidden="true" />
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
                <IoMegaphoneOutline size={18} aria-hidden="true" />
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
                  const visibleItems = visibleSectionItems[section.key];
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
                          <section.icon size={16} aria-hidden="true" />
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

                      {isOpenSection &&
                        createPortal(
                          <div
                            ref={flyoutRef}
                            style={{
                              top: flyoutStyle.top,
                              left: flyoutStyle.left,
                              width: FLYOUT_WIDTH,
                            }}
                            className="fixed z-50 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900"
                            role="menu"
                          >
                            {visibleItems.map((item) => (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                  navItemClass(isActive)
                                }
                                onClick={closeFlyoutAndDrawer}
                                role="menuitem"
                              >
                                <item.icon size={16} aria-hidden="true" />
                                <span>{item.label}</span>
                              </NavLink>
                            ))}
                          </div>,
                          document.body,
                        )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>

          <div className="sticky bottom-0 mt-4 border-t border-slate-200/80 bg-white/90 px-4 py-5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/90">
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
                    {userInfo?.name || roleLabel}
                  </p>
                  {/* Skip a redundant second line when the account's name
                      already IS the role (e.g. a generic "Super Admin"
                      account) — showing the same text twice looked cluttered. */}
                  {userInfo?.name && userInfo.name !== roleLabel && (
                    <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
                      {roleLabel}
                    </p>
                  )}
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
