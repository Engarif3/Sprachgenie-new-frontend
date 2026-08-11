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
          <div className="flex gap-1.5 md:gap-2 justify-center items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
              aria-label="First page"
            >
              <HiChevronDoubleLeft size={19} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
              }
              disabled={currentPage === 1}
              title="Previous page"
              aria-label="Previous page"
            >
              <HiChevronLeft size={21} />
            </Button>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-full text-white font-thin md:font-semibold lg:font-semibold text-sm md:text-md lg:text-md backdrop-blur-sm">
              <span className="hidden sm:inline">Page </span>
              {currentPage}
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage((prevPage) =>
                  Math.min(prevPage + 1, totalPages),
                )
              }
              disabled={currentPage === totalPages}
              title="Next page"
              aria-label="Next page"
            >
              <HiChevronRight size={21} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
              aria-label="Last page"
            >
              <HiChevronDoubleRight size={19} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
