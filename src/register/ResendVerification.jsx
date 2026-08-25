import { useState, useEffect } from "react";

import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";
import {
  IoPaperPlaneOutline,
  IoMailOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
} from "react-icons/io5";
import AuthHomeLink from "../components/auth/AuthHomeLink";
import Button from "../components/UI/Button";

const RESEND_VERIFICATION_COOLDOWN_MINUTES = 5;
const RESEND_VERIFICATION_STORAGE_KEY = "resendVerificationTimestamp";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState();
  const [error, setError] = useState();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  useEffect(() => {
    const stored = localStorage.getItem(RESEND_VERIFICATION_STORAGE_KEY);

    if (!stored) {
      return;
    }

    const timestamp = parseInt(stored, 10);
    const now = Date.now();
    const diff =
      RESEND_VERIFICATION_COOLDOWN_MINUTES * 60 * 1000 - (now - timestamp);

    if (diff > 0) {
      setCooldown(Math.ceil(diff / 1000));
    } else {
      localStorage.removeItem(RESEND_VERIFICATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          localStorage.removeItem(RESEND_VERIFICATION_STORAGE_KEY);
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
      const timestamp = Date.now();
      localStorage.setItem(
        RESEND_VERIFICATION_STORAGE_KEY,
        timestamp.toString(),
      );
      setCooldown(RESEND_VERIFICATION_COOLDOWN_MINUTES * 60);
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
          err.response.data?.message || "Too many attempts. Please try later.",
        );
        setCooldown(seconds);
        setMessage(null);
      } else {
        const apiMessage = err?.response?.data?.message;
        setError(
          apiMessage ||
            "An error occurred while resending the verification email.",
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
    <div className="relative min-h-screen flex items-center justify-center px-3">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <AuthHomeLink />

      <div className="w-full max-w-md text-white p-8 rounded-3xl shadow-2xl text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm">
        <div className="mb-6">
          <div className="inline-block p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-full mb-4">
            <IoPaperPlaneOutline size={36} className="text-cyan-300" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Resend Verification
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            We'll send a new verification link to your inbox
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
            htmlFor="resend-verification-email"
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
          >
            <IoMailOutline aria-hidden="true" />
            Email
          </label>
          <input
            id="resend-verification-email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full bg-gray-700/50 border border-gray-600 focus:border-cyan-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSending || cooldown > 0}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          surface="dark"
          size="lg"
          fullWidth
          onClick={handleResendVerification}
          disabled={isSending || cooldown > 0}
        >
          {isSending
            ? "Sending..."
            : cooldown > 0
              ? `Try again in ${formatCooldown(cooldown)}`
              : "Send"}
        </Button>

        {cooldown > 0 && (
          <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-1.5">
            <IoHourglassOutline aria-hidden="true" />
            Didn't get the email? Try again in {formatCooldown(cooldown)}.
          </p>
        )}
      </div>
    </div>
  );
};

export default ResendVerification;
