import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import DarkVeil from "../View/Home/DarkVeil";
import api from "../axios";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoMailUnreadOutline,
} from "react-icons/io5";
import AuthHomeLink from "../components/auth/AuthHomeLink";
import Button from "../components/UI/Button";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token) => {
    setIsVerifying(true);
    try {
      await api.get(`/auth/verify-email?token=${token}`);
      setVerificationStatus("success");
      toast.success("Email verified successfully!");
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus("error");
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // If there's a token, show verification status
  if (token) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-3">
        <div className="fixed inset-0 -z-10">
          <DarkVeil />
        </div>

        <AuthHomeLink />

        <div className="w-full max-w-md text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <h2 className="text-2xl text-white mt-6">
                Verifying your email...
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                Please wait while we verify your email address.
              </p>
            </>
          ) : verificationStatus === "success" ? (
            <>
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 mb-4">
                <IoCheckmarkCircleOutline size={44} aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Email Verified!
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                Your email has been successfully verified. You can now log in
                to your account.
              </p>
              <Button
                to="/login"
                variant="primary"
                surface="dark"
                size="lg"
                fullWidth
                className="mt-6"
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/40 mb-4">
                <IoCloseCircleOutline size={44} aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">
                Verification Failed
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                The verification link is invalid or has expired.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <Button to="/resend-verification" variant="primary" surface="dark" size="lg" fullWidth>
                  Resend Verification Email
                </Button>
                <Button to="/login" variant="secondary" surface="dark" size="lg" fullWidth>
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If no token, show the default verification page
  return (
    <div className="relative min-h-screen flex items-center justify-center px-3">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <AuthHomeLink />

      <div className="w-full max-w-md text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
        <div className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-full mb-4">
          <IoMailUnreadOutline size={36} className="text-blue-300" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
          Verify Your Email
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Please verify your email before logging in.
        </p>
        <p className="text-gray-300 text-sm mt-2">
          Email may take up to 10 minutes to arrive — don't forget to check
          your spam folder too.
        </p>

        <Button to="/login" variant="primary" surface="dark" size="lg" fullWidth className="mt-6">
          Login
        </Button>

        <div className="mt-6 pt-5 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 mb-3">
            Verification link expired? or invalid?
          </p>
          <Button to="/resend-verification" variant="secondary" surface="dark" size="md" fullWidth>
            Resend Verification
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
