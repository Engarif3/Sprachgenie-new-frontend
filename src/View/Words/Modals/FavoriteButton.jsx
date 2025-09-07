const FavoriteButton = ({
  isFavorite,
  loading = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`p-1 rounded-full hover:opacity-80 transition-opacity  ${className}`}
      title="Toggle Favorite"
    >
      {loading ? (
        <svg className="w-6 h-6 animate-spin text-gray-400" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : isFavorite ? (
        // Filled Heart
        <svg className="w-6 h-6" viewBox="0 0 122.88 107.39">
          <path
            style={{ fill: "#ed1b24", fillRule: "evenodd" }}
            d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
          />
        </svg>
      ) : (
        // Outline Heart
        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 122.88 107.39">
          <path
            style={{
              fill: "transparent",
              stroke: "currentColor",
              strokeWidth: "3",
              fillRule: "evenodd",
            }}
            d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
          />
        </svg>
      )}
    </button>
  );
};

export default FavoriteButton;
