import { Navigate } from "react-router-dom";
import { getUserInfo } from "../services/auth.services";
import { useState, useEffect } from "react";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userInfo = getUserInfo();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles
      .map((role) => normalizeRole(role))
      .includes(normalizeRole(userInfo.role))
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
      // First check cached user info
      const cachedUser = getUserInfo();
      if (cachedUser) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // If no cached user, check with server
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/auth/me`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.data) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else if (response.status === 401) {
          // 401 is expected for unauthenticated users, don't log as error
          setIsAuthenticated(false);
        } else {
          // Other errors (4xx, 5xx) - log but continue
          console.warn(`Auth check failed with status: ${response.status}`);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Network error - silent fail
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Allow access for unauthenticated users
  return children;
};

export default ProtectedRoute;
