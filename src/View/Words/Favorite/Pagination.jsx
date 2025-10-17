// const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
//   return (
//     <div className="">
//       {totalPages > 1 && (
//         <div className="flex justify-center items-center gap-1 md:gap-2 lg:gap-2 mt-4">
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//             disabled={currentPage === 1}
//             className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
//           >
//             Prev
//           </button>
//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//             <button
//               key={page}
//               onClick={() => setCurrentPage(page)}
//               className={`px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 rounded transition-colors ${
//                 currentPage === page
//                   ? "bg-cyan-600 text-white hover:bg-cyan-700"
//                   : "bg-gray-200 hover:bg-gray-300"
//               }`}
//             >
//               {page}
//             </button>
//           ))}
//           <button
//             onClick={() =>
//               setCurrentPage((prev) => Math.min(totalPages, prev + 1))
//             }
//             disabled={currentPage === totalPages}
//             className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Pagination;

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
        <div className="flex justify-center items-center gap-1 md:gap-2 lg:gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-orange-400 rounded disabled:opacity-50 hover:bg-orange-500 transition-colors"
          >
            Prev
          </button>

          {/* Render Page Buttons and Ellipses */}
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-10 flex items-center justify-center px-2 py-1 md:py-2 lg:py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 flex items-center justify-center py-1 md:py-2 lg:py-2 rounded transition-colors ${
                  currentPage === page
                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                    : "bg-gray-200 hover:bg-gray-300"
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
            className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-orange-400 rounded disabled:opacity-50 hover:bg-orange-500 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </Container>
  );
};

export default Pagination;
