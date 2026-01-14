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
    <div className="px-4 py-6">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="mb-4">
          <span className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-full text-blue-400 font-semibold text-sm">
            🎯 Dashboard
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
          Welcome Back, {userInfo.name}!
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Manage your vocabulary journey and explore learning tools
        </p>
        <div className="flex justify-center mt-6">
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Your Role</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-1 capitalize">
                {userInfo.role?.replace("_", " ")}
              </p>
            </div>
            <div className="text-5xl">👤</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                Account Status
              </p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-1">
                Active
              </p>
            </div>
            <div className="text-5xl">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border-2 border-orange-500/30 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Quick Access</p>
              <p className="text-2xl font-bold text-white mt-1">
                {
                  quickLinks.filter(
                    (link) =>
                      !link.admin ||
                      userInfo.role === "admin" ||
                      userInfo.role === "super_admin"
                  ).length
                }{" "}
                Tools
              </p>
            </div>
            <div className="text-5xl">🚀</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">⚡</span> Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks
            .filter(
              (link) =>
                !link.admin ||
                userInfo.role === "admin" ||
                userInfo.role === "super_admin"
            )
            .map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="group relative bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-gray-700/50 hover:border-gray-600 p-6 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 overflow-hidden shadow-xl"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {link.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {link.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{link.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    <span>Access</span>
                    <span className="text-lg transform group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">💡</div>
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3">
          Need Help?
        </h3>
        <p className="text-gray-300 mb-6">
          Explore the sidebar menu to access all dashboard features and manage
          your learning experience.
        </p>
        <Link
          to="/words"
          className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
        >
          Browse Vocabulary
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;
