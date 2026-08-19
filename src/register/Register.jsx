import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { modifyPayload } from "../utils/modifyPayload";
import { registerUser } from "../services/actions/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { defaultValues, validationSchema } from "./validation";
import DarkVeil from "../View/Home/DarkVeil";
import {
  IoBookOutline,
  IoClose,
  IoEye,
  IoEyeOff,
  IoPersonOutline,
  IoMailOutline,
  IoKeyOutline,
  IoLockClosedOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoWarningOutline,
  IoCallOutline,
} from "react-icons/io5";
import AuthHomeLink from "../components/auth/AuthHomeLink";
import Button from "../components/UI/Button";

const NOTICE_COPY = {
  security: {
    en: {
      title: "Security And Privacy Notice",
      body: "To protect accounts and reduce fraud, we record limited signup metadata such as your IP address, browser, device type, and approximate location derived from your network. This data is access-restricted to authorized admins and kept only for a limited retention period.",
      toggleLabel: "German",
    },
    de: {
      title: "Sicherheits- und Datenschutzhinweis",
      body: "Zum Schutz von Konten und zur Reduzierung von Missbrauch erfassen wir bei der Registrierung begrenzte Metadaten wie Ihre IP-Adresse, Ihren Browser, den Gerätetyp und einen ungefähren Standort, der aus Ihrem Netzwerk abgeleitet wird. Diese Daten sind nur für autorisierte Administratoren zugänglich und werden nur für einen begrenzten Aufbewahrungszeitraum gespeichert.",
      toggleLabel: "English",
    },
  },
};

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailVerificationMessage, setEmailVerificationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeType, setNoticeType] = useState("security");
  const [noticeLanguage, setNoticeLanguage] = useState("en");

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const activeNotice = NOTICE_COPY[noticeType][noticeLanguage];

  useEffect(() => {
    if (!isNoticeOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNoticeOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNoticeOpen]);

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
    if (isSubmitting) return; // prevent multiple calls

    setIsSubmitting(true); // disable button immediately
    setError("");

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
    } finally {
      setIsSubmitting(false); // re-enable button after request completes
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

      <AuthHomeLink />

      <div className="flex flex-col-reverse md:flex-row lg:flex-row gap-0 md:gap-8 lg:gap-10 items-center md:items-end lg:items-end mt-8  w-full md:max-w-4xl lg:max-w-4xl">
        <div className="w-full max-w-lg shadow-2xl rounded-3xl p-8 text-center bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm">
          <div className="mb-6 ">
            {/* <div className="inline-block p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full mb-4">
              <span className="text-4xl">""</span>
            </div> */}
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 ">
              Create Account
            </h2>
            {/* <p className="text-gray-400 text-sm mt-2">
              Join us to start your German learning adventure
            </p> */}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl mb-4">
              <IoWarningOutline size={16} className="shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
          {emailVerificationMessage && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-300 p-3 rounded-xl mb-4">
              <IoMailOutline size={16} className="shrink-0" aria-hidden="true" />
              {emailVerificationMessage}
            </div>
          )}
          <form
            onSubmit={handleSubmit(handleRegister)}
            className="mt-6 space-y-4"
          >
            {/* Name */}
            <div className="text-left">
              <label
                htmlFor="register-name"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
              >
                <IoPersonOutline aria-hidden="true" />
                Name
              </label>
              <input
                id="register-name"
                {...register("basicUser.name")}
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              {errors.basicUser?.name && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <IoCloseCircleOutline aria-hidden="true" />
                  {errors.basicUser.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="text-left">
              <label
                htmlFor="register-email"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
              >
                <IoMailOutline aria-hidden="true" />
                Email
              </label>
              <input
                id="register-email"
                {...register("basicUser.email")}
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              {errors.basicUser?.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <IoCloseCircleOutline aria-hidden="true" />
                  {errors.basicUser.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="text-left">
              <label
                htmlFor="register-password"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
              >
                <IoKeyOutline aria-hidden="true" />
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  surface="dark"
                  size="sm"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3"
                >
                  {showPassword ? <IoEyeOff size={24} /> : <IoEye size={24} />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <IoCloseCircleOutline aria-hidden="true" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="text-left">
              <label
                htmlFor="register-confirm-password"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300"
              >
                <IoLockClosedOutline aria-hidden="true" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  {...register("confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  surface="dark"
                  size="sm"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3"
                >
                  {showPassword ? <IoEyeOff size={24} /> : <IoEye size={24} />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <IoCloseCircleOutline aria-hidden="true" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-gray-700/60 bg-gray-900/40 p-4 text-left transition-all duration-300 hover:border-cyan-500/40">
              <input
                {...register("privacyAcknowledged")}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              />
              <span className="flex min-w-0 flex-1 items-start justify-between gap-3 text-sm leading-6 text-gray-300">
                <span>I understand and agree to the security check.</span>
                <Button
                  type="button"
                  variant="ghost"
                  surface="dark"
                  size="sm"
                  onClick={(event) => {
                    event.preventDefault();
                    setNoticeType("security");
                    setNoticeLanguage("en");
                    setIsNoticeOpen(true);
                  }}
                  className="mt-0.5 shrink-0"
                  aria-label="Open security and privacy notice"
                  title="Open security and privacy notice"
                >
                  <IoBookOutline size={18} />
                </Button>
              </span>
            </label>
            {errors.privacyAcknowledged && (
              <p className="text-left text-red-400 text-xs mt-1 flex items-center gap-1">
                <IoCloseCircleOutline aria-hidden="true" />
                {errors.privacyAcknowledged.message}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              surface="dark"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <IoRefreshOutline className="animate-spin" aria-hidden="true" />
                  Registering...
                </span>
              ) : (
                " Register"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-700/50 mt-6">
            <p className="text-sm text-gray-400">
              Already have an account?
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 font-bold ml-2 transition-all duration-300"
              >
                <IoLockClosedOutline size={14} className="text-blue-400" aria-hidden="true" />
                Login
              </Link>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Need support?
              <Link
                to="/#contact"
                className="inline-flex items-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 font-bold ml-2 transition-all duration-300"
              >
                <IoCallOutline size={14} className="text-green-400" aria-hidden="true" />
                Contact Us
              </Link>
            </p>
          </div>
        </div>

        {/* Password checklist */}
        <div className="text-left p-6 mb-12 rounded-2xl w-full md:w-10/12 lg:w-10/12 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm text-white text-sm shadow-2xl">
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-full">
              <p className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-bold">
                <IoLockClosedOutline size={16} className="text-cyan-400" aria-hidden="true" />
                Password Requirements
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            <li
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                rules.uppercase
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-gray-700/30"
              }`}
            >
              <span className="text-xl">
                {rules.uppercase ? (
                  <IoCheckmarkCircleOutline
                    aria-hidden="true"
                    className="text-green-400"
                  />
                ) : (
                  <IoCloseCircleOutline
                    aria-hidden="true"
                    className="text-gray-500"
                  />
                )}
              </span>
              <span
                className={
                  rules.uppercase
                    ? "text-green-300 font-semibold"
                    : "text-gray-400"
                }
              >
                At least one uppercase letter
              </span>
            </li>
            <li
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                rules.lowercase
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-gray-700/30"
              }`}
            >
              <span className="text-xl">
                {rules.lowercase ? (
                  <IoCheckmarkCircleOutline
                    aria-hidden="true"
                    className="text-green-400"
                  />
                ) : (
                  <IoCloseCircleOutline
                    aria-hidden="true"
                    className="text-gray-500"
                  />
                )}
              </span>
              <span
                className={
                  rules.lowercase
                    ? "text-green-300 font-semibold"
                    : "text-gray-400"
                }
              >
                At least one lowercase letter
              </span>
            </li>
            <li
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                rules.number
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-gray-700/30"
              }`}
            >
              <span className="text-xl">
                {rules.number ? (
                  <IoCheckmarkCircleOutline
                    aria-hidden="true"
                    className="text-green-400"
                  />
                ) : (
                  <IoCloseCircleOutline
                    aria-hidden="true"
                    className="text-gray-500"
                  />
                )}
              </span>
              <span
                className={
                  rules.number
                    ? "text-green-300 font-semibold"
                    : "text-gray-400"
                }
              >
                At least one number
              </span>
            </li>
            <li
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                rules.specialChar
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-gray-700/30"
              }`}
            >
              <span className="text-xl">
                {rules.specialChar ? (
                  <IoCheckmarkCircleOutline
                    aria-hidden="true"
                    className="text-green-400"
                  />
                ) : (
                  <IoCloseCircleOutline
                    aria-hidden="true"
                    className="text-gray-500"
                  />
                )}
              </span>
              <span
                className={
                  rules.specialChar
                    ? "text-green-300 font-semibold"
                    : "text-gray-400"
                }
              >
                At least one special character
              </span>
            </li>
            <li
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                rules.length
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-gray-700/30"
              }`}
            >
              <span className="text-xl">
                {rules.length ? (
                  <IoCheckmarkCircleOutline
                    aria-hidden="true"
                    className="text-green-400"
                  />
                ) : (
                  <IoCloseCircleOutline
                    aria-hidden="true"
                    className="text-gray-500"
                  />
                )}
              </span>
              <span
                className={
                  rules.length
                    ? "text-green-300 font-semibold"
                    : "text-gray-400"
                }
              >
                Minimum 10 characters
              </span>
            </li>
          </ul>
        </div>
      </div>

      {isNoticeOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-gray-900 via-slate-950 to-black p-6 text-left text-white shadow-2xl">
            <Button
              type="button"
              variant="ghost"
              surface="dark"
              size="sm"
              onClick={() => setIsNoticeOpen(false)}
              className="absolute right-4 top-4"
              aria-label="Close notice"
            >
              <IoClose size={18} />
            </Button>

            <div className="pr-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <IoBookOutline size={14} />
                Notice
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                {activeNotice.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-gray-300">
                {activeNotice.body}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Language
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  surface="dark"
                  size="sm"
                  onClick={() =>
                    setNoticeLanguage((current) =>
                      current === "en" ? "de" : "en",
                    )
                  }
                >
                  {activeNotice.toggleLabel}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  surface="dark"
                  size="sm"
                  onClick={() => setIsNoticeOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
