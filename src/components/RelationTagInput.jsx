import { useEffect, useRef, useState } from "react";
import { publicApi } from "../axios";

const SUGGESTION_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

const normalize = (value) => String(value || "").trim().toLowerCase();

// Shared "type a word, see it become a removable chip" input used by both
// the create-word and update-word forms for synonyms/antonyms/similar words.
// Existing words matching what's typed are suggested (via /words/suggestions)
// so the admin can click one instead of retyping it; anything else becomes a
// chip the moment it's comma- or Enter-terminated. What happens to a chip
// after that (multi-POS detection, self-reference checks, actually linking
// the relation) is unchanged — this component only owns the chip list itself.
const RelationTagInput = ({
  id,
  values,
  onChange,
  relationType,
  placeholder = "Type a word and press comma…",
}) => {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const commitChip = (rawValue) => {
    const trimmed = rawValue.trim();
    setText("");
    setSuggestions([]);
    setShowSuggestions(false);

    if (!trimmed) {
      return;
    }

    const alreadyPresent = values.some(
      (existing) => normalize(existing) === normalize(trimmed),
    );

    if (alreadyPresent) {
      return;
    }

    onChange([...values, trimmed]);
  };

  const removeChip = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const fetchSuggestions = (query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await publicApi.get("/words/suggestions", {
          params: { query: query.trim(), type: relationType },
        });

        const results = Array.isArray(response.data) ? response.data : [];
        const filtered = results.filter(
          (word) =>
            !values.some(
              (existing) => normalize(existing) === normalize(word.value),
            ),
        );

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, SUGGESTION_DEBOUNCE_MS);
  };

  const handleTextChange = (e) => {
    const nextValue = e.target.value;

    if (nextValue.includes(",")) {
      const parts = nextValue.split(",");
      const remainder = parts.pop();

      parts.map((part) => part.trim()).filter(Boolean).forEach(commitChip);

      setText(remainder);
      fetchSuggestions(remainder);
      return;
    }

    setText(nextValue);
    fetchSuggestions(nextValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitChip(text);
      return;
    }

    if (e.key === "Backspace" && text === "" && values.length > 0) {
      removeChip(values.length - 1);
    }
  };

  const handleBlur = () => {
    // Delay so a click on a suggestion button fires before the dropdown
    // closes (a plain blur would otherwise beat the click event).
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div className="relative">
      <div className="w-full min-h-[3rem] p-2 border border-gray-300 rounded-lg shadow-sm flex flex-wrap items-center gap-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="inline-flex items-center gap-1 rounded-full border border-blue-400 bg-blue-50 px-3 py-1 text-sm text-blue-900"
          >
            {value}
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="text-blue-700 hover:text-red-600 font-bold leading-none"
              aria-label={`Remove ${value}`}
              title={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onBlur={handleBlur}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8rem] border-none outline-none focus:ring-0 p-1 text-inherit"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((word) => (
            <button
              key={word.id}
              type="button"
              onClick={() => commitChip(word.value)}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-blue-50"
            >
              {word.value}
              {word.partOfSpeech?.name && (
                <span className="ml-2 text-xs text-gray-500">
                  ({word.partOfSpeech.name})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelationTagInput;
