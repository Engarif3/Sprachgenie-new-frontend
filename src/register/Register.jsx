import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { modifyPayload } from "../utils/modifyPayload";
import { registerUser } from "../services/actions/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { defaultValues, validationSchema } from "./validation";
import DarkVeil from "../View/Home/DarkVeil";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailVerificationMessage, setEmailVerificationMessage] = useState("");

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  // Watch password for live validation
  const passwordValue = watch("password", "");

  const handleRegister = async (formData) => {
    const data = modifyPayload(formData);

    try {
      const res = await registerUser(data);

      if (!res?.data) {
        setError("No response from server");
        return;
      }

      const { success, message } = res.data;

      if (!success) {
        setError(message || "Registration failed");
        toast.error(message || "Registration failed");

        if (message === "User already exists") {
          // Stay on same page
        } else if (
          message.includes("Please check your email to verify your account!")
        ) {
          navigate("/verify-email");
        }
        return;
      }

      toast.success("Registration successful!");
      navigate("/verify-email");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "An error occurred during registration");
    }
  };

  // Password rules
  const rules = {
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    specialChar: /[-!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
    length: passwordValue.length >= 10,
  };

  //   const specialChars = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`;

  return (
    <div className="min-h-screen flex justify-center items-center p-6">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>
      <div className="flex flex-col md:flex-row lg:flex-row gap-4 md:gap-12 lg:gap-12 items-center md:items-end  lg:items-end">
        <div className="w-full max-w-lg shadow-md rounded-lg p-6 text-center bg-stone-800">
          <h2 className="text-xl font-semibold text-white">Register</h2>
          {error && (
            <p className="bg-red-500 text-white p-2 rounded mt-2">{error}</p>
          )}
          {emailVerificationMessage && (
            <p className="bg-yellow-500 text-white p-2 rounded mt-2">
              {emailVerificationMessage}
            </p>
          )}
          <form
            onSubmit={handleSubmit(handleRegister)}
            className="mt-4 space-y-4"
          >
            {/* Name */}
            <input
              {...register("basicUser.name")}
              type="text"
              placeholder="Name"
              className="w-full p-2 border rounded"
            />
            {errors.basicUser?.name && (
              <p className="text-red-500">{errors.basicUser.name.message}</p>
            )}

            {/* Email */}
            <input
              {...register("basicUser.email")}
              type="email"
              placeholder="Email"
              className="w-full p-2 border rounded"
            />
            {errors.basicUser?.email && (
              <p className="text-red-500">{errors.basicUser.email.message}</p>
            )}

            {/* Password */}
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-2.5 text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mt-2">
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-2.5 text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500">{errors.confirmPassword.message}</p>
            )}

            {errors.password && (
              <p className="text-red-500">{errors.password.message}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded mt-2"
            >
              Register
            </button>
          </form>

          <p className="mt-4 text-white">
            Already have an account?
            <Link to="/login" className="text-blue-700 font-semibold ml-1">
              Login
            </Link>
          </p>
        </div>

        {/* Password checklist */}
        <div className=" text-left  p-1 mb-12 rounded-md w-full md:w-10/12 lg:md:w-10/12 bg-sky-700 text-white">
          <ul className="steps steps-vertical  w-full ">
            <li className={`step ${rules.uppercase ? "step-primary" : ""}`}>
              {rules.uppercase ? "✅" : "❌"} At least one uppercase letter
            </li>
            <li className={`step ${rules.lowercase ? "step-primary" : ""}`}>
              {rules.lowercase ? "✅" : "❌"} At least one lowercase letter
            </li>
            <li className={`step ${rules.number ? "step-primary" : ""}`}>
              {rules.number ? "✅" : "❌"} At least one number
            </li>
            <li className={`step ${rules.specialChar ? "step-primary" : ""}`}>
              {rules.specialChar ? "✅" : "❌"} At least one special character
            </li>
            <li className={`step ${rules.length ? "step-primary" : ""}`}>
              {rules.length ? "✅" : "❌"} Minimum 10 characters
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
