import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { modifyPayload } from "../utils/modifyPayload";
import { registerUser } from "../services/actions/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { defaultValues, validationSchema } from "./validation";
import DarkVeil from "../View/Home/DarkVeil";
import { IoBookOutline, IoClose, IoEye, IoEyeOff } from "react-icons/io5";
import AuthHomeLink from "../components/auth/AuthHomeLink";

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
  location: {
    en: {
      title: "Optional Precise Location",
      body: "This option is enabled by default. If it stays enabled, SprachGenie may ask your browser for your current device location during signup to improve security accuracy. If you deny permission or your browser cannot provide a location, registration still continues with approximate network-based location only.",
      toggleLabel: "German",
    },
    de: {
      title: "Optionale genaue Standortfreigabe",
      body: "Diese Option ist standardmäßig aktiviert. Wenn sie aktiviert bleibt, kann SprachGenie Ihren Browser während der Registrierung nach Ihrem aktuellen Gerätestandort fragen, um die Sicherheitsgenauigkeit zu verbessern. Wenn Sie die Berechtigung ablehnen oder Ihr Browser keinen Standort liefern kann, wird die Registrierung dennoch nur mit einem ungefähren netzbasierten Standort fortgesetzt.",
      toggleLabel: "English",
    },
  },
};

const requestPreciseLocationForSignup = async () => {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy:
            typeof position.coords.accuracy === "number"
              ? position.coords.accuracy
              : null,
          capturedAt: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
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

    const { optionalPreciseLocationConsent, ...restFormData } = formData;
    const preciseLocation = optionalPreciseLocationConsent
      ? await requestPreciseLocationForSignup()
      : null;

    const submissionData = {
      ...restFormData,
      ...(preciseLocation
        ? {
            registrationMetadata: {
              browserGeolocation: preciseLocation,
            },
          }
        : {}),
    };

    const data = modifyPayload(submissionData);

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
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl mb-4">
              ⚠️ {error}
            </div>
          )}
          {emailVerificationMessage && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-300 p-3 rounded-xl mb-4">
              📧 {emailVerificationMessage}
            </div>
          )}
          <form
            onSubmit={handleSubmit(handleRegister)}
            className="mt-6 space-y-4"
          >
            {/* Name */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-300 mb-2 ">
                👤 Name
              </label>
              <input
                {...register("basicUser.name")}
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              {errors.basicUser?.name && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  ❌ {errors.basicUser.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                📧 Email
              </label>
              <input
                {...register("basicUser.email")}
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              {errors.basicUser?.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  ❌ {errors.basicUser.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                🔑 Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-300 mt-2"
                >
                  {showPassword ? <IoEyeOff size={24} /> : <IoEye size={24} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  ❌ {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                🔐 Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-gray-700/50 border border-gray-600 focus:border-purple-500 p-3 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-300 mt-2"
                >
                  {showPassword ? <IoEyeOff size={24} /> : <IoEye size={24} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  ❌ {errors.confirmPassword.message}
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
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setNoticeType("security");
                    setNoticeLanguage("en");
                    setIsNoticeOpen(true);
                  }}
                  className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
                  aria-label="Open security and privacy notice"
                  title="Open security and privacy notice"
                >
                  <IoBookOutline size={18} />
                </button>
              </span>
            </label>
            {errors.privacyAcknowledged && (
              <p className="text-left text-red-400 text-xs mt-1 flex items-center gap-1">
                ❌ {errors.privacyAcknowledged.message}
              </p>
            )}

            <label className="flex items-start gap-3 rounded-2xl border border-gray-700/60 bg-gray-900/40 p-4 text-left transition-all duration-300 hover:border-cyan-500/40">
              <input
                {...register("optionalPreciseLocationConsent")}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              />
              <span className="flex min-w-0 flex-1 items-start justify-between gap-3 text-sm leading-6 text-gray-300">
                <span>Optional precise location check.</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setNoticeType("location");
                    setNoticeLanguage("en");
                    setIsNoticeOpen(true);
                  }}
                  className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
                  aria-label="Open optional precise location notice"
                  title="Open optional precise location notice"
                >
                  <IoBookOutline size={18} />
                </button>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full p-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                isSubmitting
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105"
              }`}
            >
              {isSubmitting ? "🔄 Registering..." : " Register"}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-700/50 mt-6">
            <p className="text-sm text-gray-400">
              Already have an account?
              <Link
                to="/login"
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 font-bold ml-2 transition-all duration-300"
              >
                🔐 Login
              </Link>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Need support?
              <Link
                to="/#contact"
                className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 font-bold ml-2 transition-all duration-300"
              >
                📞 Contact Us
              </Link>
            </p>
          </div>
        </div>

        {/* Password checklist */}
        <div className="text-left p-6 mb-12 rounded-2xl w-full md:w-10/12 lg:w-10/12 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border-2 border-gray-700/50 backdrop-blur-sm text-white text-sm shadow-2xl">
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-full">
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-bold">
                🔒 Password Requirements
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
              <span className="text-xl">{rules.uppercase ? "✅" : "❌"}</span>
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
              <span className="text-xl">{rules.lowercase ? "✅" : "❌"}</span>
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
              <span className="text-xl">{rules.number ? "✅" : "❌"}</span>
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
              <span className="text-xl">{rules.specialChar ? "✅" : "❌"}</span>
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
              <span className="text-xl">{rules.length ? "✅" : "❌"}</span>
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
            <button
              type="button"
              onClick={() => setIsNoticeOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-white/5 text-gray-300 transition hover:border-cyan-400/50 hover:text-white"
              aria-label="Close notice"
            >
              <IoClose size={18} />
            </button>

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
                <button
                  type="button"
                  onClick={() =>
                    setNoticeLanguage((current) =>
                      current === "en" ? "de" : "en",
                    )
                  }
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
                >
                  {activeNotice.toggleLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNoticeOpen(false)}
                  className="rounded-full border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-white/5 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
