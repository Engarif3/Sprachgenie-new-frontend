import { useState, useRef, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";

/**
 * PartOfSpeechDropdown - Custom dropdown replacing the native select
 * Shows all parts of speech with verb sub-filters appearing on hover
 */
const PartOfSpeechDropdown = ({
  selectedPartOfSpeech,
  selectedVerbFilter,
  onSelectPartOfSpeech,
  onSelectVerbFilter,
  partOfSpeechOptions,
  notSpecifiedValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerbHovered, setIsVerbHovered] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState("right");
  const dropdownRef = useRef(null);
  const verbSubmenuRef = useRef(null);
  const verbItemRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Calculate submenu position to prevent overflow
  useEffect(() => {
    if (isVerbHovered && verbItemRef.current) {
      const rect = verbItemRef.current.getBoundingClientRect();
      const submenuWidth = 288; // 72 * 4 (w-72 in Tailwind)
      const spaceOnRight = window.innerWidth - rect.right;

      // If not enough space on right, show on left
      if (spaceOnRight < submenuWidth + 20) {
        setSubmenuPosition("left");
      } else {
        setSubmenuPosition("right");
      }
    }
  }, [isVerbHovered]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!verbSubmenuRef.current ||
          !verbSubmenuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setIsVerbHovered(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (value) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (value === "verb") {
      onSelectPartOfSpeech("verb");
      onSelectVerbFilter(""); // Clear verb filter when selecting "All Verbs"
    } else {
      onSelectPartOfSpeech(value);
      onSelectVerbFilter(""); // Clear verb filter for non-verb selections
    }
    setIsOpen(false);
    setIsVerbHovered(false);
  };

  const handleVerbFilterSelect = (filter) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    onSelectPartOfSpeech("verb");
    onSelectVerbFilter(filter);
    setIsOpen(false);
    setIsVerbHovered(false);
  };

  const verbSubFilters = [
    {
      value: "modal",
      label: "Modal Verbs",
      description: "können, müssen, wollen",
      color: "text-indigo-400",
    },
    {
      value: "separable",
      label: "Separable Verbs",
      description: "aufstehen, ankommen",
      color: "text-blue-400",
    },
    {
      value: "reflexive",
      label: "Reflexive Verbs",
      description: "sich waschen, sich freuen",
      color: "text-purple-400",
    },
    {
      value: "dative",
      label: "Dative Case",
      description: "Verbs requiring Dativ",
      color: "text-green-400",
    },
    {
      value: "genitive",
      label: "Genitive Case",
      description: "Verbs requiring Genitiv",
      color: "text-orange-400",
    },
    {
      value: "prepositional",
      label: "Prepositional Verbs",
      description: "denken an, warten auf",
      color: "text-pink-400",
    },
  ];

  const getDisplayLabel = () => {
    if (!selectedPartOfSpeech) return "All Types";

    if (selectedPartOfSpeech === "verb" && selectedVerbFilter) {
      const filter = verbSubFilters.find((f) => f.value === selectedVerbFilter);
      return filter ? filter.label : "Verb";
    }

    if (selectedPartOfSpeech === notSpecifiedValue) {
      return "Not specified";
    }

    const option = partOfSpeechOptions.find(
      (opt) => opt.value === selectedPartOfSpeech,
    );
    return option ? option.label : selectedPartOfSpeech;
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-600 dark:bg-gray-800 backdrop-blur-sm rounded-xl px-4 py-3 w-full dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all text-left flex items-center justify-between"
        aria-label="Filter words by part of speech"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <IoChevronDown
          className={`ml-2 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={18}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 z-50 animate-slideDown"
          role="menu"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-visible backdrop-blur-xl">
            {/* All Types Option */}
            <button
              onClick={() => handleSelect("")}
              className={`
                w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                hover:bg-cyan-500/10 border-b border-gray-700/30
                ${!selectedPartOfSpeech ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300"}
              `}
              role="menuitem"
            >
              All Types
            </button>

            {/* Part of Speech Options */}
            {partOfSpeechOptions.map((option) => {
              const isVerb = option.value === "verb";
              const isSelected =
                selectedPartOfSpeech === option.value && !selectedVerbFilter;

              return (
                <div
                  key={option.value}
                  ref={isVerb ? verbItemRef : null}
                  className="relative"
                  onMouseEnter={() => {
                    if (isVerb) {
                      // Clear any pending timeout
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                      setIsVerbHovered(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isVerb) {
                      // Delay hiding to give time to reach submenu
                      hoverTimeoutRef.current = setTimeout(() => {
                        setIsVerbHovered(false);
                      }, 300);
                    }
                  }}
                >
                  <button
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                      hover:bg-cyan-500/10 border-b border-gray-700/30
                      ${isSelected ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300"}
                      ${isVerb ? "flex items-center justify-between" : ""}
                    `}
                    role="menuitem"
                  >
                    <span>{option.label}</span>
                    {isVerb && <span className="text-xs text-gray-500">›</span>}
                  </button>

                  {/* Verb Submenu - appears on the right or left based on available space */}
                  {isVerb && isVerbHovered && (
                    <div
                      ref={verbSubmenuRef}
                      onMouseEnter={() => {
                        // Clear the timeout - keep submenu open
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setIsVerbHovered(true);
                      }}
                      onMouseLeave={() => {
                        setIsVerbHovered(false);
                      }}
                      className={`absolute top-0 w-72 z-[100] ${
                        submenuPosition === "right"
                          ? "left-full ml-2 animate-slideRight"
                          : "right-full mr-2 animate-slideLeft"
                      }`}
                    >
                      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {verbSubFilters.map((filter) => (
                            <button
                              key={filter.value}
                              onClick={() =>
                                handleVerbFilterSelect(filter.value)
                              }
                              className={`
                                w-full px-4 py-3 text-left transition-all duration-150
                                hover:bg-gray-800 border-b border-gray-800/30 last:border-b-0
                                ${
                                  selectedVerbFilter === filter.value
                                    ? `bg-gray-800/50 ${filter.color}`
                                    : "text-gray-300"
                                }
                              `}
                              role="menuitem"
                            >
                              <div
                                className={`font-semibold text-sm ${
                                  selectedVerbFilter === filter.value
                                    ? filter.color
                                    : ""
                                }`}
                              >
                                {filter.label}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {filter.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Not Specified Option */}
            <button
              onClick={() => handleSelect(notSpecifiedValue)}
              className={`
                w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                hover:bg-cyan-500/10
                ${selectedPartOfSpeech === notSpecifiedValue ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300"}
              `}
              role="menuitem"
            >
              Not specified
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartOfSpeechDropdown;
