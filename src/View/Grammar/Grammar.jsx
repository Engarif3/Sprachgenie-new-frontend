import { useNavigate } from "react-router-dom";
import Container from "../../utils/Container";
import { IoBookOutline, IoArrowForwardOutline } from "react-icons/io5";

const Grammar = () => {
  const navigate = useNavigate();
  const grammarTypes = [
    { id: 1, topic: "Clauses" },
    { id: 2, topic: "Passive Voice" },
    { id: 3, topic: "Verb with Preposition" },
    { id: 4, topic: "Adjective with Preposition" },
    { id: 5, topic: "Perfekt & Präteritum" },
    { id: 6, topic: "Verbs ending with - gehen" },
  ];
  return (
    <Container>
      <div className="max-w-7xl mx-auto p-4 mb-4 min-h-screen">
        {/* Header Section */}
        <div className="text-center mb-12 mt-8">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
              <IoBookOutline size={16} aria-hidden="true" />
              Learn Grammar
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-4">
            Grammar Topics
          </h2>
          <p className="text-xl dark:text-gray-300 max-w-2xl mx-auto">
            Master German grammar with clear explanations and examples
          </p>
          <div className="flex justify-center mt-6">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grammarTypes.map((grammarType) => (
            <div
              key={grammarType.id}
              className="group relative border border-slate-200 bg-white p-6 rounded-2xl transition-all duration-500 cursor-pointer hover:-translate-y-3 hover:scale-105 overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.1)] hover:border-orange-200 hover:shadow-[0_25px_50px_rgba(15,23,42,0.18),0_0_20px_rgba(249,115,22,0.15)] dark:border-gray-700/50 dark:bg-gradient-to-br dark:from-gray-800/80 dark:via-gray-900 dark:to-black dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] dark:hover:border-orange-500/40 dark:hover:shadow-[0_25px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(249,115,22,0.25)]"
              onClick={() => navigate(`/grammar/${grammarType.id}`)}
            >
              {/* Animated gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-orange-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>

              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 flex justify-end">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 transition-transform duration-300 group-hover:scale-110 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
                    <IoBookOutline aria-hidden="true" size={28} />
                  </div>
                </div>

                {/* Topic Title */}
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-pink-400 transition-all duration-300 mb-3 dark:text-white">
                  {grammarType.topic}
                </h3>

                {/* View Button */}
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                  <span>Learn More</span>
                  <IoArrowForwardOutline
                    size={16}
                    aria-hidden="true"
                    className="transform group-hover:translate-x-1 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Grammar;
