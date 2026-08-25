import { useState, useEffect } from "react";
import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";
import {
  IoKeyOutline,
  IoMailOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
} from "react-icons/io5";
import AuthHomeLink from "../components/auth/AuthHomeLink";
import Button from "../components/UI/Button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState();
  const [error, setError] = useState();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const EXPIRY_MINUTES = 15;

  useEffect(() => {
    // Check if there's a stored timestamp
    const stored = localStorage.getItem("forgotPasswordTimestamp");
    if (stored) {
      const timestamp = parseInt(stored, 10);
      const now = new Date().getTime();
      const diff = EXPIRY_MINUTES * 60 * 1000 - (now - timestamp);

      if (diff > 0) {
        setIsSubmitted(true);
        setTimeLeft(Math.ceil(diff / 1000));
      } else {
        localStorage.removeItem("forgotPasswordTimestamp");
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(false);
          localStorage.removeItem("forgotPasswordTimestamp");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const handleForgotPassword = async () => {
    if (isSubmitted || isLoading) return;
    setIsLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setError(null);
      setIsSubmitted(true);
      const timestamp = new Date().getTime();
      localStorage.setItem("forgotPasswordTimestamp", timestamp);
      setTimeLeft(EXPIRY_MINUTES * 60);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while sending the request.",
      );
      setMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <AuthHomeLink />

      <div className="w-full max-w-md text-white p-8 rounded-3xl shadow-2xl text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm">
        <div className="mb-6">
          <div className="inline-block p-4 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full mb-4">
            <IoKeyOutline size={36} className="text-orange-300" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
            Forgot Password
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-xl mb-4">
            <IoWarningOutline size={16} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-300 text-sm p-3 rounded-xl mb-4">
            <IoCheckmarkCircleOutline size={16} className="shrink-0" aria-hidden="true" />
            {message}
          </div>
        )}

        <div className="text-left mb-4">
          <label
            htmlFor="forgot-password-email"
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
          >
            <IoMailOutline aria-hidden="true" />
            Email
          </label>
          <input
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full bg-gray-700/50 border border-gray-600 focus:border-orange-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500/50 transition-all duration-300 disabled:opacity-60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitted}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          surface="dark"
          size="lg"
          fullWidth
          onClick={handleForgotPassword}
          disabled={isSubmitted || isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>

        {isSubmitted && timeLeft > 0 && (
          <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-1.5">
            <IoHourglassOutline aria-hidden="true" />
            Didn't get the email? Try again in {formatTime(timeLeft)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
