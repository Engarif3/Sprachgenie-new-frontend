import Container from "../../../utils/Container";
import Button from "../../../components/UI/Button";

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

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
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {formatPageNumber(page)}
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Pagination;
