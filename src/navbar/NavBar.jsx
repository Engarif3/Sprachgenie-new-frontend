import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AuthButton from "../components/UI/AuthButton/AuthButton";
import { useAuth } from "../services/auth.services";
import { FaBook, FaHome, FaSun, FaMoon } from "react-icons/fa";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTranslation } from "react-i18next";
import Container from "../utils/Container";
import ENFlag from "../assets/EN.svg";
import DEFlag from "../assets/DE.svg";
import ShareSiteModal from "./ShareSiteModal";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isVisitorMenuOpen, setIsVisitorMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { userInfo: authUserInfo, isLoggedIn: userLoggedIn } = useAuth();
  const userInfo = authUserInfo || {};
  const desktopProfileMenuRef = useRef(null);
  const desktopProfileToggleRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const mobileProfileToggleRef = useRef(null);
  const mobileVisitorMenuRef = useRef(null);
  const mobileVisitorToggleRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

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

  const handleCreateTopic = () => {
    Swal.fire({
      title: "Enter password",
      input: "password",
      inputPlaceholder: "Type password",
      inputValidator: (value) => {
        if (value !== "aydin451280") {
          return "Wrong Password!";
        }
      },
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Proceed to create",
    }).then((result) => {
      if (result.isConfirmed && result.value === "aydin451280") {
        navigate("/topic");
      } else {
        console.log("Action canceled or incorrect password.");
      }
    });
  };

  const isHomePage = location.pathname === "/";
  const mobileQuickActionClass =
    "group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-sky-500/12 hover:text-sky-100 hover:shadow-[0_14px_30px_rgba(14,165,233,0.18)] focus:outline-none focus:ring-2 focus:ring-sky-400/40";

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
        {isMobile &&
          (userInfo.role === "super_admin" || userInfo.role === "admin") && (
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
              className="flex items-center justify-center gap-1 bg-teal-900 hover:bg-gray-700/50 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-gray-600"
              title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
            >
              <img
                src={ENFlag}
                alt="English"
                className={`h-2.9 w-5 transition-all duration-300 ${
                  language === "en"
                    ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                    : "opacity-40 saturate-75"
                }`}
              />
              {language === "en" ? (
                <PiToggleLeftFill
                  className="text-2xl text-sky-500 w-8 mt-[2px]"
                  size={22}
                />
              ) : (
                <PiToggleRightFill
                  className="text-2xl text-sky-500 w-8 mt-[2px]"
                  size={22}
                />
              )}
              <img
                src={DEFlag}
                alt="Deutsch"
                className={`h-3.5 w-5 transition-all duration-300 ${
                  language === "de"
                    ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                    : "opacity-40 saturate-75"
                }`}
              />
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
            className="flex items-center justify-center gap-1 bg-teal-900 hover:bg-gray-700/50 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-gray-600"
            title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
          >
            <img
              src={ENFlag}
              alt="English"
              className={`h-2.9 w-5 transition-all duration-300 ${
                language === "en"
                  ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                  : "opacity-40 saturate-75"
              }`}
            />
            {language === "en" ? (
              <PiToggleLeftFill
                className="text-2xl text-sky-500 w-8 mt-[2px]"
                size={22}
              />
            ) : (
              <PiToggleRightFill
                className="text-2xl text-sky-500 w-8 mt-[2px]"
                size={22}
              />
            )}
            <img
              src={DEFlag}
              alt="Deutsch"
              className={`h-3.5 w-5 transition-all duration-300 ${
                language === "de"
                  ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                  : "opacity-40 saturate-75"
              }`}
            />
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
      <div className="w-full sticky top-0 z-50 bg-gray-800 dark:bg-gray-950 ">
        <Container>
          {isHomePage && (
            <div className="h-1 -mt-2 bg-gray-800 dark:bg-gray-950 " />
          )}
          <div
            className={`flex flex-wrap items-center justify-between py-3 px-2 text-lg font-semibold relative border-b border-slate-800 mt-0 ${
              isHomePage
                ? "bg-gray-800 dark:bg-gray-950"
                : "bg-gray-800 dark:bg-gray-950"
            }`}
          >
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
                <div className="mr-3 flex items-center gap-3">
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

                  {userLoggedIn && (
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
                        {userInfo?.profilePhoto ? (
                          <img
                            src={userInfo.profilePhoto}
                            alt={userInfo?.name || "Profile"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {getUserInitials(userInfo?.name, userInfo?.email)}
                          </span>
                        )}
                      </button>

                      {isProfileMenuOpen &&
                        renderProfileMenu(mobileProfileMenuRef, true)}
                    </div>
                  )}

                  {!userLoggedIn && (
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
            <div className="hidden md:flex md:flex-row rounded-xl items-center gap-3 md:gap-4 lg:gap-16 w-full md:w-auto px-4 mt-2 md:mt-0 md:static md:py-0 md:border-0 md:bg-transparent">
              {location.pathname !== "/" && (
                <Link
                  to="/"
                  className="group hidden md:flex items-center justify-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 transition-all duration-300"
                >
                  <FaHome className="text-3xl text-sky-500 group-hover:text-sky-500 transition-colors group-hover:animate-bounce" />
                  <span
                    className={
                      "ml-2 text-xl text-white group-hover:text-sky-400 transition-colors"
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
                    size={20}
                  />
                  <span className="ml-2 text-xl text-white group-hover:text-sky-400 transition-colors">
                    {t("navbar.vocabulary")}
                  </span>
                </Link>
              )}
              {userLoggedIn && (
                <>
                  <Link
                    to="/favorites"
                    className="group hidden md:flex lg:flex items-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 transition-all duration-300"
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
                className=" flex items-center justify-center gap-1 bg-teal-900 hover:bg-gray-700/50 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-gray-600 "
                title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
              >
                <img
                  src={ENFlag}
                  alt="English"
                  className={`h-2.9 w-5 transition-all duration-300 ${
                    language === "en"
                      ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                      : "opacity-40 saturate-75"
                  }`}
                />
                {language === "en" ? (
                  <PiToggleLeftFill
                    className="text-2xl text-sky-500 w-8 mt-[2px] "
                    size={22}
                  />
                ) : (
                  <PiToggleRightFill
                    className="text-2xl text-sky-500 w-8 mt-[2px]"
                    size={22}
                  />
                )}
                <img
                  src={DEFlag}
                  alt="Deutsch"
                  className={`h-3.5 w-5 transition-all duration-300 ${
                    language === "de"
                      ? "scale-110 opacity-100 brightness-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                      : "opacity-40 saturate-75"
                  }`}
                />
              </button>

              {/* Theme Toggle Button */}
              <div>
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

              <div className="relative ml-auto flex items-center gap-2 md:gap-3">
                {userLoggedIn && (
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
                      {userInfo?.profilePhoto ? (
                        <img
                          src={userInfo.profilePhoto}
                          alt={userInfo?.name || "Profile"}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>
                          {getUserInitials(userInfo?.name, userInfo?.email)}
                        </span>
                      )}
                    </button>

                    {isProfileMenuOpen &&
                      renderProfileMenu(desktopProfileMenuRef, false)}
                  </>
                )}
                <AuthButton hideWhenLoggedIn={userLoggedIn} />
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
