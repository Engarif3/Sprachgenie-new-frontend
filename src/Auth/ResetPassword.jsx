// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate, useLocation } from "react-router-dom"; // Updated import
// import Container from "../utils/Container";
// import api from "../axios";
// import DarkVeil from "../View/Home/DarkVeil";

// const ResetPassword = () => {
//   const [password, setPassword] = useState("");
//   const [repeatPassword, setRepeatPassword] = useState(""); // State for repeat password
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate(); // Use navigate
//   const location = useLocation();

//   // Extract userId and token from query params
//   const params = new URLSearchParams(location.search);
//   const userId = params.get("userId");
//   const token = params.get("token");

//   const handlePasswordChange = (e) => setPassword(e.target.value);
//   const handleRepeatPasswordChange = (e) => setRepeatPassword(e.target.value); // Handler for repeat password

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Check if password is at least 6 characters long
//     if (password.length < 6) {
//       setError("Password must be at least 6 characters long.");
//       return;
//     }

//     // Check if password and repeat password match
//     if (password !== repeatPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     try {
//       const response = await api.post("/auth/reset-password", {
//         id: userId,
//         token: token,
//         password: password,
//       });

//       setMessage(response.data.message);

//       // Redirect after 1 second to allow the user to read the success message
//       setTimeout(() => navigate("/login"), 1000);
//     } catch (err) {
//       setError("Invalid link. Failed to reset password. Please try again.");
//     }
//   };

//   return (
//     <Container>
//       <div className="min-h-screen flex justify-center items-center">
//         <div className="fixed inset-0 -z-10">
//           <DarkVeil />
//         </div>
//         <div>
//           <h2 className="text-center text-xl mb-8 text-green-700">
//             Reset Your Password
//           </h2>

//           {/* Show success or error message */}
//           {message && <div className="text-green-500">{message}</div>}
//           {error && <div className="text-red-500">{error}</div>}

//           <form onSubmit={handleSubmit}>
//             <div>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={handlePasswordChange}
//                 required
//                 placeholder="Enter new password"
//                 className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
//               />
//             </div>

//             <div>
//               <input
//                 type="password"
//                 value={repeatPassword}
//                 onChange={handleRepeatPasswordChange}
//                 required
//                 placeholder="Repeat new password"
//                 className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
//               />
//             </div>

//             <div className="flex justify-center mt-4">
//               <button type="submit" className="btn btn-sm btn-warning">
//                 Reset Password
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </Container>
//   );
// };

// export default ResetPassword;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Container from "../utils/Container";
import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Disable form if token used

  const navigate = useNavigate();
  const location = useLocation();

  // Extract userId and token from query params
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");
  const token = params.get("token");

  useEffect(() => {
    // Check if this token was already used
    const usedToken = localStorage.getItem("usedResetToken");
    if (usedToken && usedToken === token) {
      setError("This link is invalid or has already been used.");
      setIsDisabled(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDisabled || isLoading) return;

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        id: userId,
        token,
        password,
      });

      setMessage(response.data.message);

      // Store token in localStorage to prevent reuse
      localStorage.setItem("usedResetToken", token);

      setIsDisabled(true); // Disable form after successful submission

      // Redirect after short delay
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError("Invalid link or failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <div className="min-h-screen flex justify-center items-center">
        <div className="fixed inset-0 -z-10">
          <DarkVeil />
        </div>
        <div className="bg-stone-800 p-8 rounded-md w-full max-w-md">
          <h2 className="text-center text-xl mb-6 text-green-700">
            Reset Your Password
          </h2>

          {message && (
            <div className="text-green-500 text-center mb-4">{message}</div>
          )}
          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter new password"
              className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
              disabled={isDisabled}
            />
            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              placeholder="Repeat new password"
              className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
              disabled={isDisabled}
            />
            <button
              type="submit"
              className={`btn btn-sm btn-warning w-full ${
                isDisabled || isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isDisabled || isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default ResetPassword;
