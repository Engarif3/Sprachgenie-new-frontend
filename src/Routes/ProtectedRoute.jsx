import { Navigate } from "react-router-dom";
import {
  hasAuthSessionHint,
  hasAllowedRole,
  syncCurrentUser,
  useAuth,
} from "../services/auth.services";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userInfo, userRole, isBootstrapResolved } = useAuth();
  const [isResolvingProtectedSession, setIsResolvingProtectedSession] =
    useState(false);

  useEffect(() => {
    if (!isBootstrapResolved || userInfo || isResolvingProtectedSession) {
      return;
    }

    let isMounted = true;

    const resolveProtectedSession = async () => {
      setIsResolvingProtectedSession(true);

      try {
        await syncCurrentUser({ preserveOnFailure: false });
      } finally {
        if (isMounted) {
          setIsResolvingProtectedSession(false);
        }
      }
    };

    resolveProtectedSession();

    return () => {
      isMounted = false;
    };
  }, [isBootstrapResolved, isResolvingProtectedSession, userInfo]);

  if (!isBootstrapResolved || isResolvingProtectedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        Loading...
      </div>
    );
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !hasAllowedRole(userRole, allowedRoles)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Component to redirect authenticated users away from auth pages
export const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (hasAuthSessionHint()) {
        const userInfo = await syncCurrentUser({ preserveOnFailure: false });
        setIsAuthenticated(!!userInfo);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
