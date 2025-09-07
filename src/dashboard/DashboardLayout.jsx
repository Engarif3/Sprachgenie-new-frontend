import { Link, Outlet } from "react-router-dom";
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
      <div className="flex min-h-screen   mb-12">
        <button
          className="lg:hidden absolute mt-[4px] left-2 z-50 bg-sky-600 text-white p-2 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
        {/* Sidebar */}
        {/* <aside className="w-64  text-white flex flex-col  rounded-md bg-stone-800"> */}
        <aside
          className={`fixed lg:static w-64 text-white flex flex-col rounded-md bg-stone-800 transform transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div className=" py-2 text-2xl font-bold  text-center  text-sky-500">
            Dashboard
          </div>
          <hr className="border-0 border-b  border-orange-600 mx-2" />

          {/* Sidebar menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              to="/dashboard"
              className="block py-2 px-3 rounded hover:bg-cyan-700"
              onClick={() => setIsOpen(!isOpen)}
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
              onClick={() => setIsOpen(!isOpen)}
            >
              Favorites Words
            </Link>

            {/* <hr className="border-0 border-b  border-pink-950 mx-2" /> */}

            {role === "super_admin" && (
              <div className=" ">
                <Link
                  to="/dashboard/update-user-status"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Manage Users
                </Link>
                <Link
                  to="/dashboard/topic"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Topic
                </Link>
              </div>
            )}

            {role === "admin" && (
              <Link
                to="/dashboard/update-basic-user-status"
                className="block py-2 px-3 rounded hover:bg-cyan-700"
                onClick={() => setIsOpen(!isOpen)}
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
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Word
                </Link>
                <Link
                  to="/dashboard/create-conversation"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Create Conversation
                </Link>
                <Link
                  to="/dashboard/update-conversation"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Update Conversation
                </Link>

                <Link
                  to="/dashboard/users-favorite-count"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Favorites Count
                </Link>
                {/* <Link
                  to="/dashboard/update-limits"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                >
                  Update Limits
                </Link> */}
                <Link
                  to="/dashboard/global-limits"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Global Limits
                </Link>
                <Link
                  to="/dashboard/user-limits"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  User Limits
                </Link>
                <Link
                  to="/dashboard/get-usage"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  AI Usage By Users
                </Link>
                <Link
                  to="/dashboard/get-reports"
                  className="block py-2 px-3 rounded hover:bg-cyan-700"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  User Reports
                </Link>
              </>
            )}
            {/* 
            {role === "super_admin" && (
              <Link
                to="/dashboard/delete-all"
                className="block py-2 px-3 rounded hover:bg-cyan-700"
                onClick={() => setIsOpen(!isOpen)}
              >
                Delete All
              </Link>
            )} */}
          </nav>
          <hr className="border-0 border-b  border-orange-600 mx-2" />
          <div className="px-4  text-center text-sky-500 italic">
            <p className="text-sm my-3 "> {userInfo?.name}</p>
          </div>
        </aside>

        {/* Main Content on the right side */}
        <main className="flex-1 pl-0 md:pl-4 lg:pl-4 overflow-y-auto mt-8">
          <Outlet />
        </main>
      </div>
    </Container>
  );
};

export default DashboardLayout;
