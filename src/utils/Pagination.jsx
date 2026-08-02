import {
  HiChevronDoubleLeft,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleRight,
} from "react-icons/hi2";
import { useAuth } from "../services/auth.services";

// One shared style for every nav button so First/Prev/Next/Last are the
// same fixed-size icon buttons that never appear/disappear or change
// color — only their disabled state changes at the boundaries. Distinct
// bright colors + buttons popping in/out of the row (the previous design)
// is what made "Last" easy to mis-click for "Next": the row's contents
// shifted position as pages changed instead of staying put.
const navButtonClass =
  "flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-gray-700 text-white transition-all duration-150 hover:bg-gray-600 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-gray-700";

const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  toggleLearningMode,
  learningMode,
  setAction,
  showAction,
}) => {
  const { isAdmin, isLoggedIn: userLoggedIn } = useAuth();

  return (
    // <div className="flex flex-col md:flex-row lg:flex-row justify-between items-center gap-4 md:gap-8 mb-2 mt-6">
    <div
      className={`flex ${
        isAdmin
          ? "flex-col md:flex-row lg:flex-row"
          : "flex-row md:flex-row lg:flex-row"
      } justify-between items-center gap-1 md:gap-8 mb-2 mt-6`}
    >
      {/* Left Side Controls */}
      <div className="flex gap-1 justify-between md:justify-start w-full md:w-auto ">
        {/* Learning Mode Toggle */}
        {!learningMode && (
          <button
            onClick={toggleLearningMode}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-2 md:px-6 lg:px-6 py-2 rounded-full text-xs md:text-md lg:text-md font-light md:font-semibold lg:font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/50 ml-2 md:ml-6"
          >
            Enable Learning Mode
          </button>
        )}
        <div className="flex gap-3 items-center">
          {learningMode && (
            <button
              onClick={toggleLearningMode}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-2 md:px-6 lg:px-6 py-2 rounded-full text-xs md:text-md lg:text-md font-light md:font-semibold lg:font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50 ml-2 md:ml-6"
            >
              Disable Learning Mode
            </button>
          )}
        </div>

        {userLoggedIn && isAdmin && (
          <button
            onClick={() => setAction(!showAction)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-2 md:px-6 lg:px-6 py-2 rounded-full text-sm md:text-md lg:text-md font-light md:font-semibold lg:font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50 mr-2 "
          >
            {showAction ? "🔒 Hide Actions" : "⚙️ Show Actions"}
          </button>
        )}
      </div>
      {/* Pagination Buttons */}
      <div className="flex justify-between md:justify-end items-center gap-4 w-full md:w-auto">
        <div className="w-full">
          <div className="flex gap-1.5 md:gap-2 justify-center items-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={navButtonClass}
              title="First page"
              aria-label="First page"
            >
              <HiChevronDoubleLeft size={19} className="text-cyan-300" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
              }
              disabled={currentPage === 1}
              className={navButtonClass}
              title="Previous page"
              aria-label="Previous page"
            >
              <HiChevronLeft size={21} className="text-cyan-300" />
            </button>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-full text-white font-thin md:font-semibold lg:font-semibold text-sm md:text-md lg:text-md backdrop-blur-sm">
              <span className="hidden sm:inline">Page </span>
              {currentPage}
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prevPage) =>
                  Math.min(prevPage + 1, totalPages),
                )
              }
              disabled={currentPage === totalPages}
              className={navButtonClass}
              title="Next page"
              aria-label="Next page"
            >
              <HiChevronRight size={21} className="text-cyan-300" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={navButtonClass}
              title="Last page"
              aria-label="Last page"
            >
              <HiChevronDoubleRight size={19} className="text-cyan-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
