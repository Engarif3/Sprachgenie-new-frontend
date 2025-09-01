import { useState } from "react";
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

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
        // Show error inline + toast
        setError(message || "Registration failed");
        toast.error(message || "Registration failed");

        // Optional: handle specific cases
        if (message === "User already exists") {
          // Stay on same page
        } else if (
          message.includes("Please check your email to verify your account!")
        ) {
          navigate("/verify-email");
        }
        return;
      }

      // Success case
      toast.success("Registration successful!");
      navigate("/verify-email");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "An error occurred during registration");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-6 ">
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>
      <div className="w-full max-w-lg  shadow-md rounded-lg p-6 text-center">
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
          <input
            {...register("basicUser.name")}
            type="text"
            placeholder="Name"
            className="w-full p-2 border rounded"
          />
          {errors.basicUser?.name && (
            <p className="text-red-500">{errors.basicUser.name.message}</p>
          )}

          <input
            {...register("basicUser.email")}
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
          {errors.basicUser?.email && (
            <p className="text-red-500">{errors.basicUser.email.message}</p>
          )}

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
          {errors.password && (
            <p className="text-red-500">{errors.password.message}</p>
          )}

          {/* <input
            {...register("basicUser.contactNumber")}
            type="text"
            placeholder="Contact Number"
            className="w-full p-2 border rounded"
          />
          {errors.basicUser?.contactNumber && (
            <p className="text-red-500">
              {errors.basicUser.contactNumber.message}
            </p>
          )}

          <input
            {...register("basicUser.address")}
            type="text"
            placeholder="Address"
            className="w-full p-2 border rounded"
          />
          {errors.basicUser?.address && (
            <p className="text-red-500">{errors.basicUser.address.message}</p>
          )} */}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
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
    </div>
  );
};

export default Register;
