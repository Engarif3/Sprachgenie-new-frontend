// // auth, helpers/axios folder important for implementing cookies

// import { useState } from "react";
// import { toast } from "sonner";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { validationSchema } from "./validation";
// import { Link, useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { userLogin } from "../services/actions/userLogin";
// import { storeUserInfo } from "../services/auth.services";

// const Login = () => {
//   const navigate = useNavigate();
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({
//     resolver: zodResolver(validationSchema),
//     defaultValues: { email: "", password: "" },
//   });

//   const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

//   const handleLogin = async (formData) => {
//     try {
//       const res = await userLogin(formData);
//       if (res?.data?.accessToken) {
//         toast.success(res.message);
//         storeUserInfo({ accessToken: res?.data?.accessToken });
//         navigate("/");
//       } else {
//         setError(res?.message || "Login failed");
//       }
//     } catch (err) {
//       setError(err?.message || "An error occurred");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md text-center">
//         <h2 className="text-xl font-semibold">Login</h2>
//         {error && (
//           <div className="bg-red-500 text-white text-sm p-2 rounded mt-2">
//             {error}
//           </div>
//         )}
//         <form onSubmit={handleSubmit(handleLogin)} className="mt-4">
//           <div className="mb-3 text-left">
//             <label className="block text-sm font-medium">Email</label>
//             <input
//               type="email"
//               {...register("email")}
//               className="w-full border p-2 rounded mt-1"
//             />
//             {errors.email && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.email.message}
//               </p>
//             )}
//           </div>

//           <div className="mb-3 text-left">
//             <label className="block text-sm font-medium">Password</label>
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 {...register("password")}
//                 className="w-full border p-2 rounded mt-1"
//               />
//               <button
//                 type="button"
//                 onClick={togglePasswordVisibility}
//                 className="absolute inset-y-0 right-2 text-sm text-gray-500"
//               >
//                 {showPassword ? "Hide" : "Show"}
//               </button>
//             </div>
//             {errors.password && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.password.message}
//               </p>
//             )}
//           </div>

//           <div className="text-right text-sm text-gray-600 mt-2">
//             <Link to="/forgot-password" className="hover:underline">
//               Forgot Password?
//             </Link>
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white py-2 rounded mt-3 hover:bg-blue-600"
//           >
//             Login
//           </button>

//           <p className="text-sm text-gray-600 mt-4">
//             Don't have an account?
//             <Link to="/register" className="text-blue-700 font-semibold ml-1">
//               Register
//             </Link>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;

import { useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "./validation";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { userLogin } from "../services/actions/userLogin";
import { storeUserInfo } from "../services/auth.services";
import DarkVeil from "../View/Home/DarkVeil";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Diagnostics for debugging fetch failures (HTTP status, body, cookie visibility)
  const [diagnostics, setDiagnostics] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: { email: "", password: "" },
  });

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleLogin = async (formData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await userLogin(formData);
      console.log("Login response:", res); // Debug log

      // ✅ Token now in httpOnly cookie (not in response body)
      if (res?.success) {
        toast.success(res.message || "Login successful");

        // ✅ Fetch user info from /auth/me
        const userInfo = await fetchUserInfo();
        console.log("User info:", userInfo); // Debug log

        if (userInfo) {
          storeUserInfo(userInfo);
          navigate("/");
        } else {
          setError("Failed to fetch user information");
        }
      } else {
        setError(res?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err); // Debug log
      setError(err?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Fetch user info from a protected endpoint (with diagnostics)
  const fetchUserInfo = async () => {
    try {
      console.log(
        "Fetching user info from:",
        `${import.meta.env.VITE_BACKEND_API_URL}/auth/me`
      );

      // Clear prior diagnostics
      setDiagnostics(null);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/auth/me`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const cookiesVisible =
        typeof document !== "undefined" ? document.cookie : "";

      if (!response.ok) {
        const errorText = await response.text();
        const diag = {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          cookiesVisible,
          note: "httpOnly cookies are not visible to JavaScript. If Set-Cookie is present, check Network → Response headers for Set-Cookie.",
        };
        console.error("Failed to fetch user info:", diag);
        setDiagnostics(diag);
        return null;
      }

      const data = await response.json();
      console.log("Fetched user data:", data); // Debug log

      // Clear diagnostics on success
      setDiagnostics(null);
      return data?.data || null;
    } catch (error) {
      const diag = {
        error: error?.message || String(error),
        stack: error?.stack,
        cookiesVisible: typeof document !== "undefined" ? document.cookie : "",
      };
      console.error("Error fetching user info:", diag);
      setDiagnostics(diag);
      return null;
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* DarkVeil fullscreen background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      {/* Home button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-20 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all duration-300"
      >
        🏠 Home
      </Link>

      {/* Login form */}
      <div className="w-full max-w-md text-white p-8 rounded-3xl shadow-2xl text-center z-10 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm">
        <div className="mb-6">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-full mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Sign in to continue your learning journey
          </p>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        {diagnostics && (
          <div className="mt-3 text-left text-sm text-gray-300 bg-black/20 p-3 rounded-xl mb-4">
            <div className="font-semibold mb-1">Diagnostics</div>
            {diagnostics.status && (
              <div className="mb-1">
                Status: {diagnostics.status} {diagnostics.statusText || ""}
              </div>
            )}
            {diagnostics.body && (
              <div className="mb-1">
                Body:{" "}
                <pre className="whitespace-pre-wrap">{diagnostics.body}</pre>
              </div>
            )}
            {diagnostics.error && (
              <div className="mb-1">Error: {diagnostics.error}</div>
            )}
            <div className="mb-1">
              Cookies visible to JS:{" "}
              {diagnostics.cookiesVisible ? (
                diagnostics.cookiesVisible
              ) : (
                <em>None</em>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Note: httpOnly cookies are not visible to JavaScript. To confirm
              cookie delivery, open DevTools → Network → select the login
              request → check Response headers for <code>Set-Cookie</code>.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full bg-gray-700/50 border border-gray-600 focus:border-blue-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                ❌ {errors.email.message}
              </p>
            )}
          </div>

          <div className="text-left">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              🔑 Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-blue-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                placeholder="••••••••••"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-3 text-sm text-gray-400 hover:text-white font-semibold transition-colors duration-300"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                ❌ {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 font-semibold transition-all duration-300"
            >
              🤔 Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
              isSubmitting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105"
            }`}
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "🔄 Logging in..." : "🚀 Login"}
          </button>

          <div className="pt-4 border-t border-gray-700/50">
            <p className="text-sm text-gray-400">
              Don't have an account?
              <Link
                to="/register"
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 font-bold ml-2 transition-all duration-300"
              >
                ✨ Register Now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
