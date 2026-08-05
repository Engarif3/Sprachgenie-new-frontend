import React from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "../Modals/FavoriteButton";
import { PuffLoader } from "react-spinners";

// Helper function to capitalize only the first letter of the string
const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

  // Only highlight if:
  // 1. It's a verb
  // 2. It's marked as separable
  // 3. A prefix is defined
  if (isVerbTagged && prefixType === "SEPARABLE" && prefix) {
    // Split the word into parts to handle multi-part verbs like "über etwas hinausdenken"
    const parts = wordValue.split(" ");
    let foundMatch = false;
    let matchIndex = -1;

    // Find which part starts with the prefix (skip "sich" if present)
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
            <span key={idx}>{idx === 0 ? capitalizeFirstLetter(p) : p} </span>
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

  // Default: just capitalize first letter
  return <span>{capitalizeFirstLetter(wordValue)}</span>;
};

const PartOfSpeechBadge = ({ text, className, tooltipText }) => {
  const showTooltip = Boolean(tooltipText);

  return (
    <span className="group relative inline-flex items-center justify-center">
      <span className={className} aria-label={tooltipText || undefined}>
        {text}
      </span>
      {showTooltip && (
        <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
          {tooltipText}
        </span>
      )}
    </span>
  );
};

const ARTICLE_COLUMN_BASE_MARKER_CLASSNAME =
  "inline-block bg-black w-full px-1 py-1 rounded-xl border text-xs  shadow-sm";
const ARTICLE_COLUMN_DEFAULT_CLASSNAME =
  "font-bold text-orange-400 text-xs md:text-lg lg:text-lg";

