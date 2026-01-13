import { Link } from "react-router-dom";

const HomeCard = ({ title, text, link, icon }) => {
  return (
    <Link
      to={link}
      className="block bg-gradient-to-br from-orange-600/20 via-gray-800 to-gray-900 border-2 border-orange-500/40 hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] p-6 md:p-8 rounded-2xl transition-all duration-300 group cursor-pointer hover:-translate-y-2 hover:scale-105"
    >
      <div className="text-center">
        <div className="text-5xl md:text-6xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 inline-block">
          {icon}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 group-hover:text-orange-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-3 md:mb-4 min-h-[3.5rem] md:min-h-[4rem]">
          {text}
        </p>
        <div className="flex items-center justify-center gap-2 text-orange-500 font-semibold text-sm md:text-base group-hover:gap-4 transition-all duration-300">
          <span>Explore Now</span>
          <span className="text-xl md:text-2xl">→</span>
        </div>
      </div>
    </Link>
  );
};

export default HomeCard;
