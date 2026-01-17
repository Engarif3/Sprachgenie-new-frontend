import React, { useState, useEffect } from "react";

import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState();
  const [error, setError] = useState();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (cooldown > 0) return; // prevent action during cooldown

    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post("/auth/resend-verification", { email });
      // Response shape: { success: boolean, message: string }
      setMessage(response.data?.message || "Check your email.");
      // Small optimistic cooldown to prevent accidental double clicks
      setCooldown(10);
    } catch (err) {
      // Handle rate limit (429) specially
      if (err?.response?.status === 429) {
        const retryAfterHeader =
          err.response.headers?.["retry-after"] ||
          err.response.headers?.["Retry-After"];
        const retryAfterSeconds = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : err.response.data?.retryAfter;
        const seconds = Number.isFinite(Number(retryAfterSeconds))
          ? Number(retryAfterSeconds)
          : 3600;
        setError(
          err.response.data?.message || "Too many attempts. Please try later."
        );
        setCooldown(seconds);
        setMessage(null);
      } else {
        const apiMessage = err?.response?.data?.message;
        setError(
          apiMessage ||
            "An error occurred while resending the verification email."
        );
        setMessage(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatCooldown = (s) => {
    if (!s) return null;
    if (s >= 3600) return `${Math.ceil(s / 3600)} hour(s)`;
    if (s >= 60) return `${Math.ceil(s / 60)} minute(s)`;
    return `${s} second(s)`;
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
            disabled={isSending || cooldown > 0}
          />
          <button
            className="btn  btn-primary"
            onClick={handleResendVerification}
            disabled={isSending || cooldown > 0}
          >
            {isSending
              ? "Sending..."
              : cooldown > 0
              ? `Try again in ${formatCooldown(cooldown)}`
              : "Send"}
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
