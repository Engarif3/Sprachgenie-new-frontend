import Container from "../../../utils/Container";

const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  const MAX_CORE_WINDOW = 5;

  const formatPageNumber = (page) => {
    return page.toString().padStart(2, "0");
  };

  const getVisiblePageNumbers = () => {
    if (totalPages <= MAX_CORE_WINDOW + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const halfWindow = Math.floor(MAX_CORE_WINDOW / 2);

    let start = Math.max(2, currentPage - halfWindow);
    let end = Math.min(totalPages - 1, currentPage + halfWindow);

    if (currentPage <= halfWindow + 1) {
      start = 2;
      end = MAX_CORE_WINDOW + 1;
    } else if (currentPage >= totalPages - halfWindow) {
      start = totalPages - MAX_CORE_WINDOW;
      end = totalPages - 1;
    }

    pages.push(1);

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (end < totalPages - 1) {
      pages.push("...");
    }

    if (pages[pages.length - 1] !== totalPages) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePageNumbers();

  return (
    <Container>
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 md:gap-3 my-4 md:my-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-2.5 md:text-base rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/50"
          >
            Prev
          </button>

          {/* Render Page Buttons and Ellipses */}
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-1 sm:w-8 md:w-10 flex items-center justify-center px-1 sm:px-2 py-1 sm:py-2 text-gray-400 text-base sm:text-lg md:text-xl font-bold"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] h-6 sm:min-w-[36px] sm:h-9 md:min-w-[40px] md:h-10 flex items-center justify-center px-1 py-1 sm:px-3 sm:py-2 rounded-full font-bold text-xs sm:text-sm md:text-base transition-all duration-300 shadow-md ${
                  currentPage === page
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110 shadow-lg shadow-purple-500/50"
                    : "bg-gray-800/60 border-2 border-gray-700/50 text-gray-300 hover:bg-gray-700/80 hover:scale-105 hover:border-gray-600"
                }`}
              >
                {formatPageNumber(page)}
              </button>
            );
          })}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-2.5 md:text-base rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-cyan-500/50"
          >
            Next
          </button>
        </div>
      )}
    </Container>
  );
};

export default Pagination;
