const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null; // hide pagination if only 1 page

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  return (
    <div className="flex justify-center mt-6 gap-2">
      <button
        onClick={handlePrev}
        disabled={page === 1}
        className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-400 transition"
      >
        Previous
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`px-3 py-1 rounded ${
            page === num
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-400 transition"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
