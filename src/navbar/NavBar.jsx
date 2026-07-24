import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthButton from "../components/UI/AuthButton/AuthButton";
import { useAuth } from "../services/auth.services";
import { FaBook, FaHome, FaSun, FaMoon } from "react-icons/fa";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { RiRadioFill } from "react-icons/ri";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTranslation } from "react-i18next";
import Container from "../utils/Container";
import ENFlag from "../assets/EN.svg";
import DEFlag from "../assets/DE.svg";
import ShareSiteModal from "./ShareSiteModal";
import { useChallengeStreak } from "../hooks/useChallengeStreak";
import { useNotifications } from "../hooks/useNotifications";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { getAvatarUrl } from "../utils/avatar";

const getUserInitials = (name, email) => {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const NavBar = () => {
  const { t } = useTranslation("common");
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isVisitorMenuOpen, setIsVisitorMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const {
    safeUserInfo: userInfo,
    isAdmin,
    isLoggedIn: userLoggedIn,
    isBootstrapResolved,
  } = useAuth();
  const desktopProfileMenuRef = useRef(null);
  const desktopProfileToggleRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const mobileProfileToggleRef = useRef(null);
  const mobileVisitorMenuRef = useRef(null);
  const mobileVisitorToggleRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { currentStreak } = useChallengeStreak();
  const { unreadCount } = useNotifications();
  const { settings: profileSettings } = useProfileSettings();
  // Don't compute an avatar from userInfo until the initial /auth/me
  // bootstrap has resolved — otherwise this briefly renders off of
  // whatever stale/empty auth state exists at first paint (e.g. after a
  // reload), then flips to the real one a moment later.
  const avatarUrl = isBootstrapResolved
    ? getAvatarUrl(userInfo, profileSettings)
    : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedDesktopProfile =
        desktopProfileMenuRef.current?.contains(event.target) ||
        desktopProfileToggleRef.current?.contains(event.target);
      const clickedMobileProfile =
        mobileProfileMenuRef.current?.contains(event.target) ||
        mobileProfileToggleRef.current?.contains(event.target);
      const clickedVisitorMenu =
        mobileVisitorMenuRef.current?.contains(event.target) ||
        mobileVisitorToggleRef.current?.contains(event.target);

      if (!clickedDesktopProfile && !clickedMobileProfile) {
        setIsProfileMenuOpen(false);
      }

      if (!clickedVisitorMenu) {
        setIsVisitorMenuOpen(false);
      }
    };

    if (isProfileMenuOpen || isVisitorMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen, isVisitorMenuOpen]);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsVisitorMenuOpen(false);
  }, [location.pathname]);

  const navbarBackgroundClass =
    "bg-gray-800/95 dark:bg-slate-950/55 backdrop-blur-lg";
  const mobileQuickActionClass =
    "group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-sky-500/12 hover:text-sky-100 hover:shadow-[0_14px_30px_rgba(14,165,233,0.18)] focus:outline-none focus:ring-2 focus:ring-sky-400/40";
  const languageToggleButtonClass =
    "flex items-center justify-center gap-1 bg-teal-900 hover:bg-gray-700/50 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-gray-600";
  const renderLanguageToggle = () => (
    <>
      <span className="flex h-4 w-5 items-center justify-center overflow-visible">
        <img
          src={ENFlag}
          alt="English"
          className={`h-2.9 w-5 transition-all duration-300 ${
            language === "en"
              ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
              : "opacity-40 saturate-75"
          }`}
        />
      </span>
      <span className="flex w-8 items-center justify-center">
        {language === "en" ? (
          <PiToggleLeftFill
            className="text-2xl text-sky-500 mt-[2px]"
            size={22}
          />
        ) : (
          <PiToggleRightFill
            className="text-2xl text-sky-500 mt-[2px]"
            size={22}
          />
        )}
      </span>
      <span className="flex h-4 w-5 items-center justify-center overflow-visible">
        <img
          src={DEFlag}
          alt="Deutsch"
          className={`h-3.5 w-5 transition-all duration-300 ${
            language === "de"
              ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
              : "opacity-40 saturate-75"
          }`}
        />
      </span>
    </>
  );

  const renderProfileMenu = (menuRef, isMobile = false) => (
    <div
      ref={menuRef}
      className="absolute right-0 top-14 z-30 w-56 overflow-hidden rounded-2xl border border-sky-800/60 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-sm"
    >
      <div className="border-b border-slate-700/70 px-3 py-2 text-left">
        <p className="truncate text-sm font-semibold text-white">
          {userInfo?.name}
        </p>
        <p className="truncate text-xs text-slate-400">{userInfo?.email}</p>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <Link
          to="/dashboard"
          onClick={() => setIsProfileMenuOpen(false)}
          className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30"
        >
          📊 {t("navbar.dashboard")}
        </Link>
        <Link
          to="/dashboard/profile"
          onClick={() => setIsProfileMenuOpen(false)}
          className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30"
        >
          👤 Profile
        </Link>
        {/* ========================================== */}
        {userLoggedIn && (
          <Link
            to="/dashboard/notifications"
            onClick={() => setIsProfileMenuOpen(false)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30 flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">🔔 Notifications</span>
            {unreadCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        )}
        {userLoggedIn && (
          <Link
            to="/favorites"
            onClick={() => setIsProfileMenuOpen(false)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30 flex items-center gap-2"
          >
            ❤️ {t("navbar.favorites")}
          </Link>
        )}
        {userLoggedIn && (
          <Link
            to="/challenge"
            onClick={() => setIsProfileMenuOpen(false)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30 flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">🎯 Daily Challenge</span>
            {currentStreak > 0 ? (
              <span className="text-xs text-slate-400">🔥{currentStreak}</span>
            ) : null}
          </Link>
        )}
        {userLoggedIn && (
          <Link
            to="/challenge/leaderboard"
            onClick={() => setIsProfileMenuOpen(false)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30 flex items-center gap-2"
          >
            🏆 Leaderboard
          </Link>
        )}
        {/* ========================================== */}

        {/* {isMobile && isAdmin && ( */}
        {isAdmin && (
          <Link
            to="/create-word"
            onClick={() => setIsProfileMenuOpen(false)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30"
          >
            📝 Create Word
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsShareModalOpen(true);
          }}
          className="rounded-xl border border-transparent px-3 py-2 text-left text-sm font-medium text-white transition-all duration-200 hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-100 hover:shadow-sm hover:shadow-sky-900/30"
        >
          🔗 Share with Friends
        </button>
        {isMobile && (
          <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-700/70 px-3 py-2">
            <button
              onClick={() => {
                toggleLanguage();
                setIsProfileMenuOpen(false);
              }}
              className={languageToggleButtonClass}
              title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
            >
              {renderLanguageToggle()}
            </button>

            <button
              onClick={() => {
                toggleTheme();
                setIsProfileMenuOpen(false);
              }}
              className="flex p-1 rounded-full transition-all duration-300 border bg-cyan-900 hover:bg-gray-700/50 text-white border-gray-700/50"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <FaMoon className="text-lg text-yellow-500 hover:scale-110" />
              ) : (
                <FaSun className="text-lg hover:scale-110" />
              )}
            </button>
          </div>
        )}
        {!isMobile && (
          <div className="mt-1 hidden items-center justify-between rounded-xl border border-slate-700/70 px-3 py-2 md:flex lg:hidden">
            <button
              onClick={() => {
                toggleLanguage();
                setIsProfileMenuOpen(false);
              }}
              className={languageToggleButtonClass}
              title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
            >
              {renderLanguageToggle()}
            </button>

            <button
              onClick={() => {
                toggleTheme();
                setIsProfileMenuOpen(false);
              }}
              className="flex p-1 rounded-full transition-all duration-300 border bg-cyan-900 hover:bg-gray-700/50 text-white border-gray-700/50"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <FaMoon className="text-lg text-yellow-500 hover:scale-110" />
              ) : (
                <FaSun className="text-lg hover:scale-110" />
              )}
            </button>
          </div>
        )}
        <div className="mt-1 flex justify-end border-t border-slate-700/70 pt-2">
          <AuthButton onLogoutComplete={() => setIsProfileMenuOpen(false)} />
        </div>
      </div>
    </div>
  );

  const renderVisitorMenu = () => (
    <div
      ref={mobileVisitorMenuRef}
      className="absolute right-0 top-14 z-30 w-56 overflow-hidden rounded-2xl border border-sky-800/60 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex flex-col gap-1">
        <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-700/70 px-3 py-2">
          <button
            onClick={() => {
              toggleLanguage();
              setIsVisitorMenuOpen(false);
            }}
            className={languageToggleButtonClass}
            title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
          >
            {renderLanguageToggle()}
          </button>

          <button
            onClick={() => {
              toggleTheme();
              setIsVisitorMenuOpen(false);
            }}
            className="flex p-1 rounded-full transition-all duration-300 border bg-cyan-900 hover:bg-gray-700/50 text-white border-gray-700/50"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <FaMoon className="text-lg text-yellow-500 hover:scale-110" />
            ) : (
              <FaSun className="text-lg hover:scale-110" />
            )}
          </button>
        </div>

        <div className="mt-1 flex justify-end border-t border-slate-700/70 pt-2">
          <AuthButton forceLoggedOutView />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`w-full sticky top-0 z-50 ${navbarBackgroundClass}`}>
        <Container>
          <div className="h-1 -mt-2  " />
          <div className="flex flex-wrap items-center justify-between py-3 px-2 text-lg font-semibold relative border-b border-slate-800 mt-0 md:flex-nowrap">
            {/* Title and Mobile Actions */}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 md:w-auto md:flex-none md:px-4">
              <Link
                className="mb-1 whitespace-nowrap text-2xl transition-transform hover:scale-105 sm:text-3xl"
                to="/"
              >
                <span className="text-orange-600 font-extrabold">Sprach</span>
                <span className="text-sky-500 font-extrabold">Genie</span>
              </Link>

              <div className="ml-auto flex items-center md:hidden">
                <div className="mr-2 flex items-center gap-2">
                  {location.pathname !== "/words" && (
                    <Link
                      to="/words"
                      className={mobileQuickActionClass}
                      aria-label={t("navbar.vocabulary")}
                      title={t("navbar.vocabulary")}
                    >
                      <FaBook
                        className="text-[15px] text-sky-300 transition-colors duration-300 group-hover:text-sky-100"
                        size={15}
                      />
                    </Link>
                  )}

                  {location.pathname !== "/radio" && (
                    <Link
                      to="/radio"
                      className={mobileQuickActionClass}
                      aria-label={t("navbar.radio")}
                      title={t("navbar.radio")}
                    >
                      <RiRadioFill
                        className="text-[16px] text-sky-300 transition-colors duration-300 group-hover:text-sky-100"
                        size={16}
                      />
                    </Link>
                  )}

                  {location.pathname !== "/" && (
                    <Link
                      to="/"
                      className={mobileQuickActionClass}
                      aria-label={t("navbar.home")}
                      title={t("navbar.home")}
                    >
                      <FaHome
                        className="text-[15px] text-sky-300 transition-colors duration-300 group-hover:text-sky-100"
                        size={15}
                      />
                    </Link>
                  )}

                  {isBootstrapResolved && userLoggedIn && (
                    <div className="relative">
                      <button
                        ref={mobileProfileToggleRef}
                        type="button"
                        onClick={() =>
                          setIsProfileMenuOpen((current) => !current)
                        }
                        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400/70 bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-md transition-transform duration-300 hover:scale-105"
                        title="Open account menu"
                      >
                        {avatarUrl ? (
                          <img
                            key={avatarUrl}
                            src={avatarUrl}
                            alt={userInfo?.name || "Profile"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {getUserInitials(userInfo?.name, userInfo?.email)}
                          </span>
                        )}
                      </button>
                      {unreadCount > 0 && (
                        <span
                          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-gray-800 bg-orange-500 px-1 text-[10px] font-bold leading-none text-white"
                          aria-label={`${unreadCount} unread notifications`}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}

                      {isProfileMenuOpen &&
                        renderProfileMenu(mobileProfileMenuRef, true)}
                    </div>
                  )}

                  {isBootstrapResolved && !userLoggedIn && (
                    <div className="relative">
                      <button
                        ref={mobileVisitorToggleRef}
                        type="button"
                        onClick={() =>
                          setIsVisitorMenuOpen((current) => !current)
                        }
                        className="rounded-lg border border-sky-700 px-2 py-0 text-2xl font-bold text-sky-400 shadow-lg"
                        aria-label={
                          isVisitorMenuOpen
                            ? "Close visitor menu"
                            : "Open visitor menu"
                        }
                      >
                        {isVisitorMenuOpen ? "✕" : "☰"}
                      </button>

                      {isVisitorMenuOpen && renderVisitorMenu()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Navigation Links */}
            <div className="hidden md:ml-auto md:flex md:flex-row md:flex-nowrap rounded-xl items-center gap-2 md:gap-2 lg:gap-16 w-full md:w-auto px-2 lg:px-4 mt-2 md:mt-0 md:static md:py-0 md:border-0 md:bg-transparent">
              {location.pathname !== "/" && (
                <Link
                  to="/"
                  className="group hidden md:flex items-center justify-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 transition-all duration-300"
                >
                  <FaHome className="text-2xl lg:text-3xl text-sky-500 group-hover:text-sky-500 transition-colors group-hover:animate-bounce" />
                  <span
                    className={
                      "ml-1 lg:ml-2 text-base lg:text-xl text-white group-hover:text-sky-400 transition-colors"
                    }
                  >
                    {t("navbar.home")}
                  </span>
                </Link>
              )}
              {/* //for large screen */}
              {location.pathname !== "/words" && (
                <Link
                  to="/words"
                  className="group hidden md:flex w-full md:w-auto items-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 mt-0 transition-all duration-300"
                >
                  <FaBook
                    className="text-sky-500 group-hover:text-sky-500 transition-colors group-hover:animate-bounce"
                    size={18}
                  />
                  <span className="ml-1 lg:ml-2 text-base lg:text-xl text-white group-hover:text-sky-400 transition-colors">
                    {t("navbar.vocabulary")}
                  </span>
                </Link>
              )}
              {location.pathname !== "/radio" && (
                <Link
                  to="/radio"
                  className="group hidden md:flex w-full md:w-auto items-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 mt-0 transition-all duration-300"
                >
                  <RiRadioFill
                    className="text-sky-500 group-hover:text-sky-500 transition-colors group-hover:animate-bounce"
                    size={20}
                  />
                  <span className="ml-1 lg:ml-2 text-base lg:text-xl text-white group-hover:text-sky-400 transition-colors">
                    {t("navbar.radio")}
                  </span>
                </Link>
              )}
              {userLoggedIn && (
                <>
                  <Link
                    to="/favorites"
                    className="group hidden lg:flex items-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 transition-all duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 122.88 107.39"
                      className="w-6 h-6 fill-red-600 hover:fill-red-500 transition-colors group-hover:animate-bounce"
                    >
                      <path d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z" />
                    </svg>
                    <span className="ml-2 text-xl text-white group-hover:text-sky-400 transition-colors">
                      {t("navbar.favorites")}
                    </span>
                  </Link>
                </>
              )}
              {/* {userLoggedIn && (
            <Link
              to={"/words"}
              className="btn btn-sm btn-warning w-full md:w-auto "
            >
              Words List
            </Link>
          )} */}

              {/* Language Toggle Button with SVG Flags */}
              <button
                onClick={toggleLanguage}
                className={`${languageToggleButtonClass} ${userLoggedIn ? "hidden lg:flex" : "hidden md:flex"}`}
                title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
              >
                {renderLanguageToggle()}
              </button>

              {/* Theme Toggle Button */}
              <div className={userLoggedIn ? "hidden lg:block" : "block"}>
                <button
                  onClick={toggleTheme}
                  className="flex p-1 rounded-full transition-all duration-300  border
               bg-cyan-900 hover:bg-gray-700/50 text-white
               border-gray-700/50 "
                  title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? (
                    <FaMoon className="text-lg  text-yellow-500 hover:scale-110" />
                  ) : (
                    <FaSun className="text-lg hover:scale-110 " />
                  )}
                </button>
              </div>

              <div className="relative ml-auto flex min-w-[8.5rem] items-center justify-end">
                {!isBootstrapResolved ? null : userLoggedIn ? (
                  <>
                    <button
                      ref={desktopProfileToggleRef}
                      type="button"
                      onClick={() =>
                        setIsProfileMenuOpen((current) => !current)
                      }
                      className="hidden h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400/70 bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-md transition-transform duration-300 hover:scale-105 md:flex"
                      title="Open account menu"
                    >
                      {avatarUrl ? (
                        <img
                          key={avatarUrl}
                          src={avatarUrl}
                          alt={userInfo?.name || "Profile"}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>
                          {getUserInitials(userInfo?.name, userInfo?.email)}
                        </span>
                      )}
                    </button>
                    {unreadCount > 0 && (
                      <span
                        className="absolute right-0 top-0 hidden h-5 min-w-5 items-center justify-center rounded-full border-2 border-gray-800 bg-orange-500 px-1 text-[10px] font-bold leading-none text-white md:flex"
                        aria-label={`${unreadCount} unread notifications`}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}

                    {isProfileMenuOpen &&
                      renderProfileMenu(desktopProfileMenuRef, false)}
                  </>
                ) : (
                  <AuthButton hideWhenLoggedIn={userLoggedIn} />
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
      <div className="bg-gray-50 dark:bg-transparent">
        {userLoggedIn ? (
          <p className="text-end mr-2 md:mr-24 text-black dark:text-white py-4 ">
            {t("welcome")}{" "}
            <span className="font-semibold text-pink-600 ">
              {userInfo?.name}
            </span>
          </p>
        ) : (
          <div className="mr-2 md:mr-24 flex justify-end py-4">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-2 text-sm font-semibold text-sky-700 transition-all duration-200 hover:border-sky-500/70 hover:bg-sky-500/15 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
            >
              🔗 Share with Friends
            </button>
          </div>
        )}
      </div>
      {isShareModalOpen && (
        <ShareSiteModal onClose={() => setIsShareModalOpen(false)} />
      )}
    </>
  );
};

export default NavBar;
