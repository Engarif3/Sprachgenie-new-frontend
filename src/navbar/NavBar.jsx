import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../utils/Container";
import Swal from "sweetalert2";
import AuthButton from "../components/UI/AuthButton/AuthButton";
import { getUserInfo, isLoggedIn } from "../services/auth.services";
import { FaBook, FaHome } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

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

  const handleDeleteAll = () => {
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
        navigate("/delete-all");
      } else {
        console.log("Action canceled or incorrect password.");
      }
    });
  };

  return (
    <Container>
      <div className="bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600  flex flex-wrap justify-between items-center py-2 rounded text-lg font-semibold mt-2 relative">
        {/* Title and Hamburger Menu */}
        <div className="flex justify-between items-center w-full md:w-auto px-4">
          <Link className="text-3xl mb-1" href="/">
            <span className="text-red-600">Sprach</span>
            <span className="text-white">Genie</span>
          </Link>

          {location.pathname !== "/" && (
            <Link
              onClick={() => setIsMenuOpen(false)}
              to="/"
              className="btn btn-sm btn-warning  flex items-center justify-center md:hidden lg:hidden"
            >
              Home
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden btn btn-sm btn-warning"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        {/* Navigation Links */}
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row rounded-lg items-center gap-3 md:gap-4 lg:gap-16 w-full md:w-auto px-4 mt-2 md:mt-0 absolute md:static top-full left-0 z-10 py-4 md:py-0 bg-sky-500 md:bg-transparent lg:bg-transparent bg-opacity-90 `}
        >
          {location.pathname !== "/" && (
            <Link
              to="/"
              className="hidden  md:flex items-center justify-center text-3xl text-red-600 border-b-2 border-white rounded-md  hover:scale-105 px-1"
              // className="btn btn-sm btn-warning hidden  md:flex items-center justify-center "
            >
              {/* Home */}
              <FaHome />
              <span className="ml-2 text-xl mt-2 text-white">Home</span>{" "}
            </Link>
          )}
          {/* //for large screen */}
          {location.pathname !== "/words" && (
            <Link
              onClick={() => setIsMenuOpen(false)}
              to="/words"
              // className="btn btn-sm btn-warning  flex items-center justify-center md:hidden lg:hidden"
              className="hidden md:flex  w-full md:w-auto border-b-2 border-white rounded-md  hover:scale-105 px-1 mt-2"
            >
              <FaBook className="text-red-500" size={24} />{" "}
              <span className="ml-2 text-xl  text-white">Vocabulary</span>
            </Link>
          )}
          {userLoggedIn &&
            (userInfo.role === "basic_user" ||
              userInfo.role === "admin" ||
              userInfo.role === "super_admin") && (
              <>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/favorites"
                  // className="hidden md:block lg:block h-8 w-8 mt-1"
                  className="flex md:hidden lg:hidden btn btn-sm btn-warning w-full md:w-auto text-center "
                >
                  Favorites
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/favorites"
                  // className="hidden md:block lg:block h-8 w-8 mt-1"
                  className="hidden md:flex lg:flex w-full md:w-auto border-b-2 border-white rounded-md  hover:scale-105 px-1"
                >
                  {/* <img src={emptyHeart} className="w-24 h-24" /> */}
                  <span className=" w-[28px] mt-2">
                    <svg
                      id="Layer_1"
                      data-name="Layer 1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 122.88 107.39"
                    >
                      <defs>
                        <style>{`.cls-1 { fill: #ed1b24; fillRule: 'evenodd'; }`}</style>
                      </defs>
                      <title>Favorites</title>
                      <path
                        className="cls-1"
                        d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
                      />
                    </svg>
                  </span>
                  <span className="ml-2 text-xl mt-2 text-white">
                    Favorites
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

          {/* ============ */}
          {userLoggedIn && (
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              // className="btn btn-sm btn-warning w-full md:w-auto text-center hidden lg:flex justify-center items-center"
              className="hidden  md:flex items-center justify-center text-3xl text-red-600 border-b-2 border-white rounded-md  hover:scale-105 px-1"
            >
              {/* Dashboard */}
              <MdDashboard />
              <span className="ml-2 text-xl mt-2 text-white">
                Dashboard
              </span>{" "}
            </Link>
          )}

          {/* ============ */}
          {(userInfo.role === "super_admin" || userInfo.role === "admin") && (
            <>
              <Link
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                to="/create-word"
                className="btn btn-sm btn-warning w-full md:w-auto text-center flex justify-center items-center md:hidden lg:hidden"
              >
                Create Word
              </Link>
              <Link
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                to="/create-conversation"
                className="btn btn-sm btn-warning w-full md:w-auto text-center flex justify-center items-center md:hidden lg:hidden"
              >
                Create Conv
              </Link>
              <Link
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                to="update-conversation"
                className="btn btn-sm btn-warning w-full md:w-auto text-center flex justify-center items-center md:hidden lg:hidden"
              >
                Update Conv
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
                className="btn btn-sm btn-success w-full md:w-auto text-center text-slate-950 font-bold flex justify-center items-center md:hidden lg:hidden"
              >
                Users
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
                className="btn btn-sm btn-success w-full md:w-auto text-center text-slate-950 font-bold flex justify-center items-center md:hidden lg:hidden"
              >
                Users
              </Link>
            </>
          )}
          {userLoggedIn && userInfo.role === "super_admin" && (
            <>
              <button
                onClick={() => handleDeleteAll()}
                className="btn btn-sm btn-warning  hidden "
              >
                Delete All
              </button>
              <Link
                onClick={() => {
                  handleCreateTopic();
                  setIsMenuOpen(false);
                }}
                className="btn btn-sm btn-warning w-full md:w-auto text-center flex justify-center items-center md:hidden lg:hidden "
              >
                Create Topic
              </Link>
            </>
          )}
          {/* <Link to="/login">Login</Link> */}
          <AuthButton></AuthButton>
        </div>{" "}
        {/* <-- This div was missing */}
      </div>
      {userLoggedIn && (
        <p className="text-end mx-2">
          Welcome!{" "}
          <span className="font-semibold text-cyan-700">{userInfo?.name}</span>
        </p>
      )}
    </Container>
  );
};

export default NavBar;
