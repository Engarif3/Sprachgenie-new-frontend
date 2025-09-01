// import { useState } from "react";
// import api from "../axios";
// import DarkVeil from "../View/Home/DarkVeil";

// const ForgotPassword = () => {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState();
//   const [error, setError] = useState();

//   const handleForgotPassword = async () => {
//     try {
//       const response = await api.post("/auth/forgot-password", { email });
//       setMessage(response.data.message);
//       setError(null);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "An error occurred while sending the request."
//       );
//       setMessage(null);
//     }
//   };

//   return (
//     <div className="text-center flex justify-center items-center min-h-screen">
//       <div className="fixed inset-0 -z-10">
//         <DarkVeil />
//       </div>
//       <div>
//         <h2 className="text-2xl font-semibold mb-12 text-white">
//           Forgot Password
//         </h2>
//         <p className="flex justify-center items-center gap-4">
//           <input
//             type="email"
//             placeholder="Enter your email"
//             className="border border-purple-600 rounded text-lg p-2"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <button className="btn  btn-primary" onClick={handleForgotPassword}>
//             Send
//           </button>
//         </p>
//         {message && (
//           <p className="mt-4 text-green-700 font-semibold">{message}</p>
//         )}
//         {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;

import { useState, useEffect } from "react";
import api from "../axios";
import DarkVeil from "../View/Home/DarkVeil";

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
          "An error occurred while sending the request."
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
    <div className="text-center flex justify-center items-center min-h-screen">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>
      <div className="bg-stone-800 p-16 rounded-md">
        <h2 className="text-2xl font-semibold mb-12 text-white ">
          Forgot Password
        </h2>
        <p className="flex justify-center items-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-purple-600 rounded text-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitted}
          />
          <button
            className={`btn btn-primary ${
              isSubmitted || isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleForgotPassword}
            disabled={isSubmitted || isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </p>
        {message && (
          <p className="mt-4 text-green-700 font-semibold">{message}</p>
        )}
        <br />
        <div className="mt-8">
          {isSubmitted && timeLeft > 0 && (
            <p className="ml-2 text-white text-sm">
              <span className="text-sky-600">
                Check your email to reset your password.
              </span>
              <br />
              <br />
              <span className="text-warning">
                {" "}
                Did not get any email? Try again {formatTime(timeLeft)} later
              </span>
            </p>
          )}
        </div>
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
        {isSubmitted && timeLeft <= 0 && (
          <p className="mt-4 text-blue-600 font-semibold">
            Please check your email.
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
