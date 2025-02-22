import { toast } from "sonner";
import { getUserInfo, removeUser } from "../../../services/auth.services";
import { Link } from "react-router-dom";

const AuthButton = () => {
  const userInfo = getUserInfo();
  // const navigate = useNavigate();
  const handleLogout = () => {
    removeUser();
    toast.success("Logged out successfully");
    router.refresh();
  };
  return (
    <>
      {userInfo?.id ? (
        <Link to="/" className="btn btn-sm btn-error" onClick={handleLogout}>
          Logout
        </Link>
      ) : (
        <Link className="btn btn-sm btn-primary" to="/login">
          Login
        </Link>
      )}
    </>
  );
};

export default AuthButton;
