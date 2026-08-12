import { useRef, useCallback, useMemo, memo, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { publicApi } from "../../../axios";
import { useAuth } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { useLockBodyScroll } from "./ModalScrolling";
import Button from "../../../components/UI/Button";
import { IoMdArrowDropright } from "react-icons/io";
import { HiSpeakerWave } from "react-icons/hi2";
import { MdOutlineDoubleArrow } from "react-icons/md";
import { SiGoogletranslate } from "react-icons/si";
import { FaSpinner } from "react-icons/fa";
import {
  IoInformationCircleOutline,
  IoPencilOutline,
  IoDocumentTextOutline,
  IoVolumeHighOutline,
  IoClose,
} from "react-icons/io5";
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

  // Add each part of speech as its own chip (skip "unknown"). "phrase" gets
  // spelled out since many phrase-tagged entries are actually fixed
  // expressions, not phrases in the grammatical sense.
  tagNames
    .filter((tag) => tag && tag !== "unknown")
    .forEach((tag) => info.push(tag === "phrase" ? "phrase / expression" : tag));

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
    let className =
      "text-slate-700 dark:text-slate-300 text-sm md:text-base lg:text-lg";
    let cleanSentence = sentence;

    // Determine styling and clean sentence
    if (trimmed.startsWith("##")) {
      cleanSentence = sentence.replace(/^##\s*/, "");
    } else if (trimmed.startsWith("--")) {
      cleanSentence = sentence.replace(/^--\s*/, "");
    } else if (trimmed.startsWith("**")) {
      className =
        "text-gray-500 dark:text-gray-400 list-none text-sm md:text-base lg:text-lg first-letter:uppercase font-normal";
      cleanSentence = sentence
        .replace(/^\*\*\s*/, "")
        .replace(/\*\*$/, "")
        .trim();
    }

    // "##"-prefixed lines are the top-level header — rendered as a
    // full-width bar whose background color is strongest in the middle and
    // fades to transparent at both edges, instead of plain underlined text.
    const isHeaderLine = trimmed.startsWith("##");

    // "--"-prefixed lines are a smaller sub-header nested under the nearest
    // "##" above them — rendered as its own labeled-divider layout (flanking
    // lines around an indigo label) rather than the plain "##"/"**" span, so
    // it's unmistakable at a glance as a third, distinct tier rather than a
    // slightly-smaller "##" or a slightly-different "**".
    const isSubHeaderLine = trimmed.startsWith("--");

    // "**"-prefixed lines (e.g. "Related") show a bullet marker — rendered
    // as its own fixed-width flex item rather than concatenated into the
    // text, so a wrapped second line aligns with the text start instead of
    // hanging back under the bullet, matching how the speaker-icon lines
    // (meaning/sentences) already wrap.
    const isBulletLine = trimmed.startsWith("**");

    const showSpeakerButton =
      !trimmed.startsWith("##") &&
      !trimmed.startsWith("--") &&
      !trimmed.startsWith("**");

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
    const isNormalSentence =
      !trimmed.startsWith("##") &&
      !trimmed.startsWith("--") &&
      !trimmed.startsWith("**");
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
        <div className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
          {showSpeakerButton && (
            <span className="flex items-start flex-shrink-0">
              <button
                onClick={handlePronounce}
                className="flex items-center justify-center h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 dark:border-cyan-400/30 text-cyan-600 dark:text-cyan-400 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:scale-110 hover:text-cyan-700 dark:hover:text-cyan-300 mr-1 md:mr-0 lg:mr-0"
                title="Pronounce"
              >
                <HiSpeakerWave size={16} className="lg:hidden" />
                <HiSpeakerWave size={18} className="hidden lg:block" />
              </button>
              <span className="hidden lg:inline">
                <IoMdArrowDropright className="text-pink-600 dark:text-pink-500 mt-1.5" size={20} />
              </span>
            </span>
          )}
          {isBulletLine && (
            <>
              {/* Invisible spacer matching the speaker-icon block's exact
              box model (size + margin + arrow) so the bullet lines up with
              where sentence text starts, not flush against the left edge. */}
              <span
                className="flex items-start flex-shrink-0 invisible"
                aria-hidden="true"
              >
                <span className="h-7 w-7 lg:h-8 lg:w-8 mr-1 md:mr-0 lg:mr-0" />
                <span className="hidden lg:inline">
                  <IoMdArrowDropright size={20} />
                </span>
              </span>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-2"
                aria-hidden="true"
              />
            </>
          )}
          {isHeaderLine ? (
            <div className="w-full my-1.5 pl-8 md:pl-9 lg:pl-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-pink-500/15 dark:from-orange-400/20 dark:to-pink-500/20 border border-orange-500/40 dark:border-orange-400/30 font-bold text-sm md:text-base text-orange-600 dark:text-orange-400 tracking-wide capitalize">
                {sentenceContent}
              </span>
            </div>
          ) : isSubHeaderLine ? (
            <div className="flex items-center gap-2 w-full my-1">
              <span
                className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-400/50 dark:to-indigo-400/40"
                aria-hidden="true"
              />
              <span className="flex-shrink-0 text-xs md:text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {sentenceContent}
              </span>
              <span
                className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-400/50 dark:to-indigo-400/40"
                aria-hidden="true"
              />
            </div>
          ) : (
            <span className={className}>{sentenceContent}</span>
          )}
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
              className="flex-shrink-0 flex items-center justify-center mt-0 lg:mt-1 text-gray-400 dark:text-gray-300 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Sign in to use translation feature"
            >
              <SiGoogletranslate size={16} />
            </button>
          )}
        </div>

        {translation && (
          <p className="text-sky-600 dark:text-sky-500 ml-6 mt-1 italic text-xs md:text-sm flex items-center gap-2">
            <MdOutlineDoubleArrow
              size={16}
              className="flex-shrink-0 text-pink-600 dark:text-pink-500 ml-0 lg:ml-1"
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
          [sentence]: err.message,
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
      <div className="relative max-w-6xl w-full mx-3">
        {/* Close — floats on the card's outer corner (half in, half out).
        Positioned relative to THIS non-scrolling wrapper, not the card
        itself, since the card's own overflow-y-auto would clip a
        negative-offset button instead of letting it hang over the edge. */}
        <button
          onClick={handleCloseModal}
          className="absolute -top-3 -right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          aria-label="Close"
          title="Close"
        >
          <IoClose size={22} aria-hidden="true" />
        </button>

        <div
          ref={modalRef}
          className="relative bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black rounded-3xl w-full shadow-2xl transform transition-all duration-300 border border-gray-200 dark:border-2 dark:border-gray-700/50 max-h-[90vh] overflow-y-auto"
        >
          <p className="text-center mt-8 md:mt-6 lg:mt-6 px-4 md:px-6">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full">
            <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">Topic:</span>
            <span className="text-md md:text-xl lg:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 dark:from-orange-400 dark:to-pink-400 ml-2">
              {selectedWord.topic?.name || ""}
            </span>
          </span>
        </p>
        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mx-8 mt-4" />
        <div className="flex justify-between items-center px-3 md:px-5 lg:px-8 mt-6 ml-1 ">
          <h3 className="text-lg md:text-2xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 flex items-center gap-4">
            <span>Word Details</span>
            <button
              onClick={handlePronounceWord}
              className="text-xl md:text-2xl lg:text-3xl text-indigo-500 dark:text-indigo-300 hover:scale-110 hover:text-indigo-400 "
              title="Pronounce"
            >
              <IoVolumeHighOutline aria-hidden="true" />
            </button>
            {userLoggedIn && isAdmin && (
              <Button
                to={`/edit-word/${selectedWord.id}`}
                variant="primary"
                surface="dark"
                size="sm"
              >
                <IoPencilOutline size={14} aria-hidden="true" />
                Edit
              </Button>
            )}
          </h3>

          {/* Favorite toggle — opposite side of the Word Details row. */}
          {userLoggedIn && (
            <FavoriteButton
              isFavorite={favorites.includes(selectedWord.id)}
              loading={loadingFavorites[selectedWord.id]}
              onClick={handleToggleFavorite}
              className="mr-2"
            />
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-3 mx-1 px-1 md:px-3 lg:px-2 mt-4 ">
          <div className="space-y-3 bg-gray-100/70 dark:bg-transparent dark:bg-gradient-to-br dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-4 rounded-2xl border border-gray-200 dark:border-gray-700/30">
            <p className="text-sm md:text-base lg:text-lg">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Word:</span>{" "}
              <span className="mr-2 font-bold text-orange-600 dark:text-orange-400 text-center text-md md:text-lg lg:text-xl">
                {selectedWord.article?.name}
              </span>
              <span className="text-gray-900 dark:text-white font-bold text-sm md:text-lg lg:text-xl">
                {renderWordWithPrefix(selectedWord)}
              </span>
            </p>
            {isEnumeratedMeaning ? (
              <div className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Meaning:</span>
                <div className="mt-1 pl-6 space-y-0.5">
                  {enumeratedMeaningParts.map((item, index) => {
                    const { marker, text } = splitMeaningMarkerFromText(item);
                    return (
                      <p
                        key={index}
                        className="text-cyan-700 dark:text-cyan-400 tracking-wide font-normal italic flex gap-1"
                      >
                        <span className="flex-shrink-0 text-gray-900 dark:text-white font-normal not-italic">
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
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0">
                  Meaning:
                </span>
                <span className="text-cyan-700 dark:text-cyan-400 tracking-wide font-normal italic">
                  {meaningsList}
                </span>
              </p>
            )}

            {selectedWord.pluralForm && (
              <p className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Plural:</span>{" "}
                {selectedWord.pluralForm && (
                  <>
                    <span className="font-bold text-orange-600 dark:text-orange-400 text-md md:text-lg lg:text-xl">
                      die
                    </span>{" "}
                    <span className="text-gray-900 dark:text-white font-bold">
                      {capitalizedPluralForm}
                    </span>
                  </>
                )}
              </p>
            )}

            {(selectedWord.synonyms?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg">
                <span className="text-blue-600 dark:text-blue-400 font-semibold capitalize">
                  Synonyms:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400 font-medium italic">
                  {synonymsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 ">
                        {idx < synonymsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            {(selectedWord.antonyms?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg ">
                <span className="text-blue-600 dark:text-blue-400 font-semibold capitalize">
                  Antonyms:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400 font-medium italic">
                  {antonymsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 ">
                        {idx < antonymsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            {(selectedWord.similarWords?.length || 0) > 0 && (
              <p className="text-sm md:text-base lg:text-lg ">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  Word to Watch:
                </span>{" "}
                <span className="text-gray-700 dark:text-gray-300 font-medium italic">
                  {similarWordsList.map((item, idx) => (
                    <span key={idx}>
                      {item.article && (
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {item.article}{" "}
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300 ">
                        {item.article ? capitalizeFirstLetter(item.value) : item.value}
                      </span>
                      {/* {idx < similarWordsList.length - 1 && ", "} */}
                      <span className="text-orange-600 dark:text-orange-400">
                        {idx < similarWordsList.length - 1 && ", "}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            )}

            <p className="text-sm md:text-base lg:text-lg">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Level:</span>{" "}
              <span className="inline-block px-2 md:px-2 py-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-md text-orange-600 dark:text-orange-400 font-bold text-xs md:text-sm">
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
                <span className="text-blue-600 dark:text-blue-400 font-semibold ">
                  <IoInformationCircleOutline
                    size={23}
                    className="text-gray-700 dark:text-white cursor-pointer hover:text-blue-500 transition mr-1 mt-[1px] animate-pulse "
                  />
                </span>

                <span className="flex flex-wrap gap-1">
                  {getWordInfo(selectedWord).map((item, index) => (
                    <span
                      key={index}
                      className="text-orange-700 dark:text-orange-400 text-xs md:text-sm italic bg-slate-100 dark:bg-slate-800 border border-cyan-600 dark:border-cyan-500 rounded-md  px-1 flex justify-center items-center "
                    >
                      <span className=""> {item}</span>
                    </span>
                  ))}
                </span>
              </p>
            )}
          </div>
          <div className="bg-gray-100/70 dark:bg-transparent dark:bg-gradient-to-br dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-3 rounded-2xl border border-gray-200 dark:border-gray-700/30 ">
            <p className="flex items-center gap-2 text-md md:text-lg lg:text-lg text-blue-600 dark:text-blue-400 font-semibold mb-3">
              <IoDocumentTextOutline size={18} aria-hidden="true" />
              Sentences:
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
              <span className="text-gray-500 dark:text-gray-400 italic">
                No sentences available.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-3 pb-4 pt-2 md:px-5">
          {userLoggedIn ? (
            <WordReportSection
              wordId={selectedWord.id}
              sentences={selectedWord.sentences}
            />
          ) : (
            <span />
          )}
          <Button variant="secondary" surface="dark" onClick={handleCloseModal}>
            Close
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WordListModal);
