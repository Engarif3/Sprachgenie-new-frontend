import {
  HiChevronDoubleLeft,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleRight,
} from "react-icons/hi2";
import { useAuth } from "../services/auth.services";
import Button from "../components/UI/Button";
import { IoLockClosedOutline, IoSettingsOutline } from "react-icons/io5";

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
          <Button variant="primary" onClick={toggleLearningMode}>
            Enable Learning Mode
          </Button>
        )}
        <div className="flex gap-3 items-center">
          {learningMode && (
            <Button variant="secondary" onClick={toggleLearningMode}>
              Disable Learning Mode
            </Button>
          )}
        </div>

        {userLoggedIn && isAdmin && (
          <Button variant="secondary" onClick={() => setAction(!showAction)}>
            <span className="inline-flex items-center gap-1.5">
              {showAction ? (
                <IoLockClosedOutline size={14} aria-hidden="true" />
              ) : (
                <IoSettingsOutline size={14} aria-hidden="true" />
              )}
              {showAction ? "Hide Actions" : "Show Actions"}
            </span>
          </Button>
        )}
      </div>
      {/* Pagination Buttons */}
      <div className="flex justify-between md:justify-end items-center gap-4 w-full md:w-auto">
        <div className="w-full">
          <div className="flex gap-1 md:gap-1.5 justify-center items-center">
            {/* Bordered icon buttons instead of Button's `ghost` variant —
            ghost has no border or background at all (kept plain on purpose
            for the app's everyday buttons), which made these arrows nearly
            invisible in both themes. Plain buttons here, not Button, since
            Button's variant system doesn't have a bordered-ghost option. */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
              aria-label="First page"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400 transition-all duration-200 hover:scale-105 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300 dark:disabled:border-slate-700 dark:disabled:text-slate-600 disabled:hover:scale-100 disabled:hover:bg-transparent"
            >
              <HiChevronDoubleLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
              }
              disabled={currentPage === 1}
              title="Previous page"
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400 transition-all duration-200 hover:scale-105 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300 dark:disabled:border-slate-700 dark:disabled:text-slate-600 disabled:hover:scale-100 disabled:hover:bg-transparent"
            >
              <HiChevronLeft size={19} />
            </button>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-full text-white font-thin md:font-semibold lg:font-semibold text-sm md:text-md lg:text-md backdrop-blur-sm">
              <span className="hidden sm:inline">Page </span>
              {currentPage}
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prevPage) =>
                  Math.min(prevPage + 1, totalPages),
                )
              }
              disabled={currentPage === totalPages}
              title="Next page"
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400 transition-all duration-200 hover:scale-105 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300 dark:disabled:border-slate-700 dark:disabled:text-slate-600 disabled:hover:scale-100 disabled:hover:bg-transparent"
            >
              <HiChevronRight size={19} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
              aria-label="Last page"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400 transition-all duration-200 hover:scale-105 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300 dark:disabled:border-slate-700 dark:disabled:text-slate-600 disabled:hover:scale-100 disabled:hover:bg-transparent"
            >
              <HiChevronDoubleRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
