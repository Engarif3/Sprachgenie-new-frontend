import { Link, Navigate, Outlet, NavLink } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";
import Container from "../utils/Container";
import { useState } from "react";

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
    `flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-purple-500 font-bold shadow-lg"
        : "hover:bg-gray-800/50"
    }`;

  const sectionHeaderClass =
    "flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 rounded-lg cursor-pointer text-sm font-semibold";

  return (
    <Container>
      <div className="flex min-h-screen mb-12">
        <button
          className="fixed md:hidden lg:hidden mt-[0px] left-1 z-50 bg-orange-700 text-white px-2 py-1 rounded-md shadow-lg transition-all duration-300 text-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>

        {/* Sidebar */}
        <aside
          className={`fixed h-screen md:max-h-screen overflow-y-auto lg:static w-64 text-white flex flex-col rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-gray-700/50 z-40 transform transition-transform duration-300 shadow-2xl ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="py-3 text-2xl font-bold text-center sticky top-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            🎯
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Dashboard
            </span>
          </div>
          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-4" />

          {/* Sidebar menu */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="text-lg">🏠</span> Overview
            </NavLink>

            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="text-lg">❤️</span> Favorites
            </NavLink>

            {(role === "admin" || role === "super_admin") && (
              <>
                {/* Admin Section */}
                <div
                  onClick={() => toggleSection("admin")}
                  className={sectionHeaderClass}
                >
                  <span>👥 Admin</span>
                  <span
                    className={`text-xs transition-transform ${expandedSections.admin ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.admin && (
                  <div className="pl-2 space-y-1 border-l border-gray-700">
                    {role === "super_admin" && (
                      <>
                        <NavLink
                          to="/dashboard/update-user-status"
                          className={({ isActive }) => navItemClass(isActive)}
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span>👤</span> Users (All)
                        </NavLink>
                        <NavLink
                          to="/dashboard/topic"
                          className={({ isActive }) => navItemClass(isActive)}
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span>📚</span> Topics
                        </NavLink>
                      </>
                    )}
                    {role === "admin" && (
                      <NavLink
                        to="/dashboard/update-basic-user-status"
                        className={({ isActive }) => navItemClass(isActive)}
                        onClick={() => setIsOpen(!isOpen)}
                      >
                        <span>👤</span> Users
                      </NavLink>
                    )}
                  </div>
                )}

                {/* Content Management Section */}
                <div
                  onClick={() => toggleSection("content")}
                  className={sectionHeaderClass}
                >
                  <span>📝 Content</span>
                  <span
                    className={`text-xs transition-transform ${expandedSections.content ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.content && (
                  <div className="pl-2 space-y-1 border-l border-gray-700">
                    <NavLink
                      to="/dashboard/create-word"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>➕</span> Word
                    </NavLink>
                    <NavLink
                      to="/dashboard/create-conversation"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>➕</span> Conversation
                    </NavLink>
                    <NavLink
                      to="/dashboard/update-conversation"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>✏️</span> Update
                    </NavLink>
                  </div>
                )}

                {/* Analytics Section */}
                <div
                  onClick={() => toggleSection("analytics")}
                  className={sectionHeaderClass}
                >
                  <span>📊 Analytics</span>
                  <span
                    className={`text-xs transition-transform ${expandedSections.analytics ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </div>
                {expandedSections.analytics && (
                  <div className="pl-2 space-y-1 border-l border-gray-700">
                    <NavLink
                      to="/dashboard/users-favorite-count"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>📊</span> Favorites
                    </NavLink>
                    <NavLink
                      to="/dashboard/global-limits"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>🌍</span> Global Limits
                    </NavLink>
                    <NavLink
                      to="/dashboard/user-limits"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>⚙️</span> User Limits
                    </NavLink>
                    <NavLink
                      to="/dashboard/get-usage"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>🤖</span> AI Usage
                    </NavLink>
                    <NavLink
                      to="/dashboard/get-reports"
                      className={({ isActive }) => navItemClass(isActive)}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <span>📋</span> Reports
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </nav>

          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-4" />
          <div className="px-3 text-center py-3 sticky bottom-0">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg py-2">
              <p className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 truncate">
                👤 {userInfo?.name}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 pl-0 md:pl-4 lg:pl-4 overflow-y-auto mt-8"
          onClick={() => setIsOpen(false)}
        >
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default DashboardLayout;
