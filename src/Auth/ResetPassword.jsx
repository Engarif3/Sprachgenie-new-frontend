import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IoEye,
  IoEyeOff,
  IoShieldCheckmarkOutline,
  IoLockClosedOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";
import AuthHomeLink from "../components/auth/AuthHomeLink";
import Button from "../components/UI/Button";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Disable form if token used
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

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
    } catch {
      setError("Invalid link or failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <AuthHomeLink />

      <div className="w-full max-w-md text-white p-8 rounded-3xl shadow-2xl text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm">
        <div className="mb-6">
          <div className="inline-block p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 rounded-full mb-4">
            <IoShieldCheckmarkOutline size={36} className="text-emerald-300" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
            Reset Your Password
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Choose a new password for your account
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="reset-password-new"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
            >
              <IoLockClosedOutline aria-hidden="true" />
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-password-new"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-emerald-500 p-3 pr-12 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-60"
                disabled={isDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                surface="dark"
                size="sm"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={isDisabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IoEyeOff size={22} /> : <IoEye size={22} />}
              </Button>
            </div>
          </div>

          <div className="text-left">
            <label
              htmlFor="reset-password-repeat"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
            >
              <IoLockClosedOutline aria-hidden="true" />
              Repeat Password
            </label>
            <div className="relative">
              <input
                id="reset-password-repeat"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-emerald-500 p-3 pr-12 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-60"
                disabled={isDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                surface="dark"
                size="sm"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={isDisabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IoEyeOff size={22} /> : <IoEye size={22} />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            surface="dark"
            size="lg"
            fullWidth
            disabled={isDisabled || isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
