import { useState } from "react";
import api from "../axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState();
  const [error, setError] = useState();

  const handleForgotPassword = async () => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while sending the request."
      );
      setMessage(null);
    }
  };

  return (
    <div className="text-center flex justify-center items-center min-h-screen">
      <div>
        <h2 className="text-2xl font-semibold mb-12">Forgot Password</h2>
        <p className="flex justify-center items-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-purple-600 rounded text-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn  btn-primary" onClick={handleForgotPassword}>
            Send
          </button>
        </p>
        {message && (
          <p className="mt-4 text-green-700 font-semibold">{message}</p>
        )}
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
