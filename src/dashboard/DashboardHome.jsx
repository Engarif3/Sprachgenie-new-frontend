// src/pages/DashboardHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import {
  IoPersonOutline,
  IoHeartOutline,
  IoCreateOutline,
  IoChatbubbleEllipsesOutline,
  IoBookOutline,
  IoNewspaperOutline,
  IoShieldCheckmarkOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoConstructOutline,
  IoBulbOutline,
  IoArrowForwardOutline,
} from "react-icons/io5";

const DashboardHome = () => {
  const { safeUserInfo: userInfo, isAdmin, isSuperAdmin, userRole } = useAuth();

  const quickLinks = [
    {
      icon: IoPersonOutline,
      title: "Profile Settings",
      description: "Update your information and profile image",
      link: "/dashboard/profile",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: IoHeartOutline,
      title: "Favorite Words",
      description: "View and manage your saved vocabulary",
      link: "/dashboard/favorites-words",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: IoCreateOutline,
      title: "Create Word",
      description: "Add new vocabulary to the database",
      link: "/dashboard/create-word",
      gradient: "from-blue-500 to-cyan-500",
      admin: true,
    },
    {
      icon: IoChatbubbleEllipsesOutline,
      title: "Conversations",
      description: "Manage dialogue content",
      link: "/dashboard/create-conversation",
      gradient: "from-green-500 to-emerald-500",
      admin: true,
    },
    {
      icon: IoBookOutline,
      title: "Generate Story",
      description: "Create AI-powered German stories",
      link: "/dashboard/generate-story",
      gradient: "from-orange-500 to-red-500",
      admin: true,
    },
    {
      icon: IoNewspaperOutline,
      title: "Manage Stories",
      description: "View, publish, and delete stories",
      link: "/dashboard/stories-management",
      gradient: "from-indigo-500 to-purple-500",
      admin: true,
    },
    {
      icon: IoShieldCheckmarkOutline,
      title: "Registration Signals",
      description: "Review signup IP, device, and location metadata",
      link: "/dashboard/registration-metadata",
      gradient: "from-emerald-500 to-teal-500",
      admin: true,
    },
    {
      icon: IoPeopleOutline,
      title: "Manage Users",
      description: "Control user access and permissions",
      link: isSuperAdmin
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
        <PageHeader
          title={
            <>
              Welcome back,{" "}
              <span className="text-sky-500 dark:text-sky-400">
                {userInfo.name || "User"}
              </span>
            </>
          }
          subtitle="Manage your vocabulary journey and learning progress"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none dark:hover:border-blue-500/50 dark:hover:bg-gray-800/70">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <IoPersonOutline size={22} aria-hidden="true" />
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold mb-2">
            Your Role
          </p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 capitalize">
            {userRole.replace("_", " ") || "user"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none dark:hover:border-purple-500/50 dark:hover:bg-gray-800/70">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <IoCheckmarkCircleOutline size={22} aria-hidden="true" />
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold mb-2">
            Account Status
          </p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
            Active
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-orange-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none dark:hover:border-orange-500/50 dark:hover:bg-gray-800/70">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <IoConstructOutline size={22} aria-hidden="true" />
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold mb-2">
            Quick Access
          </p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
            {quickLinks.filter((link) => !link.admin || isAdmin).length} Tools
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks
            .filter((link) => !link.admin || isAdmin)
            .map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none dark:hover:border-blue-500 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${link.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <link.icon size={28} aria-hidden="true" />
                  </div>
                  <IoArrowForwardOutline
                    aria-hidden="true"
                    size={22}
                    className="text-blue-500 dark:text-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {link.title}
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base">
                  {link.description}
                </p>
              </Link>
            ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-8 md:p-10 text-center max-w-4xl mx-auto hover:border-blue-500/50 transition-all duration-300">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
          <IoBulbOutline size={28} aria-hidden="true" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Getting Started
        </h3>
        <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg font-medium mb-6">
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
