import { Link, Navigate, Outlet, NavLink } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";
import Container from "../utils/Container";
import { useState } from "react";

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const userInfo = getUserInfo() || {};
  const role = userInfo.role;

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container>
      <div className="flex min-h-screen mb-12">
        <button
          className="fixed md:hidden lg:hidden mt-[4px] left-2 z-50 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>

        {/* Sidebar */}
        <aside
          className={`fixed min-h-[80%] lg:static w-64 text-white flex flex-col rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-gray-700/50 z-40 transform transition-transform duration-300 shadow-2xl
    ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div className="py-4 text-2xl font-bold text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              🎯 Dashboard
            </span>
          </div>
          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-4" />

          {/* Sidebar menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 font-bold shadow-lg shadow-blue-500/50"
                    : "hover:bg-gray-800/50 hover:translate-x-1"
                }`
              }
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="text-xl">🏠</span> Overview
            </NavLink>

            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-pink-500 to-red-500 font-bold shadow-lg shadow-pink-500/50"
                    : "hover:bg-gray-800/50 hover:translate-x-1"
                }`
              }
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="text-xl">❤️</span> Favorites Words
            </NavLink>

            {role === "super_admin" && (
              <div className="space-y-2">
                <NavLink
                  to="/dashboard/update-user-status"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 font-bold shadow-lg shadow-purple-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">👥</span> Manage Users
                </NavLink>
                <NavLink
                  to="/dashboard/topic"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 font-bold shadow-lg shadow-green-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">📚</span> Create Topic
                </NavLink>
              </div>
            )}

            {role === "admin" && (
              <NavLink
                to="/dashboard/update-basic-user-status"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 font-bold shadow-lg shadow-purple-500/50"
                      : "hover:bg-gray-800/50 hover:translate-x-1"
                  }`
                }
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="text-xl">👥</span> Manage Users
              </NavLink>
            )}

            {(role === "admin" || role === "super_admin") && (
              <>
                <NavLink
                  to="/dashboard/create-word"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 font-bold shadow-lg shadow-blue-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">📝</span> Create Word
                </NavLink>
                <NavLink
                  to="/dashboard/create-conversation"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 font-bold shadow-lg shadow-green-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">💬</span> Create Conversation
                </NavLink>
                <NavLink
                  to="/dashboard/update-conversation"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 font-bold shadow-lg shadow-yellow-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">✏️</span> Update Conversation
                </NavLink>

                <NavLink
                  to="/dashboard/users-favorite-count"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-red-500 font-bold shadow-lg shadow-orange-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">📊</span> Favorites Count
                </NavLink>

                <NavLink
                  to="/dashboard/global-limits"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 font-bold shadow-lg shadow-cyan-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">🌍</span> Global Limits
                </NavLink>
                <NavLink
                  to="/dashboard/user-limits"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 font-bold shadow-lg shadow-indigo-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">⚙️</span> User Limits
                </NavLink>
                <NavLink
                  to="/dashboard/get-usage"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-green-500 font-bold shadow-lg shadow-teal-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">🤖</span> AI Usage By Users
                </NavLink>
                <NavLink
                  to="/dashboard/get-reports"
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-red-500 to-pink-500 font-bold shadow-lg shadow-red-500/50"
                        : "hover:bg-gray-800/50 hover:translate-x-1"
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="text-xl">📋</span> User Reports
                </NavLink>
              </>
            )}
          </nav>
          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-4" />
          <div className="px-4 text-center py-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl py-3">
              <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                👤 {userInfo?.name}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content on the right side */}
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
