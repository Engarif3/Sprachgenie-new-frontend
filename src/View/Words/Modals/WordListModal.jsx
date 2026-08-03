import { useRef, useCallback, useMemo, memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { publicApi } from "../../../axios";
import { useAuth } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLockBodyScroll } from "./ModalScrolling";
import { IoMdArrowDropright } from "react-icons/io";
import { HiSpeakerWave } from "react-icons/hi2";
import { MdOutlineDoubleArrow } from "react-icons/md";
import { SiGoogletranslate } from "react-icons/si";
import { FaSpinner } from "react-icons/fa";
import { IoInformationCircleOutline } from "react-icons/io5";
import { highlightPrefixInSentence } from "../../../utils/sentencePrefixHighlighter.jsx";
import WordReportSection from "./WordReportSection";

// Finds number+")"/number+"." markers ("1)", "2.") ANYWHERE in a block of
// text. Letter markers (a), A.) aren't handled yet — numbers only for now.
const ENUMERATED_MEANING_SPLIT_PATTERN = /\d+[).]/g;

// Pulls the leading marker off one already-split part so it can be
// rendered as its own flex item — a wrapped second line of that part
// then naturally lines up under the text, not under the marker, since
// it's wrapping within its own flex item rather than the whole line.
// Always displayed as "1)" even when the source used "1." — one
// consistent marker style regardless of which one the admin typed.
const ENUMERATED_MEANING_LEADING_MARKER = /^(\d+)[).]\s*/;
const splitMeaningMarkerFromText = (part) => {
  const match = part.match(ENUMERATED_MEANING_LEADING_MARKER);
  if (!match) {
    return { marker: "", text: part };
  }
  return { marker: `${match[1]})`, text: part.slice(match[0].length) };
};

// The `meaning` array isn't reliably one array item per numbered entry —
// the input that saves it splits on commas, so a single numbered entry
// like "1) foo: bar, baz" written by the admin lands in the DB shredded
// across several array items ("1) foo: bar", "baz"). Reassembling with
// ", " (the same join the plain, non-enumerated display already uses)
// recovers the original text, and only THEN does splitting on the
// embedded markers land on the right boundaries. Returns null when the
// reassembled text has fewer than 2 markers, so a normal meaning that
// merely happens to start with a digit isn't misdetected as a list.
const splitMeaningIntoEnumeratedParts = (meaning) => {
  const combinedText = (meaning || []).join(", ");
  const markerStarts = [];
  let match;
  ENUMERATED_MEANING_SPLIT_PATTERN.lastIndex = 0;

  while ((match = ENUMERATED_MEANING_SPLIT_PATTERN.exec(combinedText)) !== null) {
    markerStarts.push(match.index);
  }

  if (markerStarts.length < 2) {
    return null;
  }

  return markerStarts.map((start, index) => {
    const end =
      index + 1 < markerStarts.length
        ? markerStarts[index + 1]
        : combinedText.length;
    return combinedText.slice(start, end).trim();
  });
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to normalize text for comparison
const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getPosTagNames = (word) =>
  (word?.partsOfSpeech || []).map((p) => normalizeText(p.name));

// Helper function to render word with highlighted separable prefix
const renderWordWithPrefix = (word) => {
  const wordValue = word.value || "";
  const prefix = word.prefix;
  const isVerbTagged = getPosTagNames(word).includes("verb");
  const prefixType = word.prefixType;

  // Short form / abbreviation words (e.g. "AKW", "USA") always render in
  // full caps instead of the usual first-letter-capitalized style.
  if (word.isShortForm) {
    return <span>{wordValue.toUpperCase()}</span>;
  }

  // Only highlight if it's a separable verb with a prefix
  if (isVerbTagged && prefixType === "SEPARABLE" && prefix) {
    // Split the word into parts
    const parts = wordValue.split(" ");
    let foundMatch = false;
    let matchIndex = -1;

    // Find which part starts with the prefix (skip "sich" if it's the first part)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.toLowerCase() === "sich") continue; // Skip "sich"
      
      if (part.toLowerCase().startsWith(prefix.toLowerCase())) {
        foundMatch = true;
        matchIndex = i;
        break;
      }
    }

    if (foundMatch && matchIndex !== -1) {
      const matchedPart = parts[matchIndex];
      const prefixLength = prefix.length;
      const prefixPart = matchedPart.slice(0, prefixLength);
      const restPart = matchedPart.slice(prefixLength);

      // Reconstruct the word with highlighted prefix
      return (
        <span>
          {parts.slice(0, matchIndex).map((p, idx) => (
            <span key={idx}>
              {idx === 0 ? capitalizeFirstLetter(p) : p}
              {" "}
            </span>
          ))}
          <span className="text-orange-500 font-bold">
            {matchIndex === 0 ? capitalizeFirstLetter(prefixPart) : prefixPart}
          </span>
          {restPart}
          {parts.slice(matchIndex + 1).map((p, idx) => (
            <span key={idx}> {p}</span>
          ))}
        </span>
      );
    }
  }

  return <span>{capitalizeFirstLetter(wordValue)}</span>;
};