// One badge config per taggable POS name — a word can now carry more than
// one tag (e.g. adjective + adverb), so this renders one badge per tag
// instead of picking a single POS to display.
const POS_BADGE_CONFIG = {
  verb: {
    text: "vrb.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-white bg-sky-600 font-bold`,
    tooltipText: "Verb",
  },
  adjective: {
    text: "adj.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-emerald-300`,
    tooltipText: "Adjective",
  },
  adverb: {
    text: "adv.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-violet-300`,
    tooltipText: "Adverb",
  },
  preposition: {
    text: "pre.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-amber-200`,
    tooltipText: "Preposition",
  },
  conjunction: {
    text: "conj.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-rose-300`,
    tooltipText: "Conjunction",
  },
  phrase: {
    text: "phr.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-cyan-400`,
    tooltipText: "Phrase / Expression",
  },
  pronoun: {
    text: "pron.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-fuchsia-300`,
    tooltipText: "Pronoun",
  },
  prefix: {
    text: "pfx.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-indigo-300`,
    tooltipText: "Prefix",
  },
  interjection: {
    text: "intj.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-orange-300`,
    tooltipText: "Interjection",
  },
  numeral: {
    text: "num.",
    className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-lime-300`,
    tooltipText: "Numeral",
  },
};

// Returns an array of badges to render in the Article column — one entry
// per POS tag the word carries (e.g. adjective+adverb shows two badges side
// by side), or the grammatical article text for nouns/untagged words.
const getArticleColumnDisplay = (word) => {
  const tagNames = getPosTagNames(word);
  const articleName = (
    typeof word?.article?.name === "string" ? word.article.name : ""
  ).trim();

  const otherBadges = tagNames
    .filter((tag) => POS_BADGE_CONFIG[tag])
    .map((tag) => ({ key: tag, ...POS_BADGE_CONFIG[tag] }));

  const isTaggedNoun = tagNames.includes("noun");
  const hasUnrecognizedTag = tagNames.some(
    (tag) =>
      !POS_BADGE_CONFIG[tag] &&
      tag !== "noun" &&
      tag !== "unknown" &&
      tag !== "not specified",
  );

  // A word tagged noun always shows something for its noun-ness alongside
  // any other badges it carries: the grammatical article when the word has
  // one, or a plain "noun" badge when it doesn't (the article field can be an
  // empty string rather than unset — e.g. "Bitte" = adverb + noun used to
  // render only "adv.", silently losing the noun tag entirely because
  // there was no article text to fall back to).
  if (isTaggedNoun) {
    const nounEntry = articleName
      ? {
          key: "article",
          text: articleName,
          className: ARTICLE_COLUMN_DEFAULT_CLASSNAME,
          tooltipText: "",
        }
      : {
          key: "noun-badge",
          text: "noun",
          className: `${ARTICLE_COLUMN_BASE_MARKER_CLASSNAME} text-amber-400`,
          tooltipText: "Noun",
        };
    return [nounEntry, ...otherBadges];
  }

  // Untagged or unrecognized-POS words fall back to showing the article
  // text alone (possibly empty) so the column never renders nothing.
  if (otherBadges.length === 0 || hasUnrecognizedTag) {
    return [
      {
        key: "article",
        text: articleName,
        className: ARTICLE_COLUMN_DEFAULT_CLASSNAME,
        tooltipText: "",
      },
      ...otherBadges,
    ];
  }

  return otherBadges;
};

const WordTableRow = ({
  word,
  index,
  learningMode,
  currentIndex,
  revealedWords,
  showActionColumn,
  canManageWords,
  userLoggedIn,
  favorites,
  loadingFavorites,
  loadingParagraphs,
  loadingConjugations,
  focusElement,
  revealMeaning,
  openModal,
  generateParagraph,
  handleConjugate,
  handleArrowKeyPress,
  openWordInModal,
  handleDelete,
  toggleFavorite,
  setSelectedHistory,
  setIsHistoryModalOpen,
}) => {
  const articleColumnBadges = getArticleColumnDisplay(word);
  const isVerb = getPosTagNames(word).includes("verb");

  const handleFavoriteLocked = () => {
    Swal.fire({
      icon: "info",
      title: "Login to enjoy this feature",
      text: "Sign in to add words to your favorites",
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

  const handleAIGenerationLocked = () => {
    Swal.fire({
      icon: "info",
      title: "Login to enjoy this feature",
      text: "Sign in to generate AI-powered paragraphs",
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

  return (
    <tr
      key={word.id}
      className={`border-b border-slate-200 dark:border-gray-700/60 transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-purple-500/5 ${
        index % 2 === 0
          ? "bg-white dark:bg-gray-800/40"
          : "bg-slate-50 dark:bg-gray-900/40"
      }`}
    >
      {/* Article */}
      <td className="p-1 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1">
          {articleColumnBadges.map((badge) => (
            <PartOfSpeechBadge
              key={badge.key}
              text={badge.text}
              className={badge.className}
              tooltipText={badge.tooltipText}
            />
          ))}
        </div>
      </td>

      {/* Word value */}
      {/* Previous version with CSS capitalize - capitalizes every word */}
      {/* <td className="border-l border-gray-400  p-2 capitalize border-dotted"> */}
      <td className="p-1 md:p-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <span
            tabIndex={learningMode ? 0 : -1}
            ref={learningMode && index === currentIndex ? focusElement : null}
            className="inline-flex items-center gap-2 cursor-pointer p-0 md:p-2 lg:p-2 text-blue-600 dark:text-blue-400 hover:text-blue-300 text-sm md:text-lg lg:text-lg font-semibold md:font-bold lg:font-bold break-words max-w-[120px] md:max-w-full transition-colors duration-200"
            onClick={() => openModal(word)}
          >
            {/* Previous version - used CSS capitalize */}
            {/* {word.value} */}
            {renderWordWithPrefix(word)}
          </span>

          {/* Stacked below the word on mobile instead of beside it — side by
          side, this row's own min-content width added onto the word's,
          forcing the column (and the whole table) wider than the viewport
          on phones. Stacking keeps the column's width to whichever of the
          two is wider, not their sum. Right-aligned (self-end) so it sits
          under the end of the word, not the start. */}
          <div className="flex gap-1 self-end md:gap-4 md:self-auto lg:gap-4">
            <button
              onClick={() => pronounceWord(word.value)}
              className="text-md md:text-2xl lg:text-2xl hover:scale-110 transition-transform duration-200 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              title="Pronounce word"
            >
              🔊
            </button>

            {userLoggedIn ? (
              <button
                type="button"
                onClick={() => generateParagraph(word)}
                className="relative border-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full md:mt-4 h-6 w-6 cursor-pointer hover:scale-110 border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-green-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                disabled={loadingParagraphs[word.id]}
                title="Generate AI paragraph"
                aria-label="Generate AI paragraph"
              >
                {loadingParagraphs[word.id] && (
                  <span className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <PuffLoader size={20} color="#FF0000" />
                  </span>
                )}

                <span
                  className={`${
                    loadingParagraphs[word.id]
                      ? "invisible"
                      : "flex items-center justify-center relative bottom-1"
                  }`}
                >
                  ai
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAIGenerationLocked}
                className="relative border-2 bg-gradient-to-r from-gray-500 to-gray-500 text-gray-100 italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full md:mt-4 h-6 w-6 cursor-pointer border-gray-400 hover:from-gray-400 hover:to-gray-400 transition-all duration-200"
                title="Sign in to generate paragraphs"
                aria-label="Sign in to generate paragraphs"
              >
                <span className="flex items-center justify-center relative bottom-1">
                  ai
                </span>
              </button>
            )}
          </div>
        </div>
      </td>

      {/* Meaning */}
      <td
        className={`pl-1 p-0 md:p-3 lg:p-3 text-sm md:text-lg lg:text-lg ${
          learningMode && index === currentIndex
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold"
            : "text-cyan-500 dark:text-cyan-300 font-serif"
        }`}
        onClick={() => learningMode && revealMeaning(word.id)}
        tabIndex="0"
        onKeyDown={(e) => handleArrowKeyPress(e, index)}
        ref={currentIndex === index ? focusElement : null}
      >
        {learningMode && !revealedWords.includes(word.id) ? (
          <span className="opacity-0">Hidden</span>
        ) : (
          <span className="line-clamp-2 hover:line-clamp-none break-words max-w-[120px] md:max-w-full">
            {word.meaning?.join(", ")}
          </span>
        )}
      </td>

      {/* Conjugate — verbs only */}
      <td className="p-1 md:p-2 text-center">
        {isVerb ? (
          <button
            type="button"
            onClick={() => handleConjugate(word)}
            className="relative border-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full h-6 w-6 cursor-pointer hover:scale-105 border-violet-400 transition-all duration-200 shadow-lg hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            disabled={!!loadingConjugations?.[word.id]}
            title="Show conjugation table"
            aria-label="Show conjugation table"
          >
            {loadingConjugations?.[word.id] && (
              <span className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <PuffLoader size={14} color="#ffffff" />
              </span>
            )}

            <span
              className={`${
                loadingConjugations?.[word.id]
                  ? "invisible"
                  : "flex items-center justify-center relative bottom-1"
              }`}
            >
              ai
            </span>
          </button>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>

      {/* Synonyms */}
      <td className="p-2 md:p-3 text-blue-600 dark:text-blue-300 hidden md:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {word.synonyms?.map((synonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(synonym.value, synonym.id)}
              className="inline-block max-w-[12rem] break-words text-center text-base px-1 py-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-full hover:from-blue-500/30 hover:to-cyan-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {synonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Antonyms */}
      <td className="p-2 md:p-3 text-red-600 dark:text-red-300 hidden lg:table-cell xl:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {word.antonyms?.map((antonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(antonym.value, antonym.id)}
              className="inline-block max-w-[12rem] break-words text-center text-base px-1 py-0.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-full hover:from-red-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {antonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Similar Words */}
      <td className="p-2 md:p-3 text-blue-400 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {word.similarWords?.map((similarword, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(similarword.value, similarword.id)}
              className="inline-block max-w-[12rem] break-words text-center text-base px-1 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full hover:from-purple-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {similarword.value}
            </span>
          ))}
        </div>
      </td>

      {/* Level */}
      <td className="p-2 md:p-3 hidden md:table-cell text-center">
        <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-xs sm:text-sm">
          {word.level?.level}
        </span>
      </td>

      {/* Action */}
      <td
        className={`p-2 md:p-3 text-center ${
          showActionColumn ? "table-cell" : "hidden"
        } `}
      >
        <div className="flex gap-2 justify-center">
          <Link
            to={`/edit-word/${word.id}`}
            className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg font-semibold text-white text-xs sm:text-sm transition-colors duration-200 hover:scale-105 shadow-md"
          >
            Edit
          </Link>
          <button
            onClick={() => handleDelete(word.id, word.value)}
            className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg font-semibold text-white text-xs sm:text-sm transition-colors duration-200 hover:scale-105 shadow-md"
          >
            Delete
          </button>
        </div>
      </td>

      {/* Favorite */}
      <td className="p-0 md:p-3 text-center">
        {userLoggedIn ? (
          <FavoriteButton
            isFavorite={favorites.includes(word.id)}
            loading={loadingFavorites[word.id]}
            onClick={() => toggleFavorite(word.id)}
          />
        ) : (
          <button
            onClick={handleFavoriteLocked}
            className="p-1 rounded-full cursor-pointer transition-opacity hover:opacity-80"
            title="Sign in to add favorites"
          >
            <svg
              className="w-4 h-4 md:w-6 md:h-6 text-gray-300"
              viewBox="-3 -3 128 114"
            >
              <path
                style={{
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeMiterlimit: "10",
                }}
                d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
              />
            </svg>
          </button>
        )}
      </td>

      {/* History */}
      {userLoggedIn && canManageWords && (
        <td className="p-2 md:p-3 text-center hidden md:table-cell lg:table-cell">
          <button
            onClick={() => {
              setSelectedHistory({
                creator: {
                  name: word.creator?.name,
                  email: word.creator?.email,
                },
                modifiers:
                  word.history?.map((h) => ({
                    name: h.user?.name,
                    email: h.user?.email,
                  })) || [],
              });
              setIsHistoryModalOpen(true);
            }}
            className={`hover:text-blue-700 ${
              word.history?.some((h) => {
                const adminEmails =
                  import.meta.env.VITE_ADMIN_EMAILS?.split(",") || [];
                return !adminEmails.includes(h.user?.email);
              })
                ? "text-red-500"
                : "text-blue-500"
            }`}
            aria-label="View history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </td>
      )}
    </tr>
  );
};

export default React.memo(WordTableRow);
