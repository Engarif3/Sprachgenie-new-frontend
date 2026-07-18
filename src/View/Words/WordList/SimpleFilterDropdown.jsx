import { useState, useRef, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";

// Shares the trigger/panel visual language with PartOfSpeechDropdown ("All
// Types") so the three filter dropdowns look consistent. Level/Topic used
// to be native <select> elements, which fall back to the browser's own
// unstyled dropdown list when opened — this replaces that with a themed
// floating panel to match.
const SimpleFilterDropdown = ({
  id,
  ariaLabel,
  placeholder,
  displayLabel,
  selectedValue,
  onSelect,
  items,
  focusBorderClass = "focus:border-cyan-500",
  focusRingClass = "focus:ring-cyan-500/50",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        className={`border border-gray-600 dark:bg-gray-800 backdrop-blur-sm rounded-xl px-4 py-3 w-full dark:text-white ${focusBorderClass} focus:ring-2 ${focusRingClass} transition-all text-left flex items-center justify-between`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate">{displayLabel}</span>
        <IoChevronDown
          className={`ml-2 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={18}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 z-50 animate-slideDown"
          role="menu"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`w-full px-4 py-2.5 text-left text-base transition-colors duration-150 hover:bg-cyan-500/20 border-b border-gray-700/30 ${
                  !selectedValue
                    ? "bg-cyan-500/20 text-cyan-400 font-semibold"
                    : "text-gray-300"
                }`}
                role="menuitem"
              >
                {placeholder}
              </button>

              {items.map((entry, index) =>
                entry.type === "separator" ? (
                  <div
                    key={`separator-${index}`}
                    className="border-t border-gray-700/60 my-1"
                    role="separator"
                  />
                ) : (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => handleSelect(entry.value)}
                    className={`w-full px-4 py-2.5 text-left text-base transition-colors duration-150 hover:bg-cyan-500/20 border-b border-gray-700/30 last:border-b-0 ${
                      selectedValue === entry.value
                        ? "bg-cyan-500/20 text-cyan-400 font-semibold"
                        : "text-gray-300"
                    }`}
                    role="menuitem"
                  >
                    {entry.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleFilterDropdown;
