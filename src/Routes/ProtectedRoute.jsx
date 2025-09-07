import { Navigate } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";

const ProtectedRoute = ({ children }) => {
  const userInfo = getUserInfo();

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