// Helper function to get word info based on the word's part(s) of speech —
// a word can carry more than one tag (e.g. adjective + adverb), so this
// pushes one chip per tag and applies every tag-specific info block that
// matches, instead of picking a single POS.
const getWordInfo = (word) => {
  const tagNames = getPosTagNames(word);
  const info = [];

  // Add each part of speech as its own chip (skip "unknown")
  tagNames
    .filter((tag) => tag && tag !== "unknown")
    .forEach((tag) => info.push(tag));

  if (tagNames.includes("verb")) {
    // Verb info
    if (word.prefixType === "SEPARABLE") info.push("separable");
    if (word.prefixType === "INSEPARABLE") info.push("inseparable");
    if (word.isReflexive) info.push("reflexive");
    if (word.isModal) info.push("modal");
    if (word.conjugation === "IRREGULAR") info.push("irregular");

    const caseReq = word.caseRequirement;
    if (caseReq) {
      const caseMap = {
        ACCUSATIVE: "accusative",
        DATIVE: "dative",
        GENITIVE: "genitive",
      };
      info.push(caseMap[caseReq] || caseReq.toLowerCase());
    }
  }

  if (tagNames.includes("preposition")) {
    // Preposition info
    if (word.prepositionCase) {
      const caseMap = {
        ACCUSATIVE: "accusative",
        DATIVE: "dative",
        GENITIVE: "genitive",
        WECHSEL: "wechsel (acc/dat)",
      };
      info.push(
        caseMap[word.prepositionCase] || word.prepositionCase.toLowerCase(),
      );
    }
  }

  if (tagNames.includes("adjective")) {
    // Adjective info
    if (word.isPrepositional) info.push("prepositional");
  }

  return info;
};

