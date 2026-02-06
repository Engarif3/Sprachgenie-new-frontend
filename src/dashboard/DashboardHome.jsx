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
    <div className="px-4 md:px-8 py-6 md:py-12">
      {/* Welcome Section */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-500/50 rounded-full text-blue-300 font-bold text-base md:text-lg">
            🎯 Dashboard
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 drop-shadow-lg">
          Welcome Back, {userInfo.name}!
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto font-medium">
          Manage your vocabulary journey and explore learning tools
        </p>
        <div className="flex justify-center mt-8">
          <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/15 backdrop-blur-xl border-2 border-blue-400/40 rounded-3xl p-8 hover:border-blue-400/70 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-base md:text-lg font-semibold">
                Your Role
              </p>
              <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 mt-3 capitalize drop-shadow">
                {userInfo.role?.replace("_", " ")}
              </p>
            </div>
            <div className="text-6xl md:text-7xl">👤</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xl border-2 border-purple-400/40 rounded-3xl p-8 hover:border-purple-400/70 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-base md:text-lg font-semibold">
                Account Status
              </p>
              <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mt-3 drop-shadow">
                Active
              </p>
            </div>
            <div className="text-6xl md:text-7xl">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/15 to-red-500/15 backdrop-blur-xl border-2 border-orange-400/40 rounded-3xl p-8 hover:border-orange-400/70 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-base md:text-lg font-semibold">
                Quick Access
              </p>
              <p className="text-4xl md:text-5xl font-black text-white mt-3 drop-shadow">
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
            </div>
            <div className="text-5xl">🚀</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-8 flex items-center gap-4">
          <span className="text-5xl md:text-6xl">⚡</span> Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                className="group relative bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-gray-700/50 hover:border-gray-500 p-8 rounded-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-110 hover:shadow-2xl overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

                <div className="relative z-10">
                  <div className="text-7xl md:text-8xl mb-6 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                    {link.icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                    {link.title}
                  </h3>
                  <p className="text-gray-300 text-base md:text-lg font-medium">
                    {link.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-blue-300 font-bold text-base md:text-lg group-hover:gap-3 transition-all duration-300">
                    <span>Access</span>
                    <span className="text-xl md:text-2xl transform group-hover:translate-x-2 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/15 backdrop-blur-xl border-2 border-cyan-400/40 rounded-3xl p-10 md:p-12 text-center hover:border-cyan-400/60 transition-all duration-300">
        <div className="text-7xl md:text-8xl mb-6 drop-shadow-lg">💡</div>
        <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300 mb-4">
          Need Help?
        </h3>
        <p className="text-gray-200 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
          Explore the sidebar menu to access all dashboard features and manage
          your learning experience.
        </p>
        <Link
          to="/words"
          className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-10 py-4 rounded-full font-bold text-white text-lg transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-cyan-500/50"
        >
          Browse Vocabulary
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;
