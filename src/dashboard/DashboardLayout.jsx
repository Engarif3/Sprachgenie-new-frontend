// src/layouts/DashboardLayout.jsx
import { Link, Outlet } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";
import Container from "../utils/Container";

const DashboardLayout = () => {
  const userInfo = getUserInfo() || {};
  const role = userInfo.role;

  return (
    <Container>
      <div className="flex min-h-screen  mb-12">
        {/* Sidebar */}
        <aside className="w-64  text-white flex flex-col border border-dashed ">
          <div className="px-6 py-2 text-2xl font-bold border-b  text-center">
            Dashboard
          </div>

          {/* Sidebar menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              to="/dashboard"
              className="block py-2 px-3 rounded hover:bg-cyan-700"
            >
              Overview
            </Link>
            {/* <Link
              to="/dashboard/favorites"
              className="block py-2 px-3 rounded hover:bg-cyan-700"
            >
              Favorites Words
            </Link> */}

            <Link
              to="/dashboard/favorites-words"
              className="block py-2 px-3 rounded hover:bg-cyan-700"
            >
              Favorites Words
            </Link>

            {role === "super_admin" && (
              <>
                <Link
                  to="/dashboard/update-user-status"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Manage Users
                </Link>
                <Link
                  to="/dashboard/topic"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Create Topic
                </Link>
              </>
            )}

            {role === "admin" && (
              <Link
                to="/dashboard/update-basic-user-status"
                className="block py-2 px-3 rounded hover:bg-cyan-700"
              >
                Manage Users
              </Link>
            )}

            {(role === "admin" || role === "super_admin") && (
              <>
                {/* <Link
                  to="/dashboard/update-basic-user-status"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Manage Users
                </Link> */}
                <Link
                  to="/dashboard/create-word"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Create Word
                </Link>
                <Link
                  to="/dashboard/create-conversation"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Create Conversation
                </Link>
                <Link
                  to="/dashboard/update-conversation"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Update Conversation
                </Link>

                <Link
                  to="/dashboard/users-favorite-count"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Favorites Count
                </Link>
              </>
            )}

            {role === "super_admin" && (
              <Link
                to="/dashboard/delete-all"
                className="block py-2 px-3 rounded hover:bg-cyan-700"
              >
                Delete All
              </Link>
            )}
          </nav>

          <div className="px-4 py-4 border-t border-cyan-700 text-white">
            <p className="text-sm">Welcome, {userInfo?.name}</p>
          </div>
        </aside>

        {/* Main Content on the right side */}
        <main className="flex-1 pl-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default DashboardLayout;