// Memoized sentence renderer component
const SentenceRenderer = memo(
  ({
    sentence,
    word,
    onTranslate,
    translation,
    isTranslationActive,
    isLoading,
    userLoggedIn,
    isFlagged,
  }) => {
    const trimmed = sentence.trim();
    let className = "text-slate-300 text-sm md:text-base lg:text-lg";
    let cleanSentence = sentence;

    // Determine styling and clean sentence
    if (trimmed.startsWith("##")) {
      className =
        "font-semibold text-md md:text-lg lg:text-lg text-sky-600 list-none w-full text-center underline capitalize";
      cleanSentence = sentence.replace(/^##\s*/, "");
    } else if (trimmed.startsWith("**")) {
      className =
        "text-gray-400 list-none text-sm md:text-base lg:text-lg first-letter:uppercase pl-1 font-normal";
      cleanSentence = sentence
        .replace(/^\*\*\s*/, "🟣 ")
        .replace(/\*\*$/, "")
        .trim();
    }

    const showSpeakerButton =
      !trimmed.startsWith("##") && !trimmed.startsWith("**");

    const handlePronounce = useCallback(() => {
      if (showSpeakerButton) {
        pronounceWord(cleanSentence);
      }
    }, [cleanSentence, showSpeakerButton]);

    const handleTranslateLocked = () => {
      Swal.fire({
        icon: "info",
        title: "Login to enjoy this feature",
        text: "Sign in to use the translation feature",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#123456",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
    };

    // Determine if this is a normal sentence for highlighting
    const isNormalSentence = !trimmed.startsWith("##") && !trimmed.startsWith("**");
    const sentenceContent = isNormalSentence
      ? highlightPrefixInSentence(word, cleanSentence)
      : cleanSentence;

    return (
      <div
        className={
          isFlagged
            ? "rounded-lg border border-red-500/60 bg-red-500/10 p-2"
            : undefined
        }
      >
        <div className="text-gray-600 flex items-start gap-2">
          {showSpeakerButton && (
            <span className="flex items-start flex-shrink-0">
              <button
                onClick={handlePronounce}
                className="text-blue-600 hover:text-blue-800 mr-1 md:mr-0 lg:mr-0"
                title="Pronounce"
              >
                <HiSpeakerWave
                  size={20}
                  className="mt-0 lg:mt-1 text-cyan-500 block lg:hidden"
                />
                <span className="text-xl hidden lg:block">🔊</span>
              </button>
              <span className="hidden lg:inline">
                <IoMdArrowDropright className="text-pink-600 mt-1" size={20} />
              </span>
            </span>
          )}
          <span className={className}>{sentenceContent}</span>
          {showSpeakerButton && userLoggedIn && (
            <button
              onClick={() => onTranslate(cleanSentence)}
              className=" flex-shrink-0 flex items-center justify-center mt-0 lg:mt-1 hover:scale-110 transition-transform"
              disabled={isLoading}
              title={isTranslationActive ? "Hide translation" : "Translate"}
            >
              {isLoading ? (
                <FaSpinner size={16} className="animate-spin" />
              ) : (
                <SiGoogletranslate
                  size={16}
                  className={
                    isTranslationActive
                      ? "text-green-500"
                      : "text-sky-500 hover:text-green-500"
                  }
                />
              )}
            </button>
          )}
          {showSpeakerButton && !userLoggedIn && (
            <button
              onClick={handleTranslateLocked}
              className="flex-shrink-0 flex items-center justify-center mt-0 lg:mt-1 text-gray-300 cursor-pointer hover:text-gray-200 transition-colors"
              title="Sign in to use translation feature"
            >
              <SiGoogletranslate size={16} />
            </button>
          )}
        </div>

        {translation && (
          <p className="text-sky-500 ml-6 mt-1 italic text-xs md:text-sm flex items-center gap-2">
            <MdOutlineDoubleArrow
              size={16}
              className="flex-shrink-0 text-pink-600 ml-0 lg:ml-1"
            />
            <span>{translation}</span>
          </p>
        )}
      </div>
    );
  },
);

SentenceRenderer.displayName = "SentenceRenderer";

const WordListModal = ({
  closeModal,
  selectedWord,
  favorites = [],
  toggleFavorite,
  loadingFavorites = {},
  // Sentence indexes to highlight red — only ever set by the superadmin
  // Word Reports dashboard, so it can show which sentence(s) were flagged.
  flaggedSentenceIndexes = [],
}) => {
  const modalRef = useRef(null);

  const { isAdmin, isLoggedIn: userLoggedIn } = useAuth();

  // Translation state — `translations` caches the fetched text per sentence
  // so re-toggling never re-hits the API; `visibleTranslations` tracks
  // whether that cached text is currently shown, independent of whether
  // it's been fetched yet, so the button can toggle show/hide on repeat
  // clicks instead of only ever translating once.
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState({});
  const [visibleTranslations, setVisibleTranslations] = useState({});

  // Call hooks BEFORE any conditional returns
  useLockBodyScroll(!!selectedWord);

  // Translate sentence handler — toggles the translation's visibility,
  // fetching it from the API only the first time it's shown.
  const translateSentence = useCallback(
    async (sentence) => {
      if (visibleTranslations[sentence]) {
        setVisibleTranslations((prev) => ({ ...prev, [sentence]: false }));
        return;
      }

      if (translations[sentence]) {
        setVisibleTranslations((prev) => ({ ...prev, [sentence]: true }));
        return;
      }

      setLoadingTranslations((prev) => ({ ...prev, [sentence]: true }));

      try {
        const response = await publicApi.post("/translate", {
          text: sentence,
          source: "de",
          target: "en",
        });
        const data = response.data;

        if (!data.data?.translated) {
          throw new Error("No translation received");
        }

        setTranslations((prev) => ({
          ...prev,
          [sentence]: data.data.translated,
        }));
        setVisibleTranslations((prev) => ({ ...prev, [sentence]: true }));
      } catch (err) {
        console.error("Translation failed:", err);
        setTranslations((prev) => ({
          ...prev,
          [sentence]: `❌ ${err.message}`,
        }));
        setVisibleTranslations((prev) => ({ ...prev, [sentence]: true }));
      } finally {
        setLoadingTranslations((prev) => ({ ...prev, [sentence]: false }));
      }
    },
    [translations, visibleTranslations],
  );

  // Add escape key handler for better UX
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && selectedWord) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeModal, selectedWord]);

  // Memoized callbacks (called unconditionally)
  const handlePronounceWord = useCallback(() => {
    pronounceWord(selectedWord?.value);
  }, [selectedWord?.value]);

  const handleToggleFavorite = useCallback(() => {
    if (selectedWord) {
      toggleFavorite(selectedWord.id);
    }
  }, [toggleFavorite, selectedWord]);

  const handleCloseModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  // Memoized capitalized word
  const capitalizedWord = useMemo(() => {
    if (!selectedWord?.value) return "";
    return (
      selectedWord.value.charAt(0).toUpperCase() + selectedWord.value.slice(1)
    );
  }, [selectedWord?.value]);

  // Memoized pluralized word
  const capitalizedPluralForm = useMemo(() => {
    if (!selectedWord?.pluralForm) return null;
    return (
      selectedWord.pluralForm.charAt(0).toUpperCase() +
      selectedWord.pluralForm.slice(1)
    );
  }, [selectedWord?.pluralForm]);

  // Memoized derived lists with articles (as arrays for styled rendering)
  const synonymsList = useMemo(() => {
    return (
      (selectedWord?.synonyms || [])?.map((s) => ({
        article: s.article?.name || null,
        value: s.value,
      })) || []
    );
  }, [selectedWord?.synonyms]);

  const antonymsList = useMemo(() => {
    return (
      (selectedWord?.antonyms || [])?.map((a) => ({
        article: a.article?.name || null,
        value: a.value,
      })) || []
    );
  }, [selectedWord?.antonyms]);

  const similarWordsList = useMemo(() => {
    return (
      (selectedWord?.similarWords || [])?.map((sw) => ({
        article: sw.article?.name || null,
        value: sw.value,
      })) || []
    );
  }, [selectedWord?.similarWords]);

  const meaningsList = useMemo(() => {
    return selectedWord?.meaning?.join(", ") || "";
  }, [selectedWord?.meaning]);

  // Meanings that are themselves a numbered list (1) foo 2) bar …) read
  // better one-per-line than comma-joined; null means the meaning isn't a
  // real numbered list, so the plain comma-joined display is used instead.
  const enumeratedMeaningParts = useMemo(
    () => splitMeaningIntoEnumeratedParts(selectedWord?.meaning),
    [selectedWord?.meaning],
  );

  const isEnumeratedMeaning = enumeratedMeaningParts !== null;

  // Now check if we should render
  if (!selectedWord) return null;

  // Handle background click to close modal
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div
      className="fixed z-50 inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center transition-opacity duration-300"
      onClick={handleBackgroundClick}
    >
      <div
        ref={modalRef}
        className="relative  bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl max-w-6xl w-full mx-3 shadow-2xl transform transition-all duration-300 dark:border-2 border-gray-700/50 max-h-[90vh] overflow-y-auto"
      >
        {/* Favorite Toggle Button */}

        {userLoggedIn && (
          <FavoriteButton
            isFavorite={favorites.includes(selectedWord.id)}
            loading={loadingFavorites[selectedWord.id]}
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 "
          />
        )}
        <p className="text-center mt-8 md:mt-6 lg:mt-6 px-4 md:px-6">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full">
            <span className="text-blue-400 text-lg font-bold">Topic:</span>
            <span className="text-md md:text-xl lg:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 ml-2">
              {selectedWord.topic?.name || ""}
            </span>
          </span>
        </p>
        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-8 mt-4" />
        <div className="flex justify-between items-center px-3 md:px-5 lg:px-8 mt-6 ml-1 ">
          <h3 className="text-lg md:text-2xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-4">
            <span>Word Details</span>
            <button
              onClick={handlePronounceWord}
              className="text-xl md:text-2xl lg:text-3xl hover:scale-110  hover:text-indigo-400 "
              title="Pronounce"
            >
              🔊
            </button>
            {userLoggedIn && isAdmin && (
              <Link
                to={`/edit-word/${selectedWord.id}`}
                className="px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-full font-semibold text-white text-xs md:text-sm transition-all duration-200 hover:scale-105 shadow-md"
              >
                ✏️ Edit
              </Link>
            )}
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-3 mx-1 px-1 md:px-3 lg:px-2 mt-4 ">
          <div className="space-y-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-4 rounded-2xl border border-gray-700/30">
            <p className="text-sm md:text-base lg:text-lg">
              <span className="text-blue-400 font-semibold">Word:</span>{" "}
              <span className="mr-2 font-bold text-orange-400 text-center text-md md:text-lg lg:text-xl">
                {selectedWord.article?.name}
              </span>
              <span className="text-white font-bold text-sm md:text-lg lg:text-xl">
                {renderWordWithPrefix(selectedWord)}
              </span>
            </p>
            {isEnumeratedMeaning ? (
              <div className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-400 font-semibold">Meaning:</span>
                <div className="mt-1 pl-6 space-y-0.5">
                  {enumeratedMeaningParts.map((item, index) => {
                    const { marker, text } = splitMeaningMarkerFromText(item);
                    return (
                      <p
                        key={index}
                        className="text-cyan-500 tracking-wide font-normal italic flex gap-1"
                      >
                        <span className="flex-shrink-0 text-white font-normal not-italic">
                          {marker}
                        </span>
                        <span>{text}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm md:text-base lg:text-lg flex gap-1">
                <span className="text-blue-400 font-semibold flex-shrink-0">
                  Meaning:
                </span>
                <span className="text-cyan-500 tracking-wide font-normal italic">
                  {meaningsList}
                </span>
              </p>
            )}

            {selectedWord.pluralForm && (
              <p className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-400 font-semibold">Plural:</span>{" "}
                {selectedWord.pluralForm && (
                  <>
                    <span className="font-bold text-orange-400 text-md md:text-lg lg:text-xl">
                      die
                    </span>{" "}
                    <span className="text-white font-bold">
                      {capitalizedPluralForm}
                    </span>
                  </>
                )}
              </p>
            )}

            {(selectedWord.synonyms?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-400 font-semibold capitalize">
                  Synonyms:
                </span>{" "}
                <span className=" dark:text-gray-400 font-medium italic">
                  {synonymsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      <span className="text-orange-400 ">
                        {idx < synonymsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            {(selectedWord.antonyms?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg ">
                <span className="text-blue-400 font-semibold capitalize">
                  Antonyms:
                </span>{" "}
                <span className=" dark:text-gray-400 font-medium italic">
                  {antonymsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      <span className="text-orange-400 ">
                        {idx < antonymsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            {(selectedWord.similarWords?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg ">
                <span className="text-blue-400 font-semibold">
                  Word to Watch:
                </span>{" "}
                <span className=" font-medium italic">
                  {similarWordsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      {/* {idx < similarWordsList.length - 1 && ", "} */}
                      <span className="text-orange-400">
                        {idx < similarWordsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            <p className="text-sm md:text-base lg:text-lg">
              <span className="text-blue-400 font-semibold">Level:</span>{" "}
              <span className="inline-block px-2 md:px-2 py-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-md text-orange-400 font-bold text-xs md:text-sm">
                {selectedWord.level?.level || ""}
              </span>
            </p>

            {/* {getWordInfo(selectedWord).length > 0 && (
              <p className="text-sm md:text-base lg:text-lg flex">
                <span className="text-blue-400 font-semibold">
                  <IoInformationCircleOutline
                    size={22}
                    // className="text-blue-400 cursor-pointer hover:text-blue-500 transition"
                    className="text-white  cursor-pointer hover:text-blue-500 transition mr-2 "
                  />
                </span>{" "}
                <span className="text-orange-300 text-xs md:text-sm italic bg-slate-800 border border-cyan-500 rounded-md h-5 p-1 flex justify-center items-center">
                  {getWordInfo(selectedWord).join(", ")}
                </span>
              </p>
            )} */}
            {getWordInfo(selectedWord).length > 0 && (
              <p className="text-sm md:text-base lg:text-lg flex  items-center ">
                <span className="text-blue-400 font-semibold ">
                  <IoInformationCircleOutline
                    size={23}
                    className="text-white cursor-pointer hover:text-blue-500 transition mr-1 mt-[1px] animate-pulse "
                  />
                </span>

                <span className="flex flex-wrap gap-1">
                  {getWordInfo(selectedWord).map((item, index) => (
                    <span
                      key={index}
                      className="text-orange-400 text-xs md:text-sm italic bg-slate-800 border border-cyan-500 rounded-md  px-1 flex justify-center items-center "
                    >
                      <span className=""> {item}</span>
                    </span>
                  ))}
                </span>
              </p>
            )}
          </div>
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-3 rounded-2xl border border-gray-700/30 ">
            <p className="text-md md:text-lg lg:text-lg text-blue-400 font-semibold mb-3">
              📝 Sentences:
            </p>
            {(selectedWord.sentences?.length || 0) > 0 ? (
              <ul className="space-y-2 ">
                {(selectedWord.sentences || []).map((sentence, index) => (
                  <SentenceRenderer
                    key={`${selectedWord.id}-${index}`}
                    sentence={sentence}
                    word={selectedWord}
                    onTranslate={translateSentence}
                    translation={
                      visibleTranslations[sentence]
                        ? translations[sentence]
                        : undefined
                    }
                    isTranslationActive={!!visibleTranslations[sentence]}
                    isLoading={loadingTranslations[sentence]}
                    userLoggedIn={userLoggedIn}
                    isFlagged={flaggedSentenceIndexes.includes(index)}
                  />
                ))}
              </ul>
            ) : (
              <span className="text-gray-400 italic">
                No sentences available.
              </span>
            )}
          </div>
        </div>

        {userLoggedIn && (
          <WordReportSection
            wordId={selectedWord.id}
            sentences={selectedWord.sentences}
          />
        )}

        <div className="sticky bottom-0 right-2 flex justify-end pr-2 pb-3 mt-6">
          <button
            onClick={handleCloseModal}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 p-1 rounded-full transition-all duration-200 hover:scale-110 shadow-xl hover:shadow-red-500/50"
            title="Close"
          >
            <RiCloseCircleFill size={28} className="text-white " />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(WordListModal);
