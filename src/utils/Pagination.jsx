import { getUserInfo, isLoggedIn } from "../services/auth.services";

const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  showAllData,
  toggleView,
  toggleLearningMode,
  learningMode,
  totalWords,
  setAction,
  showAction,
}) => {
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 mb-8 mt-6">
      {/* Left Side Controls */}
      <div className="flex flex-wrap gap-4 justify-between md:justify-start w-full md:w-auto">
        {/* Learning Mode Toggle */}
        {!learningMode && (
          <button
            onClick={toggleLearningMode}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          >
            🎯 Enable Learning Mode
          </button>
        )}
        {learningMode && (
          <button
            onClick={toggleLearningMode}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50"
          >
            ❌ Disable Learning Mode
          </button>
        )}
      </div>

      {/* Floating "Show Paginated View" Button */}
      {showAllData && (
        <button
          onClick={toggleView}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-orange-500/50 font-bold text-sm transition-all duration-300 hover:scale-110 z-50 animate-bounce"
        >
          📄 Show Paginated View
        </button>
      )}
      {userLoggedIn &&
        (userInfo.role === "super_admin" || userInfo.role === "admin") && (
          <button
            onClick={() => setAction(!showAction)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50 hidden md:block"
          >
            {showAction ? "🔒 Hide Actions" : "⚙️ Show Actions"}
          </button>
        )}
      {/* Pagination Buttons */}
      <div className="flex justify-between md:justify-end items-center gap-4 w-full md:w-auto">
        {userLoggedIn && userInfo.role === "super_admin" && (
          <button
            onClick={() => setAction(!showAction)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-4 py-2 rounded-full font-semibold text-white text-sm transition-all duration-300 hover:scale-105 shadow-lg block md:hidden"
          >
            {showAction ? "🔒" : "⚙️"}
          </button>
        )}
        <p className="text-lg text-info font-bold whitespace-nowrap md:ml-2 block md:hidden">
          {totalWords} words
        </p>
        <div>
          {!showAllData && (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  setTimeout(() => {
                    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
                  }, 300);
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-semibold text-white text-sm transition-all duration-300 hover:scale-105 shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-full text-white font-semibold text-sm backdrop-blur-sm">
                <span className="hidden sm:inline">Page </span>
                {currentPage}
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden">/</span>
                {totalPages}
              </span>
              <button
                onClick={() => {
                  setTimeout(() => {
                    setCurrentPage((prevPage) =>
                      Math.min(prevPage + 1, totalPages)
                    );
                  }, 300);
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full font-semibold text-white text-sm transition-all duration-300 hover:scale-105 shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
