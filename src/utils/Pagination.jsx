import { getUserInfo, isLoggedIn } from "../services/auth.services";

const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  showAllData,
  toggleView,
  debounceTimeout,
  setDebounceTimeout,
  toggleLearningMode,
  learningMode,
  totalWords,
  setAction,
  showAction,
}) => {
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 ">
      {/* Left Side Controls */}
      <div className="flex flex-wrap gap-4 justify-between md:justify-start w-full md:w-auto  ">
        {/* Show All Button */}
        {!showAllData && (
          <button
            onClick={toggleView}
            className="btn btn-sm btn-outline btn-info my-2 md:mt-6"
          >
            Show All Words
          </button>
        )}

        {showAllData && (
          <button
            onClick={toggleView}
            className="btn btn-sm btn-outline btn-info my-2 md:mt-6"
          >
            Show Paginated View
          </button>
        )}

        {/* Learning Mode Toggle */}
        {!learningMode && (
          <button
            onClick={toggleLearningMode}
            className="btn btn-sm btn-outline btn-info my-2 md:mt-6"
          >
            Enable Learning Mode
          </button>
        )}
        {learningMode && (
          <button
            onClick={toggleLearningMode}
            className="btn btn-sm btn-outline btn-info my-2 md:mt-6"
          >
            Disable Learning Mode
          </button>
        )}
      </div>

      {/* Floating "Show Paginated View" Button */}
      {showAllData && (
        <button
          onClick={toggleView}
          // className="md:hidden btn btn-sm btn-warning fixed bottom-8 left-1/2 -translate-x-1/2 shadow-lg"
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Show Paginated View
        </button>
      )}
      {userLoggedIn && userInfo.role === "super_admin" && (
        <button
          onClick={() => setAction(!showAction)}
          className="bg-blue-500 text-white px-2 py-1 my-2 md:mt-6 rounded-lg hidden md:block"
        >
          {showAction ? "Hide Actions" : "Show Actions"}
        </button>
      )}
      {/* Pagination Buttons */}
      <div className="flex justify-between md:justify-end  my-2  w-full md:w-auto">
        {userLoggedIn && userInfo.role === "super_admin" && (
          <button
            onClick={() => setAction(!showAction)}
            className="bg-blue-500 text-white px-2 py-1 rounded-lg block md:hidden"
          >
            {showAction ? "Hide Actions" : "Show Actions"}
          </button>
        )}
        <p className="text-lg text-info font-bold whitespace-nowrap md:ml-2 block md:hidden">
          {totalWords} words
        </p>
        <div>
          {!showAllData && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  // if (debounceTimeout) clearTimeout(debounceTimeout);
                  // setDebounceTimeout(
                  setTimeout(() => {
                    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
                  }, 300);
                  // );
                }}
                disabled={currentPage === 1}
                className="btn btn-sm btn-accent"
              >
                Prev
              </button>
              <span className="text-sm md:text-lg">
                <span className="hidden sm:inline">page </span>
                {currentPage}
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden">/</span>
                {totalPages}
              </span>
              <button
                onClick={() => {
                  // if (debounceTimeout) clearTimeout(debounceTimeout);
                  // setDebounceTimeout(
                  setTimeout(() => {
                    setCurrentPage((prevPage) =>
                      Math.min(prevPage + 1, totalPages)
                    );
                  }, 300);
                  // );
                }}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-accent"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
