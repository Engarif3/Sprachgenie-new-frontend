import { useState, useRef, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";

/**
 * PartOfSpeechDropdown - Custom dropdown replacing the native select
 * Shows all parts of speech with verb and preposition sub-filters appearing on hover
 */
const PartOfSpeechDropdown = ({
  selectedPartOfSpeech,
  selectedVerbFilter,
  selectedPrepositionFilter,
  onSelectPartOfSpeech,
  onSelectVerbFilter,
  onSelectPrepositionFilter,
  partOfSpeechOptions,
  notSpecifiedValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerbHovered, setIsVerbHovered] = useState(false);
  const [isPrepositionHovered, setIsPrepositionHovered] = useState(false);
  const [showVerbSubmenu, setShowVerbSubmenu] = useState(false);
  const [showPrepositionSubmenu, setShowPrepositionSubmenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [submenuPosition, setSubmenuPosition] = useState("right");
  const dropdownRef = useRef(null);
  const verbSubmenuRef = useRef(null);
  const prepositionSubmenuRef = useRef(null);
  const verbItemRef = useRef(null);
  const prepositionItemRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Detect mobile device on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate submenu position to prevent overflow
  useEffect(() => {
    const shouldShowVerbSubmenu = isMobile ? showVerbSubmenu : isVerbHovered;
    const shouldShowPrepositionSubmenu = isMobile
      ? showPrepositionSubmenu
      : isPrepositionHovered;

    if (shouldShowVerbSubmenu && verbItemRef.current) {
      if (isMobile) {
        setSubmenuPosition("below");
      } else {
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
    }

    if (shouldShowPrepositionSubmenu && prepositionItemRef.current) {
      if (isMobile) {
        setSubmenuPosition("below");
      } else {
        const rect = prepositionItemRef.current.getBoundingClientRect();
        const submenuWidth = 288; // 72 * 4 (w-72 in Tailwind)
        const spaceOnRight = window.innerWidth - rect.right;

        // If not enough space on right, show on left
        if (spaceOnRight < submenuWidth + 20) {
          setSubmenuPosition("left");
        } else {
          setSubmenuPosition("right");
        }
      }
    }
  }, [
    isVerbHovered,
    isPrepositionHovered,
    showVerbSubmenu,
    showPrepositionSubmenu,
    isMobile,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!verbSubmenuRef.current ||
          !verbSubmenuRef.current.contains(event.target)) &&
        (!prepositionSubmenuRef.current ||
          !prepositionSubmenuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setIsVerbHovered(false);
        setIsPrepositionHovered(false);
        setShowVerbSubmenu(false);
        setShowPrepositionSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (value, forceSelect = false) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // On mobile, clicking verb or preposition from main menu should toggle submenu
    // But if forceSelect is true (clicked from submenu), proceed with selection
    if (isMobile && !forceSelect) {
      if (value === "verb") {
        setShowVerbSubmenu(!showVerbSubmenu);
        setShowPrepositionSubmenu(false);
        return; // Don't close dropdown, don't select
      } else if (value === "preposition") {
        setShowPrepositionSubmenu(!showPrepositionSubmenu);
        setShowVerbSubmenu(false);
        return; // Don't close dropdown, don't select
      }
    }

    // Desktop behavior or non-verb/preposition selections or forced selections
    if (value === "verb") {
      onSelectPartOfSpeech("verb");
      onSelectVerbFilter(""); // Clear verb filter when selecting "All Verbs"
      onSelectPrepositionFilter(""); // Clear preposition filter
    } else if (value === "preposition") {
      onSelectPartOfSpeech("preposition");
      onSelectVerbFilter(""); // Clear verb filter
      onSelectPrepositionFilter(""); // Clear preposition filter when selecting "All Prepositions"
    } else {
      onSelectPartOfSpeech(value);
      onSelectVerbFilter(""); // Clear verb filter for non-verb selections
      onSelectPrepositionFilter(""); // Clear preposition filter for non-preposition selections
    }
    setIsOpen(false);
    setIsVerbHovered(false);
    setIsPrepositionHovered(false);
    setShowVerbSubmenu(false);
    setShowPrepositionSubmenu(false);
  };

  const handleVerbFilterSelect = (filter) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    onSelectPartOfSpeech("verb");
    onSelectVerbFilter(filter);
    onSelectPrepositionFilter(""); // Clear preposition filter
    setIsOpen(false);
    setIsVerbHovered(false);
    setIsPrepositionHovered(false);
    setShowVerbSubmenu(false);
    setShowPrepositionSubmenu(false);
  };

  const handlePrepositionFilterSelect = (filter) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    onSelectPartOfSpeech("preposition");
    onSelectVerbFilter(""); // Clear verb filter
    onSelectPrepositionFilter(filter);
    setIsOpen(false);
    setIsVerbHovered(false);
    setIsPrepositionHovered(false);
    setShowVerbSubmenu(false);
    setShowPrepositionSubmenu(false);
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
      description: "danken dir, helfen mir",
      color: "text-green-400",
    },
    {
      value: "prepositional",
      label: "Prepositional Verbs",
      description: "denken an, warten auf",
      color: "text-pink-400",
    },
  ];

  const prepositionSubFilters = [
    {
      value: "accusative",
      label: "Accusative",
      description: "durch, für, gegen, ohne",
      color: "text-red-400",
    },
    {
      value: "dative",
      label: "Dative",
      description: "aus, bei, mit, nach",
      color: "text-green-400",
    },
    {
      value: "genitive",
      label: "Genitive",
      description: "während, wegen, trotz",
      color: "text-yellow-400",
    },
    {
      value: "wechsel",
      label: "Wechsel (Two-way)",
      description: "an, auf, in, über",
      color: "text-blue-400",
    },
  ];

  const getDisplayLabel = () => {
    if (!selectedPartOfSpeech) return "All Types";

    if (selectedPartOfSpeech === "verb" && selectedVerbFilter) {
      const filter = verbSubFilters.find((f) => f.value === selectedVerbFilter);
      return filter ? filter.label : "Verb";
    }

    if (selectedPartOfSpeech === "preposition" && selectedPrepositionFilter) {
      const filter = prepositionSubFilters.find(
        (f) => f.value === selectedPrepositionFilter,
      );
      return filter ? filter.label : "Preposition";
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
        id="part-of-speech-select"
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
              const isPreposition = option.value === "preposition";
              const isSelected =
                selectedPartOfSpeech === option.value &&
                !selectedVerbFilter &&
                !selectedPrepositionFilter;

              return (
                <div
                  key={option.value}
                  ref={
                    isVerb
                      ? verbItemRef
                      : isPreposition
                        ? prepositionItemRef
                        : null
                  }
                  className="relative"
                  onMouseEnter={() => {
                    // Only handle hover on desktop
                    if (isMobile) return;

                    if (isVerb) {
                      // Clear any pending timeout
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                      setIsVerbHovered(true);
                    } else if (isPreposition) {
                      // Clear any pending timeout
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                      setIsPrepositionHovered(true);
                    }
                  }}
                  onMouseLeave={() => {
                    // Only handle hover on desktop
                    if (isMobile) return;

                    if (isVerb) {
                      // Delay hiding to give time to reach submenu
                      hoverTimeoutRef.current = setTimeout(() => {
                        setIsVerbHovered(false);
                      }, 300);
                    } else if (isPreposition) {
                      // Delay hiding to give time to reach submenu
                      hoverTimeoutRef.current = setTimeout(() => {
                        setIsPrepositionHovered(false);
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
                      ${isVerb || isPreposition ? "flex items-center justify-between" : ""}
                    `}
                    role="menuitem"
                  >
                    <span>{option.label}</span>
                    {(isVerb || isPreposition) && (
                      <IoChevronDown
                        className={`text-gray-500 transition-transform duration-200 ${
                          isMobile
                            ? isVerb && showVerbSubmenu
                              ? "rotate-180"
                              : isPreposition && showPrepositionSubmenu
                                ? "rotate-180"
                                : ""
                            : "rotate-[-90deg]"
                        }`}
                        size={14}
                      />
                    )}
                  </button>

                  {/* Verb Submenu - appears below on mobile, right/left on desktop */}
                  {isVerb && (isMobile ? showVerbSubmenu : isVerbHovered) && (
                    <div
                      ref={verbSubmenuRef}
                      onMouseEnter={() => {
                        // Only handle hover on desktop
                        if (isMobile) return;
                        // Clear the timeout - keep submenu open
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setIsVerbHovered(true);
                      }}
                      onMouseLeave={() => {
                        // Only handle hover on desktop
                        if (isMobile) return;
                        setIsVerbHovered(false);
                      }}
                      className={`absolute z-[100] ${
                        submenuPosition === "below"
                          ? "top-full left-0 right-0 mt-1 w-full animate-slideDown"
                          : submenuPosition === "right"
                            ? "top-0 left-full ml-2 w-72 animate-slideRight"
                            : "top-0 right-full mr-2 w-72 animate-slideLeft"
                      }`}
                    >
                      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {/* All Verbs Option */}
                          <button
                            onClick={() => handleSelect("verb", true)}
                            className={`
                              w-full px-4 py-3 text-left transition-all duration-150
                              hover:bg-gray-800 border-b border-gray-800/30
                              ${
                                selectedPartOfSpeech === "verb" &&
                                !selectedVerbFilter
                                  ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                  : "text-gray-300"
                              }
                            `}
                            role="menuitem"
                          >
                            <div className="font-semibold text-sm">
                              All Verbs
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Show all verb types
                            </div>
                          </button>
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

                  {/* Preposition Submenu - appears below on mobile, right/left on desktop */}
                  {isPreposition &&
                    (isMobile
                      ? showPrepositionSubmenu
                      : isPrepositionHovered) && (
                      <div
                        ref={prepositionSubmenuRef}
                        onMouseEnter={() => {
                          // Only handle hover on desktop
                          if (isMobile) return;
                          // Clear the timeout - keep submenu open
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          setIsPrepositionHovered(true);
                        }}
                        onMouseLeave={() => {
                          // Only handle hover on desktop
                          if (isMobile) return;
                          setIsPrepositionHovered(false);
                        }}
                        className={`absolute z-[100] ${
                          submenuPosition === "below"
                            ? "top-full left-0 right-0 mt-1 w-full animate-slideDown"
                            : submenuPosition === "right"
                              ? "top-0 left-full ml-2 w-72 animate-slideRight"
                              : "top-0 right-full mr-2 w-72 animate-slideLeft"
                        }`}
                      >
                        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {/* All Prepositions Option */}
                            <button
                              onClick={() => handleSelect("preposition", true)}
                              className={`
                                w-full px-4 py-3 text-left transition-all duration-150
                                hover:bg-gray-800 border-b border-gray-800/30
                                ${
                                  selectedPartOfSpeech === "preposition" &&
                                  !selectedPrepositionFilter
                                    ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                    : "text-gray-300"
                                }
                              `}
                              role="menuitem"
                            >
                              <div className="font-semibold text-sm">
                                All Prepositions
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Show all preposition types
                              </div>
                            </button>
                            {prepositionSubFilters.map((filter) => (
                              <button
                                key={filter.value}
                                onClick={() =>
                                  handlePrepositionFilterSelect(filter.value)
                                }
                                className={`
                                w-full px-4 py-3 text-left transition-all duration-150
                                hover:bg-gray-800 border-b border-gray-800/30 last:border-b-0
                                ${
                                  selectedPrepositionFilter === filter.value
                                    ? `bg-gray-800/50 ${filter.color}`
                                    : "text-gray-300"
                                }
                              `}
                                role="menuitem"
                              >
                                <div
                                  className={`font-semibold text-sm ${
                                    selectedPrepositionFilter === filter.value
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
