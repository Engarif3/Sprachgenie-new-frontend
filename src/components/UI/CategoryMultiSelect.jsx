import { useEffect, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

// A button that opens a checkbox panel to pick several items at once —
// used for conversation categories, where a single native <select> can't
// express "belongs to more than one" without an awkward Ctrl/Cmd-click
// multi-select listbox.
const CategoryMultiSelect = ({
  categories,
  selectedIds,
  onChange,
  placeholder = "Select categories",
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleCategory = (categoryId) => {
    const nextIds = selectedIds.includes(categoryId)
      ? selectedIds.filter((id) => id !== categoryId)
      : [...selectedIds, categoryId];
    onChange(nextIds);
  };

  const selectedNames = categories
    .filter((category) => selectedIds.includes(category.id))
    .map((category) => category.name);

  const summaryLabel =
    selectedNames.length === 0
      ? placeholder
      : selectedNames.length === 1
        ? selectedNames[0]
        : `${selectedNames.length} categories selected`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-md border p-2 text-left shadow-sm transition-colors ${
          selectedNames.length === 0
            ? "text-slate-400 dark:text-gray-500"
            : "text-slate-900 dark:text-white"
        } border-slate-300 bg-white hover:border-sky-400 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900/60 dark:hover:border-sky-500`}
      >
        <span className="truncate">{summaryLabel}</span>
        <HiChevronDown
          size={18}
          className={`ml-2 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-300 bg-white p-1 shadow-lg dark:border-gray-600 dark:bg-gray-900">
          {categories.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-slate-500 dark:text-gray-400">
              No categories available
            </p>
          ) : (
            categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                {category.name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryMultiSelect;
