import { useState } from "react";

// Same "type ok to confirm" pattern as the word-favorites delete-all modal,
// rebuilt theme-aware (light/dark) for reuse on the conversation/story
// title-list pages.
const FavoritesDeleteAllModal = ({
  isOpen,
  isLight,
  itemLabel,
  onCancel,
  onConfirm,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const canConfirm = inputValue.trim().toLowerCase() === "ok";

  const handleConfirm = async () => {
    if (!canConfirm || isDeleting) return;
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
          isLight ? "border-rose-200 bg-white" : "border-rose-800/60 bg-slate-900"
        }`}
      >
        <h3
          className={`text-xl font-bold ${isLight ? "text-rose-600" : "text-rose-400"}`}
        >
          ⚠️ Delete all favorite {itemLabel}?
        </h3>
        <p
          className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
        >
          This removes every favorited {itemLabel} from your list. This
          action cannot be undone.
        </p>

        <label
          htmlFor="favorites-delete-all-confirm"
          className={`mt-4 block text-xs font-semibold uppercase tracking-wide ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Type "ok" to confirm
        </label>
        <input
          id="favorites-delete-all-confirm"
          type="text"
          autoFocus
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleConfirm();
          }}
          placeholder="ok"
          className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 ${
            isLight
              ? "border-slate-300 bg-white text-slate-900"
              : "border-slate-700 bg-slate-800 text-white"
          }`}
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              isLight
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritesDeleteAllModal;
