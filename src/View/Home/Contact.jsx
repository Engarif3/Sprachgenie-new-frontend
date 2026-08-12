import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { useTranslation } from "react-i18next";
import { IoMailOutline, IoBulbOutline, IoPeopleOutline } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext";

const Contact = () => {
  const { t } = useTranslation("home");
  const { theme } = useTheme();
  const isLight = theme === "light";
  const form = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Send email using EmailJS
      const result = await emailjs.sendForm(
        "service_kzff0fs",
        "template_opsy1so",
        form.current,
        "JYmbcbb9qXSLOn_sQ",
      );

      console.log("Email sent successfully:", result.text);

      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: "Thank you for reaching out. I'll get back to you soon!",
        showConfirmButton: false,
        timer: 2000,
      });

      reset();
    } catch (error) {
      console.error("Email send error:", error);

      let errorMessage = "Something went wrong. Please try again later.";

      if (error.text && error.text.includes("Invalid grant")) {
        errorMessage =
          "Email service is temporarily unavailable. Please try contacting via social media or try again later.";
      }

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" py-20" id="contact">
      <Container>
        <div className="text-center mb-10 mt-4">
          <div className="mb-3">
            <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-600 dark:text-orange-400 font-semibold text-sm">
              <IoMailOutline size={16} aria-hidden="true" />
              {t("getInTouch")}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 dark:text-white pb-2">
            {t("contactMe")}
          </h2>
          <p className="text-xl text-gray-950 dark:text-gray-300 max-w-2xl mx-auto">
            {t("contactQuestion")}
          </p>
          <div className="flex justify-center mt-3">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-center items-center gap-12 px-4 ">
          {/* Contact Info */}
          <div className="w-full lg:w-1/2 md:w-full lg:max-w-lg space-y-6">
            <div
              className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] ${
                isLight
                  ? "bg-white border-slate-200 hover:border-blue-400"
                  : "bg-gradient-to-br from-gray-800/80 to-gray-900 border-gray-700 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl text-white">
                  <IoMailOutline aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("email")}
                </h3>
              </div>
              <p className="text-slate-600 dark:text-gray-300 text-lg">
                {t("dropMessage")}
              </p>
            </div>

            <div
              className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] ${
                isLight
                  ? "bg-white border-slate-200 hover:border-blue-400"
                  : "bg-gradient-to-br from-gray-800/80 to-gray-900 border-gray-700 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl text-white">
                  <IoBulbOutline aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("feedback")}
                </h3>
              </div>
              <p className="text-slate-600 dark:text-gray-300 text-lg">
                {t("feedbackDesc")}
              </p>
            </div>

            <div
              className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] ${
                isLight
                  ? "bg-white border-slate-200 hover:border-blue-400"
                  : "bg-gradient-to-br from-gray-800/80 to-gray-900 border-gray-700 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl text-white">
                  <IoPeopleOutline aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("collaborate")}
                </h3>
              </div>
              <p className="text-slate-600 dark:text-gray-300 text-lg">
                {t("collaborateDesc")}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full lg:w-1/2 md:w-full lg:max-w-lg">
            <form
              ref={form}
              onSubmit={handleSubmit(onSubmit)}
              className={`p-4 md:p-8 lg:p-8 rounded-2xl border-2 transition-all duration-300 space-y-9 md:space-y-16 lg:space-y-9 ${
                isLight
                  ? "bg-white border-slate-200 hover:border-blue-400"
                  : "bg-gradient-to-br from-gray-800/80 to-gray-900 border-gray-700 hover:border-blue-500/50"
              }`}
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-slate-900 dark:text-white font-semibold mb-2 block"
                >
                  {t("yourName")}
                </label>
                <input
                  id="contact-name"
                  autoComplete="name"
                  className={`w-full border-2 ${
                    errors.name ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                  } ${
                    isLight ? "bg-white text-slate-900" : "bg-gray-700/50 text-white"
                  } rounded-lg px-4 py-3 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-300`}
                  type="text"
                  placeholder={t("enterYourName")}
                  {...register("name", { required: t("nameRequired") })}
                />
                {errors.name && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="text-slate-900 dark:text-white font-semibold mb-2 block"
                >
                  {t("yourEmail")}
                </label>
                <input
                  id="contact-email"
                  autoComplete="email"
                  className={`w-full border-2 ${
                    errors.email ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                  } ${
                    isLight ? "bg-white text-slate-900" : "bg-gray-700/50 text-white"
                  } rounded-lg px-4 py-3 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-300`}
                  type="email"
                  placeholder={t("yourEmailPlaceholder")}
                  {...register("email", {
                    required: t("emailRequired"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("invalidEmail"),
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="text-slate-900 dark:text-white font-semibold mb-2 block"
                >
                  {t("yourMessage")}
                </label>
                <textarea
                  id="contact-message"
                  className={`w-full border-2 ${
                    errors.message ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                  } ${
                    isLight ? "bg-white text-slate-900" : "bg-gray-700/50 text-white"
                  } rounded-lg px-4 py-3 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-300 min-h-[150px] resize-y`}
                  placeholder={t("enterYourMessage")}
                  {...register("message", {
                    required: t("messageRequired"),
                    minLength: {
                      value: 10,
                      message: t("messageMinLength"),
                    },
                  })}
                ></textarea>
                {errors.message && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                className={`w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-full hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:scale-[1.02] ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("sending")}
                  </span>
                ) : (
                  t("sendMessage")
                )}
              </button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Contact;
