import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../utils/Container";
import Swal from "sweetalert2";
import AuthButton from "../components/UI/AuthButton/AuthButton";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

const NavBar = () => {
  const navigate = useNavigate();
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
      <div className="bg-blue-400 flex flex-wrap justify-between items-center py-2 rounded text-lg font-semibold mt-2 relative">
        {/* Title and Hamburger Menu */}
        <div className="flex justify-between items-center w-full md:w-auto px-4">
          <Link className="text-3xl mb-1" href="/">
            <span className="text-red-600">Sprach</span>
            <span>Genie</span>
          </Link>
          <Link
            onClick={() => setIsMenuOpen(false)}
            to="/"
            className="btn btn-sm btn-warning  flex items-center justify-center md:hidden lg:hidden"
          >
            Home
          </Link>
          {/* {userLoggedIn && userInfo.role === "basic_user" && (
            <Link
              to="/favorites"
              // className="ml-10 block md:hidden lg:hidden h-8 w-8 mt-1"
              className="btn btn-sm btn-warning  text-center flex items-center justify-center md:hidden lg:hidden"
            >
              Favorites
            </Link>
          )} */}

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
          } md:flex flex-col md:flex-row rounded-lg items-center gap-3 md:gap-4 lg:gap-16 w-full md:w-auto px-4 mt-2 md:mt-0 absolute md:static top-full left-0 bg-blue-400 z-10 py-4 md:py-0`}
        >
          {/* <Link
            onClick={() => setIsMenuOpen(false)}
            to="/"
            className="btn btn-sm btn-warning w-full md:w-auto text-center"
          >
            Home
          </Link> */}
          <Link
            to="/"
            className="btn btn-sm btn-warning hidden  md:flex items-center justify-center "
          >
            Home
          </Link>
          {userLoggedIn && userInfo.role === "basic_user" && (
            <Link
              onClick={() => setIsMenuOpen(false)}
              to="/favorites"
              // className="hidden md:block lg:block h-8 w-8 mt-1"
              className="btn btn-sm btn-warning w-full md:w-auto text-center"
            >
              {/* <img src={emptyHeart} className="w-24 h-24" /> */}
              {/* <svg
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
              </svg> */}
              Favorites
            </Link>
          )}
          {/* {userLoggedIn && (
            <Link
              to={"/words"}
              className="btn btn-sm btn-warning w-full md:w-auto "
            >
              Words List
            </Link>
          )} */}
          {(userInfo.role === "super_admin" || userInfo.role === "admin") && (
            <>
              <Link
                // onClick={() => {
                //   handleCreateButtonClick();
                //   setIsMenuOpen(false);
                // }}
                to="/create-word"
                className="btn btn-sm btn-warning w-full md:w-auto text-center"
              >
                Create Word
              </Link>
            </>
          )}
          {userLoggedIn && userInfo.role === "super_admin" && (
            <>
              <button
                onClick={() => handleDeleteAll()}
                className="btn btn-sm btn-warning  hidden lg:block "
              >
                Delete All
              </button>
              <Link
                onClick={() => {
                  handleCreateTopic();
                  setIsMenuOpen(false);
                }}
                className="btn btn-sm btn-warning w-full md:w-auto text-center hidden lg:flex justify-center items-center "
              >
                Create Topic
              </Link>
              <Link
                to="/create-conversation"
                className="btn btn-sm btn-warning w-full md:w-auto text-center"
              >
                Create Conv
              </Link>
              <Link
                to="update-conversation"
                className="btn btn-sm btn-warning w-full md:w-auto text-center"
              >
                Update Conv
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
