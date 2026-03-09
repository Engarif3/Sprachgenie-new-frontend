// import { toast } from "sonner";
// import { getUserInfo, removeUser } from "../../../services/auth.services";
// import { Link } from "react-router-dom";

// const AuthButton = () => {
//   const userInfo = getUserInfo();
//   // const navigate = useNavigate();
//   const handleLogout = () => {
//     removeUser();
//     toast.success("Logged out successfully");
//     router.refresh();
//   };
//   return (
//     <>
//       {userInfo?.id ? (
//         <Link to="/" className="btn btn-sm btn-error" onClick={handleLogout}>
//           Logout
//         </Link>
//       ) : (
//         <Link className="btn btn-sm btn-primary" to="/login">
//           Login
//         </Link>
//       )}
//     </>
//   );
// };

// export default AuthButton;

import { toast } from "sonner";
import { removeUser, useAuth } from "../../../services/auth.services";
import { Link, useNavigate } from "react-router-dom";
import { startTransition } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

const AuthButton = ({
  forceLoggedOutView = false,
  hideWhenLoggedIn = false,
  onLogoutComplete,
}) => {
  const { t } = useTranslation("common");
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const showLoggedInActions = userInfo?.id && !forceLoggedOutView;

  const buttonBaseClass =
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-0";
  const loginButtonClass = `${buttonBaseClass} border-sky-500/60 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-900/30 hover:from-sky-400 hover:to-blue-500 focus:ring-sky-400/60`;
  const logoutButtonClass = `${buttonBaseClass} border-rose-500/35 bg-rose-500/5 text-rose-100 shadow-sm shadow-rose-900/20 backdrop-blur-sm hover:border-rose-500 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-900/30 focus:ring-rose-400/50`;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Log out?",
      text: "You will need to sign in again to access your dashboard.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#334155",
      background: "#0f172a",
      color: "#f8fafc",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    //  Call logout API to clear httpOnly cookies
    await removeUser();
    toast.success("Logged out successfully");
    onLogoutComplete?.();

    startTransition(() => {
      navigate("/login");
    });
  };

  if (userInfo?.id && hideWhenLoggedIn) {
    return null;
  }

  return (
    <>
      {showLoggedInActions ? (
        <button onClick={handleLogout} className={logoutButtonClass}>
          {t("navbar.logout")}
        </button>
      ) : (
        <Link className={loginButtonClass} to="/login">
          {t("navbar.login")}
        </Link>
      )}
    </>
  );
};

export default AuthButton;
