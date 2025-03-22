import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom"; // Updated import
import Container from "../utils/Container";
import api from "../axios";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState(""); // State for repeat password
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Use navigate
  const location = useLocation();

  // Extract userId and token from query params
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");
  const token = params.get("token");

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleRepeatPasswordChange = (e) => setRepeatPassword(e.target.value); // Handler for repeat password

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if password is at least 6 characters long
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Check if password and repeat password match
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        id: userId,
        token: token,
        password: password,
      });

      setMessage(response.data.message);

      // Redirect after 1 second to allow the user to read the success message
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError("Invalid link. Failed to reset password. Please try again.");
    }
  };

  return (
    <Container>
      <div className="min-h-screen flex justify-center items-center">
        <div>
          <h2 className="text-center text-xl mb-8 text-green-700">
            Reset Your Password
          </h2>

          {/* Show success or error message */}
          {message && <div className="text-green-500">{message}</div>}
          {error && <div className="text-red-500">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="Enter new password"
                className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
              />
            </div>

            <div>
              <input
                type="password"
                value={repeatPassword}
                onChange={handleRepeatPasswordChange}
                required
                placeholder="Repeat new password"
                className="border border-purple-600 rounded text-lg p-2 text-center w-full mb-4"
              />
            </div>

            <div className="flex justify-center mt-4">
              <button type="submit" className="btn btn-sm btn-warning">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default ResetPassword;
