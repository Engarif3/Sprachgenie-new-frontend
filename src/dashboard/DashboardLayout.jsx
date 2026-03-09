import { Link, Navigate, Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../services/auth.services";
import Container from "../utils/Container";
import { useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";

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
  const [expandedSections, setExpandedSections] = useState({
    admin: false,
    content: false,
    analytics: false,
  });

  const { userInfo } = useAuth();
  const role = userInfo?.role;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!userInfo?.id) {
    return <Navigate to="/login" replace />;
  }

  const navItemClass = (isActive) =>
    `group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "border-sky-500/30 bg-gradient-to-r from-slate-900 to-sky-700 text-white shadow-lg shadow-sky-900/20 dark:border-sky-500/20 dark:from-sky-600 dark:to-blue-700"
        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-white/5 dark:hover:text-white"
    }`;

  const sectionHeaderClass =
    "flex cursor-pointer items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-white/5";

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
                {userInfo?.profilePhoto ? (
                  <img
                    src={userInfo.profilePhoto}
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

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Dashboard Overview"
            >
              <span className="text-lg">🏠</span>
              <span>Overview</span>
              {expandedSections.admin === false && (
                <span className="absolute right-3 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              )}
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

            {(role === "admin" || role === "super_admin") && (
              <>
                <div className="my-4 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700/50" />
                </div>
                <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Management
                </p>

                <div
                  onClick={() => toggleSection("admin")}
                  className={sectionHeaderClass}
                  role="button"
                  tabIndex={0}
                >
                  <span className="flex items-center gap-2">
                    <span>👥</span>
                    <span>Admin</span>
                  </span>
                  <span
                    className={`text-sm transition-transform duration-300 ${
                      expandedSections.admin ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.admin && (
                  <div className="ml-3 space-y-1 border-l border-slate-200 py-2 pl-4 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700/60">
                    {role === "super_admin" && (
                      <>
                        <NavLink
                          to="/dashboard/update-user-status"
                          className={({ isActive }) => navItemClass(isActive)}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>👤</span>
                          <span>All Users</span>
                        </NavLink>
                        <NavLink
                          to="/dashboard/topic"
                          className={({ isActive }) => navItemClass(isActive)}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>📚</span>
                          <span>Topics</span>
                        </NavLink>
                      </>
                    )}
                    {role === "admin" && (
                      <NavLink
                        to="/dashboard/update-basic-user-status"
                        className={({ isActive }) => navItemClass(isActive)}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>👤</span>
                        <span>Users</span>
                      </NavLink>
                    )}
                  </div>
                )}

                <div
                  onClick={() => toggleSection("content")}
                  className={sectionHeaderClass}
                  role="button"
                  tabIndex={0}
                >
                  <span className="flex items-center gap-2">
                    <span>📝</span>
                    <span>Content</span>
                  </span>
                  <span
                    className={`text-sm transition-transform duration-300 ${
                      expandedSections.content ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.content && (
                  <div className="ml-3 space-y-1 border-l border-slate-200 py-2 pl-4 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700/60">
                    <NavLink
                      to="/dashboard/create-word"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>➕</span>
                      <span>Create Word</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/generate-story"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>📖</span>
                      <span>Generate Story</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/create-conversation"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>➕</span>
                      <span>Create Chat</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/update-conversation"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>✏️</span>
                      <span>Update Chat</span>
                    </NavLink>
                  </div>
                )}

                <div
                  onClick={() => toggleSection("analytics")}
                  className={sectionHeaderClass}
                  role="button"
                  tabIndex={0}
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span>
                    <span>Analytics</span>
                  </span>
                  <span
                    className={`text-sm transition-transform duration-300 ${
                      expandedSections.analytics ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.analytics && (
                  <div className="ml-3 space-y-1 border-l border-slate-200 py-2 pl-4 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700/60">
                    <NavLink
                      to="/dashboard/registration-metadata"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>🛡️</span>
                      <span>Registration Signals</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/users-favorite-count"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>❤️</span>
                      <span>Favorites</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/global-limits"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>🌍</span>
                      <span>Global Limits</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/user-limits"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>⚙️</span>
                      <span>User Limits</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/get-usage"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>🤖</span>
                      <span>AI Usage</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/get-reports"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>📋</span>
                      <span>Reports</span>
                    </NavLink>
                  </div>
                )}

                <div className="my-4 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700/50" />
                </div>
                <NavLink
                  to="/dashboard/system-status"
                  className={({ isActive }) => navItemClass(isActive)}
                  onClick={() => setIsOpen(false)}
                >
                  <span>🖥️</span>
                  <span>System Status</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/90">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50/70 px-3 py-3 transition-colors duration-300 hover:border-sky-300/60 dark:border-sky-500/20 dark:from-sky-500/10 dark:to-indigo-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-200 bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-md dark:border-sky-500/20">
                  {userInfo?.profilePhoto ? (
                    <img
                      src={userInfo.profilePhoto}
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
