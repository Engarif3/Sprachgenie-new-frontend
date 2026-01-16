import React, { useState } from "react";

import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState();
  const [error, setError] = useState();

  const handleResendVerification = async () => {
    try {
      const response = await api.post("/auth/resend-verification", { email });
      // Response shape: { success: boolean, message: string }
      setMessage(response.data?.message || "Check your email.");
      setError(null);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(
        apiMessage ||
          "An error occurred while resending the verification email."
      );
      setMessage(null);
    }
  };

  return (
    <div className="text-center flex justify-center items-center min-h-screen">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-12 text-white">
          Resend Verification Link
        </h2>
        <p className="flex justify-center items-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-purple-600 rounded text-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn  btn-primary"
            onClick={handleResendVerification}
          >
            Send
          </button>
        </p>
        <div className="mt-4">
          {message && <p className="text-green-700 font-semibold">{message}</p>}
          {error && <p className="text-red-600 font-semibold">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
