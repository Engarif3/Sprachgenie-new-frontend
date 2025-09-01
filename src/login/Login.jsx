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
    // if (isSubmitting) return; // prevent duplicate calls

    setIsSubmitting(true);
    setError("");
    try {
      const res = await userLogin(formData);
      if (res?.data?.accessToken) {
        toast.success(res.message);
        storeUserInfo({ accessToken: res?.data?.accessToken });
        navigate("/");
      } else {
        setError(res?.message || "Login failed");
      }
    } catch (err) {
      setError(err?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* DarkVeil fullscreen background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      {/* Login form */}
      <div className="w-full max-w-md  text-white p-6 rounded-lg shadow-md text-center z-10 bg-stone-800">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>

        {error && (
          <div className="bg-red-500 text-white text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)}>
          <div className="mb-3 text-left">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full border p-2 rounded mt-1 text-black"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-3 text-left">
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full border p-2 rounded mt-1 text-black"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-2 text-sm text-gray-500 "
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right text-sm text-red-600 mt-2 mb-4">
            <Link to="/forgot-password" className="hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded mt-2 hover:bg-blue-600"
          >
            Login
          </button> */}
          {/* Submit button with spinner */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center gap-2 py-2 rounded mt-2 text-white ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
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
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-white mt-4">
            Don't have an account?
            <Link to="/register" className="text-blue-700 font-bold ml-1">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
