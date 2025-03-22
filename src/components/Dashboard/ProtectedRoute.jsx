import { Route, Redirect } from "react-router-dom";
import { getUserInfo } from "@/services/auth.services";

const ProtectedRoute = ({ element, allowedRoles, ...rest }) => {
  const user = getUserInfo();
  const role = user ? user.role : null;

  if (!role) {
    // If no role found (user not logged in), redirect to login
    return <Redirect to="/login" />;
  }

  // Check if the user's role is allowed to access the route
  if (!allowedRoles.includes(role)) {
    // If role doesn't match allowed roles, redirect to home or an unauthorized page
    return <Redirect to="/" />;
  }

  return <Route {...rest} element={element} />;
};

export default ProtectedRoute;
