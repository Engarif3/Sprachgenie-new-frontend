import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DarkVeil from "../View/Home/DarkVeil";
import api from "../axios";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      const response = await api.get(`/auth/verify-email?token=${token}`);
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
      <div className="text-center flex justify-center items-center min-h-screen">
        <div className="fixed inset-0 -z-10">
          <DarkVeil />
        </div>
        <div className="flex flex-col justify-center items-center gap-4 max-w-md mx-4">
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <h2 className="text-2xl text-white">Verifying your email...</h2>
              <p className="text-gray-300">
                Please wait while we verify your email address.
              </p>
            </>
          ) : verificationStatus === "success" ? (
            <>
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl text-green-400 font-bold">
                Email Verified!
              </h2>
              <p className="text-white text-center">
                Your email has been successfully verified. You can now log in to
                your account.
              </p>
              {/* <p className="text-gray-300 text-sm">
                Redirecting to login page...
              </p> */}
              <Link
                to="/login"
                className="font-semibold text-lg btn btn-primary mt-4"
              >
                Go to Login
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl">❌</div>
              <h2 className="text-2xl text-red-400 font-bold">
                Verification Failed
              </h2>
              <p className="text-white text-center">
                The verification link is invalid or has expired.
              </p>
              <div className="flex flex-col gap-3 mt-4">
                <Link
                  to="/resend-verification"
                  className="font-semibold text-lg btn btn-warning"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/login"
                  className="font-semibold text-lg btn btn-primary"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If no token, show the default verification page
  return (
    <div className="text-center flex justify-center items-center min-h-screen">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>
      <div className="flex flex-col justify-center items-center gap-4">
        <h2 className="text-2xl text-white">
          Please verify your email before logging in.
        </h2>{" "}
        <p className="mb-12">
          <Link
            to="/login"
            className=" font-semibold  text-lg btn  btn-primary"
          >
            Login
          </Link>
        </p>
        <p className="text-white">Verification link expired? or invalid?</p>
        <p>
          <Link
            to="/resend-verification"
            className=" font-semibold  text-lg btn btn-sm btn-warning"
          >
            Resend Verification
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
