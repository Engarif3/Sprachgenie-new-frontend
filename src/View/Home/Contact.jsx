import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import Container from "../../utils/Container";

const Contact = () => {
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
        "JYmbcbb9qXSLOn_sQ"
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
    <div className="bg-gray-800/30 py-20" id="contact">
      <Container>
        <div className="text-center mb-16">
          <div className="mb-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
              📧 Get In Touch
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-4">
            Contact Me
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions or feedback? I'd love to hear from you!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-center items-center gap-12 px-4">
          {/* Contact Info */}
          <div className="w-full lg:w-1/2 max-w-lg space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  ✉️
                </div>
                <h3 className="text-2xl font-bold text-white">Email</h3>
              </div>
              <p className="text-gray-300 text-lg">
                Drop me a message and I'll respond as soon as possible.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  💡
                </div>
                <h3 className="text-2xl font-bold text-white">Feedback</h3>
              </div>
              <p className="text-gray-300 text-lg">
                Your feedback helps improve SprachGenie for everyone!
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  🤝
                </div>
                <h3 className="text-2xl font-bold text-white">Collaborate</h3>
              </div>
              <p className="text-gray-300 text-lg">
                Interested in collaboration? Let's build something amazing!
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full lg:w-1/2 max-w-lg">
            <form
              ref={form}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900 p-8 rounded-2xl border-2 border-gray-700 hover:border-orange-500/50 transition-all duration-300 space-y-9"
            >
              <div>
                <label className="text-white font-semibold mb-2 block">
                  Your Name
                </label>
                <input
                  className={`w-full bg-gray-700/50 border-2 ${
                    errors.name ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all duration-300`}
                  type="text"
                  placeholder="Enter your name"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">
                  Your Email
                </label>
                <input
                  className={`w-full bg-gray-700/50 border-2 ${
                    errors.email ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all duration-300`}
                  type="email"
                  placeholder="your.email@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">
                  Your Message
                </label>
                <textarea
                  className={`w-full bg-gray-700/50 border-2 ${
                    errors.message ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all duration-300 min-h-[150px] resize-y`}
                  placeholder="Enter your message..."
                  {...register("message", {
                    required: "Message is required",
                    minLength: {
                      value: 10,
                      message: "Message must be at least 10 characters",
                    },
                  })}
                ></textarea>
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                className={`w-full px-8 py-4 bg-gradient-to-r from-orange-600 to-pink-600 text-white font-bold rounded-full hover:from-orange-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:scale-[1.02] ${
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
                    Sending...
                  </span>
                ) : (
                  "Send Message"
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
