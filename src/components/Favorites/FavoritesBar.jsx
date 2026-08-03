import { Heart, Trash2 } from "lucide-react";

// Toggle pill for filtering a title-list page down to just the signed-in
// user's favorites, plus a "Delete All" trigger that only appears once
// there's something to delete.
const FavoritesBar = ({
  isLight,
  active,
  onToggle,
  count,
  onRequestDeleteAll,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
          active
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
            : isLight
              ? "border border-pink-200 bg-white text-slate-600 hover:border-pink-300"
              : "border border-pink-800/50 bg-slate-900 text-slate-300 hover:border-pink-500/50"
        }`}
      >
        <Heart size={16} fill={active ? "currentColor" : "none"} />
        {active ? `Showing Favorites (${count})` : "Show Favorites Only"}
      </button>

      {count > 0 && (
        <button
          type="button"
          onClick={onRequestDeleteAll}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
            isLight
              ? "border-rose-200 bg-white text-rose-600 hover:border-rose-400 hover:bg-rose-50"
              : "border-rose-800/60 bg-slate-900 text-rose-400 hover:border-rose-500/60"
          }`}
        >
          <Trash2 size={14} /> Delete All
        </button>
      )}
    </div>
  );
};

export default FavoritesBar;
