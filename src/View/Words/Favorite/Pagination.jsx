const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="">
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 md:gap-2 lg:gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 rounded transition-colors ${
                currentPage === page
                  ? "bg-cyan-600 text-white hover:bg-cyan-700"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
