import { useEffect, useRef, useState } from "react";
import { publicApi } from "../axios";
import { makeChip } from "../utils/wordValidation";

const SUGGESTION_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 10;

// Shared "type a word, see it become a removable chip" input used by both
// the create-word and update-word forms for synonyms/antonyms/similar words.
// Existing words matching what's typed are suggested (via /word/suggest —
// the same fuzzy-matching endpoint the main word-list search box uses, so a
// genuine word typed with a typo still gets a "Did you mean" suggestion
// instead of showing nothing) so the admin can click one instead of
// retyping it; anything else becomes a chip the moment it's comma- or
// Enter-terminated.
//
// Chips are identified by `wordId` once resolved, NOT by text — a word's
// spelling can be shared by several distinct Word rows (different parts of
// speech), and each needs to be addable independently. Two unresolved
// (wordId: null) chips with the same text are allowed to coexist; each
// resolves to its own Word row later via the POS-selection flow the parent
// form owns. Only an exact wordId match is treated as a true duplicate.
const RelationTagInput = ({
  id,
  values,
  onChange,
  placeholder = "Type a word and press comma…",
}) => {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const commitChip = (rawValue, resolved = {}) => {
    const trimmed = rawValue.trim();
    setText("");
    setSuggestions([]);
    setShowSuggestions(false);

    if (!trimmed) {
      return;
    }

    const wordId = resolved.wordId ?? null;

    // Only an exact same-Word-row match counts as a duplicate. Two
    // unresolved chips sharing text are fine — they may resolve to
    // different POS variants.
    if (wordId !== null) {
      const alreadyPresent = values.some(
        (existing) => existing.wordId === wordId,
      );
      if (alreadyPresent) {
        return;
      }
    }

    onChange([
      ...values,
      makeChip({ value: trimmed, wordId, pos: resolved.pos ?? null }),
    ]);
  };

  const commitSuggestion = (word) => {
    const pos =
      word.partsOfSpeech?.length > 0
        ? word.partsOfSpeech.map((p) => p.name).join(", ")
        : null;
    commitChip(word.value, { wordId: word.id, pos });
  };

  const removeChip = (key) => {
    onChange(values.filter((chip) => chip.key !== key));
  };

  const fetchSuggestions = (query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    // Guards against a slower, earlier request resolving after a faster,
    // later one and overwriting fresher suggestions with stale ones — the
    // debounce alone doesn't prevent two requests from being in flight at
    // once if the admin pauses right around the debounce window.
    const requestId = ++latestRequestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await publicApi.get("/word/suggest", {
          params: {
            search: query.trim(),
            searchType: "word",
            limit: MAX_SUGGESTIONS,
          },
        });

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        const results = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        // Exclude a suggestion only if that exact Word row is already a
        // chip — a different POS variant with the same spelling must stay
        // offered.
        const filtered = results.filter(
          (word) => !values.some((existing) => existing.wordId === word.id),
        );

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }
        setSuggestions([]);
      }
    }, SUGGESTION_DEBOUNCE_MS);
  };

  const handleTextChange = (e) => {
    const nextValue = e.target.value;

    if (nextValue.includes(",")) {
      const parts = nextValue.split(",");
      const remainder = parts.pop();

      parts
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => commitChip(part));

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
      removeChip(values[values.length - 1].key);
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
        {values.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full border border-blue-400 bg-blue-50 px-3 py-1 text-sm text-blue-900"
          >
            {chip.value}
            {chip.pos && (
              <span className="text-xs font-semibold text-blue-600">
                · {chip.pos}
              </span>
            )}
            <button
              type="button"
              onClick={() => removeChip(chip.key)}
              className="text-blue-700 hover:text-red-600 font-bold leading-none"
              aria-label={`Remove ${chip.value}`}
              title={`Remove ${chip.value}`}
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
              onClick={() => commitSuggestion(word)}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-blue-50"
            >
              {word.isFuzzy ? (
                <>
                  <span className="italic text-amber-700">Did you mean</span>{" "}
                  <span className="font-semibold not-italic">
                    {word.value}
                  </span>
                  <span className="italic text-amber-700">?</span>
                </>
              ) : (
                word.value
              )}
              {word.partsOfSpeech?.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({word.partsOfSpeech.map((p) => p.name).join(", ")})
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
