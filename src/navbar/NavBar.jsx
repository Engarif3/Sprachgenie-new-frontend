import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AuthButton from "../components/UI/AuthButton/AuthButton";
import { getUserInfo, isLoggedIn } from "../services/auth.services";
import { FaBook, FaHome, FaSun, FaMoon } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTranslation } from "react-i18next";
import Container from "../utils/Container";
import ENFlag from "../assets/EN.svg";
import DEFlag from "../assets/DE.svg";

const NavBar = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // if click is outside both menu and toggle button -> close
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

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

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-gray-800 dark:bg-gray-950 ">
        <Container>
          {isHomePage && (
            <div className="h-1 -mt-2 bg-gray-800 dark:bg-gray-950 " />
          )}
          <div
            className={`flex flex-wrap justify-between items-center py-3 px-2 text-lg font-semibold relative border-b border-slate-800  mt-0 ${
              isHomePage
                ? "bg-gray-800 dark:bg-gray-950"
                : "bg-gray-800 dark:bg-gray-950"
            }`}
          >
            {/* Title and Hamburger Menu */}
            <div className="flex justify-between items-center w-full md:w-auto px-4">
              <Link
                className="text-3xl mb-1 hover:scale-105 transition-transform"
                to="/"
              >
                <span className="text-orange-600 font-extrabold">Sprach</span>
                <span className="text-sky-500 font-extrabold">Genie</span>
              </Link>

              {location.pathname !== "/" && (
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/"
                  className="border border-sky-700 text-white font-bold px-2 py-1 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center md:hidden lg:hidden"
                >
                  🏠 {t("navbar.home")}
                </Link>
              )}

              <button
                ref={toggleRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden   text-sky-400 text-2xl  font-bold px-2 py-0 rounded-lg   shadow-lg border border-sky-700 "
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </div>
            {/* Navigation Links */}
            <div
              ref={menuRef}
              className={`${
                isMenuOpen ? "flex" : "hidden"
              } md:flex flex-col md:flex-row rounded-xl items-center gap-3 md:gap-4 lg:gap-16 w-full md:w-auto px-4 mt-2 md:mt-0 absolute md:static top-full left-0 z-10 py-4 md:py-0 md:border-0 bg-slate-400 bg-opacity-90 md:bg-transparent lg:bg-transparent`}
            >
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
                  onClick={() => setIsMenuOpen(false)}
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
                  {/* ====pc=== */}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="group hidden md:flex items-center justify-center border-b-2 border-white rounded-md hover:scale-105 hover:border-sky-400 px-1 transition-all duration-300"
                  >
                    <MdDashboard
                      size={24}
                      className="text-sky-500 group-hover:text-sky-500 transition-colors group-hover:animate-bounce"
                    />
                    <span className="ml-2 text-xl text-white group-hover:text-sky-400 transition-colors">
                      {t("navbar.dashboard")}
                    </span>
                  </Link>
                  {/* ====mobile=== */}

                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg  flex justify-center items-center md:hidden lg:hidden"
                  >
                    📊 {t("navbar.dashboard")}
                  </Link>
                  <Link
                    to="/words"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg flex justify-center items-center md:hidden lg:hidden"
                  >
                    📚 {t("navbar.vocabulary")}
                  </Link>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/favorites"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg  flex md:hidden lg:hidden justify-center items-center "
                  >
                    ❤️ {t("navbar.favorites")}
                  </Link>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
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

              {/* ============  mobile*/}
              {(userInfo.role === "super_admin" ||
                userInfo.role === "admin") && (
                <>
                  <Link
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    to="/create-word"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg flex justify-center items-center md:hidden lg:hidden"
                  >
                    📝 Create Word
                  </Link>
                  <Link
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    to="/create-conversation"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50 flex justify-center items-center md:hidden lg:hidden"
                  >
                    💬 Create Conv
                  </Link>
                  <Link
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    to="update-conversation"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/50 flex justify-center items-center md:hidden lg:hidden"
                  >
                    ✏️ Update Conv
                  </Link>
                </>
              )}
              {userInfo.role === "admin" && (
                <>
                  <Link
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    to="/update-basic-user-status"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg  flex justify-center items-center md:hidden lg:hidden"
                  >
                    👥 Users
                  </Link>
                </>
              )}
              {userInfo.role === "super_admin" && (
                <>
                  <Link
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    to="/update-user-status"
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg  flex justify-center items-center md:hidden lg:hidden"
                  >
                    👥 Users
                  </Link>
                </>
              )}
              {userLoggedIn && userInfo.role === "super_admin" && (
                <>
                  {/* <button
                onClick={() => handleDeleteAll()}
                className="btn btn-sm btn-warning  hidden "
              >
                Delete All
              </button> */}
                  <Link
                    onClick={() => {
                      handleCreateTopic();
                      setIsMenuOpen(false);
                    }}
                    className="bg-sky-900 text-white font-bold px-6 py-2.5 rounded-full w-full text-center transition-all duration-300 hover:scale-105 shadow-lg flex justify-center items-center md:hidden lg:hidden"
                  >
                    📚 {t("navbar.createTopic")}
                  </Link>
                </>
              )}

              {/* <Link to="/login">Login</Link> */}
              {/* <AuthButton></AuthButton> */}

              {/* Language Toggle Button with SVG Flags */}
              <button
                onClick={toggleLanguage}
                className=" flex items-center justify-center gap-1 bg-teal-900 hover:bg-gray-700/50 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-gray-600 "
                title={`Switch to ${language === "en" ? "Deutsch" : "English"}`}
              >
                <img
                  src={ENFlag}
                  alt="English"
                  className={`w-5 h-2.9 transition-all  duration-300 animate-pulse ${language === "en" ? "opacity-100 scale-110" : "opacity-50"}`}
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
                  className={`w-5 h-3.5 transition-all duration-300 animate-pulse ${language === "de" ? "opacity-100 scale-110" : "opacity-50"}`}
                />
              </button>

              {/* Theme Toggle Button */}
              <div>
                <button
                  onClick={toggleTheme}
                  className="flex p-1 rounded-full transition-all duration-300 hover:scale-110 border
                hover:bg-blue-200  border-red-400 
               bg-gray-800 hover:bg-gray-700/50 text-white
               border-gray-700/50 "
                  title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? (
                    <FaMoon className="text-lg  text-yellow-500" />
                  ) : (
                    <FaSun className="text-lg " />
                  )}
                </button>
              </div>

              {/* <Link to="/login">Login</Link> */}
              <AuthButton></AuthButton>
            </div>
          </div>
        </Container>
      </div>
      <div className="bg-gray-50 dark:bg-transparent">
        {userLoggedIn && (
          <p className="text-end mr-24 text-black dark:text-white py-4 ">
            {t("welcome")}{" "}
            <span className="font-semibold text-pink-600 ">
              {userInfo?.name}
            </span>
          </p>
        )}
      </div>
    </>
  );
};

export default NavBar;
