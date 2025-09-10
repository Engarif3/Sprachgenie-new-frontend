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
          className="fixed md:hidden lg:hidden mt-[4px] left-2 z-50 bg-sky-600 text-white p-2 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>

        {/* Sidebar */}
        <aside
          className={`fixed lg:static w-64 text-white flex flex-col rounded-md bg-stone-800 z-40 transform transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div className="py-2 text-2xl font-bold text-center text-sky-500">
            Dashboard
          </div>
          <hr className="border-0 border-b border-orange-600 mx-2" />

          {/* Sidebar menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `block py-2 px-3 rounded hover:bg-cyan-700 ${
                  isActive ? "bg-cyan-700 font-bold" : ""
                }`
              }
              onClick={() => setIsOpen(!isOpen)}
            >
              Overview
            </NavLink>

            <NavLink
              to="/dashboard/favorites-words"
              className={({ isActive }) =>
                `block py-2 px-3 rounded hover:bg-cyan-700 ${
                  isActive ? "bg-cyan-700 font-bold" : ""
                }`
              }
              onClick={() => setIsOpen(!isOpen)}
            >
              Favorites Words
            </NavLink>

            {role === "super_admin" && (
              <div className=" ">
                <NavLink
                  to="/dashboard/update-user-status"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Manage Users
                </NavLink>
                <NavLink
                  to="/dashboard/topic"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Topic
                </NavLink>
              </div>
            )}

            {role === "admin" && (
              <NavLink
                to="/dashboard/update-basic-user-status"
                className={({ isActive }) =>
                  `block py-2 px-3 rounded hover:bg-cyan-700 ${
                    isActive ? "bg-cyan-700 font-bold" : ""
                  }`
                }
                onClick={() => setIsOpen(!isOpen)}
              >
                Manage Users
              </NavLink>
            )}

            {(role === "admin" || role === "super_admin") && (
              <>
                <NavLink
                  to="/dashboard/create-word"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Word
                </NavLink>
                <NavLink
                  to="/dashboard/create-conversation"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Conversation
                </NavLink>
                <NavLink
                  to="/dashboard/update-conversation"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Update Conversation
                </NavLink>

                <NavLink
                  to="/dashboard/users-favorite-count"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Favorites Count
                </NavLink>

                <NavLink
                  to="/dashboard/global-limits"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Global Limits
                </NavLink>
                <NavLink
                  to="/dashboard/user-limits"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  User Limits
                </NavLink>
                <NavLink
                  to="/dashboard/get-usage"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  AI Usage By Users
                </NavLink>
                <NavLink
                  to="/dashboard/get-reports"
                  className={({ isActive }) =>
                    `block py-2 px-3 rounded hover:bg-cyan-700 ${
                      isActive ? "bg-cyan-700 font-bold" : ""
                    }`
                  }
                  onClick={() => setIsOpen(!isOpen)}
                >
                  User Reports
                </NavLink>
              </>
            )}
          </nav>
          <hr className="border-0 border-b border-orange-600 mx-2" />
          <div className="px-4 text-center text-sky-500 italic">
            <p className="text-sm my-3"> {userInfo?.name}</p>
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
