import { Navigate } from "react-router-dom";
import { useAuth } from "@/services/auth.services";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userInfo, isBootstrapResolved } = useAuth();

  if (!isBootstrapResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());
    const currentRole = (userInfo?.role || "").toLowerCase();

    if (!normalizedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
