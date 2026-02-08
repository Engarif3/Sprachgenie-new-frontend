// src/pages/DashboardHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";

const DashboardHome = () => {
  const userInfo = getUserInfo() || {};

  const quickLinks = [
    {
      icon: "❤️",
      title: "Favorite Words",
      description: "View and manage your saved vocabulary",
      link: "/dashboard/favorites-words",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: "📝",
      title: "Create Word",
      description: "Add new vocabulary to the database",
      link: "/dashboard/create-word",
      gradient: "from-blue-500 to-cyan-500",
      admin: true,
    },
    {
      icon: "💬",
      title: "Conversations",
      description: "Manage dialogue content",
      link: "/dashboard/create-conversation",
      gradient: "from-green-500 to-emerald-500",
      admin: true,
    },
    {
      icon: "👥",
      title: "Manage Users",
      description: "Control user access and permissions",
      link:
        userInfo.role === "super_admin"
          ? "/dashboard/update-user-status"
          : "/dashboard/update-basic-user-status",
      gradient: "from-purple-500 to-pink-500",
      admin: true,
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12  min-h-screen">
      {/* Welcome Section */}
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="mb-4"></div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Welcome back, <span className="text-blue-400">{userInfo.name}</span>
        </h1>
        <p className="text-gray-300 text-base md:text-lg font-medium">
          Manage your vocabulary journey and learning progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800/70 transition-all duration-300">
          <p className="text-gray-400 text-sm font-semibold mb-2">Your Role</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-400 capitalize mb-2">
            {userInfo.role?.replace("_", " ")}
          </p>
          <span className="text-2xl">👤</span>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:bg-gray-800/70 transition-all duration-300">
          <p className="text-gray-400 text-sm font-semibold mb-2">
            Account Status
          </p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 mb-2">
            Active
          </p>
          <span className="text-2xl">✅</span>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 hover:bg-gray-800/70 transition-all duration-300">
          <p className="text-gray-400 text-sm font-semibold mb-2">
            Quick Access
          </p>
          <p className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">
            {
              quickLinks.filter(
                (link) =>
                  !link.admin ||
                  userInfo.role === "admin" ||
                  userInfo.role === "super_admin",
              ).length
            }{" "}
            Tools
          </p>
          <span className="text-2xl">🚀</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks
            .filter(
              (link) =>
                !link.admin ||
                userInfo.role === "admin" ||
                userInfo.role === "super_admin",
            )
            .map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="group bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-xl p-6 transition-all duration-300 hover:bg-gray-800 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-300">
                    {link.icon}
                  </div>
                  <span className="text-blue-400 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    →
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                  {link.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-base">
                  {link.description}
                </p>
              </Link>
            ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-8 md:p-10 text-center max-w-4xl mx-auto hover:border-blue-500/50 transition-all duration-300">
        <div className="text-4xl mb-4">💡</div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Getting Started
        </h3>
        <p className="text-gray-300 text-base md:text-lg font-medium mb-6">
          Use the sidebar menu to access all dashboard features and manage your
          learning journey.
        </p>
        <Link
          to="/words"
          className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
        >
          Browse Vocabulary
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;
