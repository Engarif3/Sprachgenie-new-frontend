import { Link, Navigate, Outlet, NavLink } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";
import Container from "../utils/Container";
import { useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    admin: false,
    content: false,
    analytics: false,
  });

  const userInfo = getUserInfo() || {};
  const role = userInfo.role;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  const navItemClass = (isActive) =>
    `flex items-center gap-3 py-3 px-4 rounded-lg text-sm md:text-sm transition-all duration-300 font-medium relative group ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
        : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
    }`;

  const sectionHeaderClass =
    "flex items-center justify-between py-3 px-4 hover:bg-gray-800/30 rounded-lg cursor-pointer text-sm md:text-sm font-semibold text-gray-200 transition-all duration-300";

  return (
    <Container>
      <div className="flex min-h-screen mb-12">
        {/* Mobile Toggle Button */}
        <button
          className="fixed top-20 left-4 z-50 md:hidden lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2.5 rounded-lg shadow-lg transition-all duration-300 hover:scale-110"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden lg:hidden z-30"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar Drawer */}
        <aside
          className={`fixed md:static h-screen overflow-y-auto w-64 text-white flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800/50 shadow-2xl z-40 transform transition-all duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="sticky top-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950/50 px-6 py-5 border-b border-gray-800/50 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold">🎯</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Dashboard</h2>
                <p className="text-xs text-gray-400 font-medium">
                  Control Panel
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            {/* Overview Link */}
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
                <span className="absolute right-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              )}
            </NavLink>

            {/* Favorites Link */}
            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(false)}
              title="Your Favorite Words"
            >
              <span className="text-lg">❤️</span>
              <span>Favorites</span>
            </NavLink>

            {/* Admin Sections */}
            {(role === "admin" || role === "super_admin") && (
              <>
                {/* Divider */}
                <div className="my-4 px-2">
                  <div className="h-px bg-gradient-to-r from-gray-700/0 via-gray-700/50 to-gray-700/0" />
                </div>

                {/* Admin Section */}
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
                  <div className="pl-4 py-2 space-y-1 border-l border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
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

                {/* Content Management Section */}
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
                  <div className="pl-4 py-2 space-y-1 border-l border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <NavLink
                      to="/dashboard/create-word"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>➕</span>
                      <span>Create Word</span>
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

                {/* Analytics Section */}
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
                  <div className="pl-4 py-2 space-y-1 border-l border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
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

                {/* System Status Section */}
                <div className="my-4 px-2">
                  <div className="h-px bg-gradient-to-r from-gray-700/0 via-gray-700/50 to-gray-700/0" />
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

          {/* Sidebar Footer */}
          <div className="sticky bottom-0 px-4 py-4 bg-gradient-to-t from-gray-950 to-gray-950/50 border-t border-gray-800/50 backdrop-blur-md">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg py-3 px-3 hover:border-blue-500/50 transition-colors duration-300">
              {/* <p className="text-xs font-semibold text-gray-300 mb-1">
                User Profile
              </p> */}
              <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 truncate">
                {userInfo?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {role || "user"}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="flex-1 pl-0 md:pl-6 lg:pl-6 overflow-y-auto mt-16 md:mt-0 lg:mt-0 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        >
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default DashboardLayout;
