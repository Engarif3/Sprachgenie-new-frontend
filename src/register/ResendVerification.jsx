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
      setMessage(response.data);
      setError(null);
    } catch (err) {
      setError(
        err.response.data ||
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
        <p className="mt-4 text-red-600 font-semibold">
          {message && <p className="text-green-700">{message}</p>}
          {error && <p>{error}</p>}
        </p>
      </div>
    </div>
  );
};

export default ResendVerification;
