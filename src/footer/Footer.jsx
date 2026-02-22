import { FaLinkedinIn, FaFacebook, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <div className="relative footer footer-center bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      <footer className="relative footer p-6 md:p-8 lg:p-10 text-white overflow-hidden border-t-2 border-gray-700/50">
        <div className="relative z-10 w-full flex flex-col justify-center items-center md:block lg:block">
          <div className="mb-6 relative group">
            {/* <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div> */}
            <p className="relative text-4xl md:text-5xl font-bold">
              <span className="text-orange-600 font-extrabold">Sprach</span>
              <span className="text-white font-extrabold">Genie</span>
              {/* <HiSparkles className="inline ml-2 text-yellow-400 animate-pulse" /> */}
            </p>
          </div>
          <div className="text-center md:text-left ">
            <p className="text-gray-400 font-semibold text-sm mb-1 text-center md:text-left lg::text-left ">
              <span className="text-pink-400"></span> Created By
            </p>
            <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
              Md Arifur Rahman
            </p>
            <p className="text-xs text-gray-500 mt-1">
              🎓 Full Stack Developer
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-row  justify-center md:justify-between lg:justify-between w-full gap-8 mt-8">
          <div className="flex flex-col justify-center ">
            <h3 className="mb-4 text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 ">
              🌐 Connect With Me
            </h3>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                target="_blank"
                href="https://www.linkedin.com/in/engarif3"
                className="group relative bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500 hover:to-blue-600 border border-blue-500/50 hover:border-blue-400 p-4 rounded-full transition-all duration-300 hover:scale-125 hover:rotate-12 shadow-lg hover:shadow-blue-500/50"
              >
                <FaLinkedinIn
                  className="text-white group-hover:animate-bounce"
                  size={24}
                />
              </a>
              <a
                target="_blank"
                href="mailto:arif.aust.eng@gmail.com"
                className="group relative bg-gradient-to-r from-orange-500/20 to-orange-600/20 hover:from-orange-500 hover:to-orange-600 border border-orange-500/50 hover:border-orange-400 p-4 rounded-full transition-all duration-300 hover:scale-125 hover:rotate-12 shadow-lg hover:shadow-orange-500/50"
              >
                <FaEnvelope
                  className="text-white group-hover:animate-bounce"
                  size={24}
                />
              </a>
              <a
                target="_blank"
                href="https://www.facebook.com/md.arifurr"
                className="group relative bg-gradient-to-r from-blue-400/20 to-blue-500/20 hover:from-blue-400 hover:to-blue-500 border border-blue-400/50 hover:border-blue-300 p-4 rounded-full transition-all duration-300 hover:scale-125 hover:rotate-12 shadow-lg hover:shadow-blue-500/50"
              >
                <FaFacebook
                  className="text-white group-hover:animate-bounce"
                  size={24}
                />
              </a>
            </div>
          </div>

          <div className="hidden md:flex lg:flex justify-center items-center">
            <div>
              <p className="text-gray-400 text-sm font-semibold mb-3">
                📍 Based in Chemnitz, Germany 🇩🇪
              </p>
              <p className="text-xs text-gray-500 text-center">
                Full Stack Developer | German Learning Platform Builder
              </p>
            </div>
          </div>
        </div>
      </footer>
      <footer className="relative footer footer-center  text-white overflow-hidden pb-8 ">
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 ">
            <span className="text-2xl animate-pulse">©</span>
            <p className="text-gray-300 font-semibold">
              Copyright {new Date().getFullYear()} - All rights reserved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 ">
            <FaEnvelope className="text-blue-400 animate-bounce mt-2" />
            <a
              href="mailto:arif.aust.eng@gmail.com"
              className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 font-bold transition-all duration-300"
            >
              arif.aust.eng@gmail.com
            </a>
          </div>
          <div className="inline-block px-4   mt-2">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span className="text-yellow-400">💡</span>
              <span>Topic titles inspired by Telc A1–B2 books</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
