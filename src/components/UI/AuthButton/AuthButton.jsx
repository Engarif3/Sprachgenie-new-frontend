import { toast } from "sonner";
import { removeUser, useAuth } from "../../../services/auth.services";
import { useNavigate } from "react-router-dom";
import { startTransition } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Button from "../Button";

const AuthButton = ({
  forceLoggedOutView = false,
  hideWhenLoggedIn = false,
  onLogoutComplete,
}) => {
  const { t } = useTranslation("common");
  const { userId } = useAuth();
  const navigate = useNavigate();
  const showLoggedInActions = userId && !forceLoggedOutView;

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
    });

    if (!result.isConfirmed) {
      return;
    }

    //  Call logout API to clear httpOnly cookies
    await removeUser();
    toast.success("Logged out successfully");
    onLogoutComplete?.();

    startTransition(() => {
      navigate("/");
    });
  };

  if (userId && hideWhenLoggedIn) {
    return null;
  }

  return (
    <>
      {showLoggedInActions ? (
        <Button variant="danger" onClick={handleLogout}>
          {t("navbar.logout")}
        </Button>
      ) : (
        <Button variant="primary" to="/login">
          {t("navbar.login")}
        </Button>
      )}
    </>
  );
};

export default AuthButton;
