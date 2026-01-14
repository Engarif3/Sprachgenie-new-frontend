import { Link } from "react-router-dom";

const HomeCard = ({ title, text, link, icon }) => {
  return (
    <Link
      to={link}
      className="relative block bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-gray-700/50 hover:border-orange-500 p-6 md:p-8 rounded-2xl transition-all duration-500 group cursor-pointer hover:-translate-y-3 hover:scale-105 overflow-hidden shadow-xl hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-orange-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>

      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

      <div className="text-center relative z-10">
        {/* Icon with glow effect */}
        <div className="relative inline-block mb-4 md:mb-6">
          <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="text-5xl md:text-6xl group-hover:scale-125 transition-transform duration-500 relative z-10 filter drop-shadow-lg">
            {icon}
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 group-hover:from-orange-400 group-hover:to-pink-400 mb-3 md:mb-4 transition-all duration-300">
          {title}
        </h3>

        <p className="text-gray-400 group-hover:text-gray-300 text-base md:text-lg leading-relaxed mb-4 md:mb-6 min-h-[3.5rem] md:min-h-[4rem] transition-colors duration-300">
          {text}
        </p>

        {/* CTA Button */}
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-pink-600 group-hover:from-orange-500 group-hover:to-pink-500 text-white font-semibold text-sm md:text-base rounded-full group-hover:gap-4 transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)]">
          <span>Explore Now</span>
          <span className="text-lg md:text-xl transform group-hover:translate-x-1 transition-transform duration-300">
            →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default HomeCard;
