import React from "react";
import { pronounceWord } from "../../../utils/wordPronounciation";
import { PuffLoader } from "react-spinners";
import { RiDeleteBin6Line } from "react-icons/ri";
import ConjugationModal from "../WordList/ConjugationModal";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getPosTagNames = (word) =>
  (word?.partsOfSpeech || []).map((p) => normalizeText(p.name));

// Helper function to render word with prefix highlighting for separable verbs
// — identical to WordTableRow's, kept in sync so the Favorites table reads
// exactly like the main Wordlist table.
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

  if (isVerbTagged && prefixType === "SEPARABLE" && prefix) {
    const parts = wordValue.split(" ");
    let foundMatch = false;
    let matchIndex = -1;

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

// One badge config per taggable POS name — matches WordTableRow's
// POS_BADGE_CONFIG exactly (same colors) so a word looks the same whether
// it's shown in the Wordlist or the Favorites table.
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
};

// Returns an array of badges to render in the Article column — one entry
// per POS tag the word carries (e.g. adjective+adverb shows two badges side
// by side), or the grammatical article text for nouns/untagged words.
const getArticleColumnDisplay = (word) => {
  const tagNames = getPosTagNames(word);
  const articleName =
    typeof word?.article?.name === "string" ? word.article.name : "";

  const badges = tagNames
    .filter((tag) => POS_BADGE_CONFIG[tag])
    .map((tag) => ({ key: tag, ...POS_BADGE_CONFIG[tag] }));

  const hasUnbadgedTag = tagNames.some(
    (tag) =>
      !POS_BADGE_CONFIG[tag] &&
      tag !== "noun" &&
      tag !== "unknown" &&
      tag !== "not specified",
  );

  if (badges.length === 0 || hasUnbadgedTag) {
    return [
      {
        key: "article",
        text: articleName,
        className: ARTICLE_COLUMN_DEFAULT_CLASSNAME,
        tooltipText: "",
      },
      ...badges,
    ];
  }

  return badges;
};

const FavoriteWordsTable = ({
  paginatedFavorites,
  openModal,
  openWordInModal,
  generateParagraph,
  loadingParagraphs,
  handleConjugate,
  loadingConjugations,
  isAnyAiActionPending,
  conjugationModalProps,
  handleRemoveFavorite,
}) => {
  return (
    <>
      <div className="overflow-x-auto border-gray-700/50 rounded-2xl shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 dark:bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-sm md:text-xl lg:text-xl text-white">
              <th className="py-3 text-sm md:text-lg lg:text-lg text-center text-slate-200 font-bold w-[5%] md:w-[3%] lg:w-[3%] rounded-tl-xl border-b-2 border-slate-700/70">
                {/* Art. */}
              </th>
              <th className="py-3 text-center text-slate-200 font-bold w-[15%] md:w-[10%] lg:w-[10%] border-b-2 border-slate-700/70">
                Word
              </th>
              <th className="py-3 text-center text-slate-200 font-bold w-[10%] md:w-[25%] lg:w-[25%] border-b-2 border-slate-700/70">
                Meaning
              </th>
              <th className="py-3 text-center text-slate-200 font-bold w-[3%] md:w-[5%] lg:w-[5%] border-b-2 border-slate-700/70">
                Conju.
              </th>
              <th className="py-3 text-center text-slate-200 font-bold hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b-2 border-slate-700/70">
                Synonym
              </th>
              <th className="py-3 text-center text-slate-200 font-bold hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b-2 border-slate-700/70">
                Antonym
              </th>
              <th className="py-3 text-center text-slate-200 font-bold hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b-2 border-slate-700/70">
                Word to Watch
              </th>
              <th className="hidden md:table-cell lg:table-cell py-3 text-sm md:text-lg lg:text-lg text-center text-slate-200 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b-2 border-slate-700/70">
                Level
              </th>
              <th className="py-3 text-sm md:text-lg lg:text-lg text-center text-slate-200 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b-2 border-slate-700/70 rounded-tr-xl">
                🗑️
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedFavorites.map((word, index) => {
              const articleColumnBadges = getArticleColumnDisplay(word);
              const isVerb = getPosTagNames(word).includes("verb");

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
                  <td className="p-1 md:p-3">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span
                        className="inline-flex items-center gap-2 cursor-pointer p-0 md:p-2 lg:p-2 text-blue-600 dark:text-blue-400 hover:text-blue-300 text-sm md:text-lg lg:text-lg font-semibold md:font-bold lg:font-bold break-words max-w-[120px] md:max-w-full transition-colors duration-200"
                        onClick={() => openModal(word)}
                      >
                        {renderWordWithPrefix(word)}
                      </span>

                      <div className="flex gap-1 self-end md:gap-4 md:self-auto lg:gap-4">
                        <button
                          onClick={() => pronounceWord(word.value)}
                          className="text-md md:text-2xl lg:text-2xl hover:scale-110 transition-transform duration-200 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                          title="Pronounce word"
                        >
                          🔊
                        </button>

                        <button
                          type="button"
                          onClick={() => generateParagraph(word)}
                          className="relative border-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full md:mt-4 h-6 w-6 cursor-pointer hover:scale-110 border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-green-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                          disabled={isAnyAiActionPending}
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
                      </div>
                    </div>
                  </td>

                  {/* Meaning */}
                  <td className="pl-1 p-0 md:p-3 lg:p-3 text-sm md:text-lg lg:text-lg text-cyan-500 dark:text-cyan-300 font-serif">
                    <span className="line-clamp-2 hover:line-clamp-none break-words max-w-[120px] md:max-w-full">
                      {word.meaning?.join(", ")}
                    </span>
                  </td>

                  {/* Conjugate — verbs only */}
                  <td className="p-1 md:p-2 text-center">
                    {isVerb ? (
                      <button
                        type="button"
                        onClick={() => handleConjugate?.(word)}
                        className="relative border-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full h-6 w-6 cursor-pointer hover:scale-105 border-violet-400 transition-all duration-200 shadow-lg hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                        disabled={isAnyAiActionPending}
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
                          onClick={() => openWordInModal(synonym.value)}
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
                          onClick={() => openWordInModal(antonym.value)}
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
                          onClick={() => openWordInModal(similarword.value)}
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

                  {/* Remove from favorites */}
                  <td className="p-2 md:p-3 text-center">
                    <button
                      onClick={() => handleRemoveFavorite(word.id)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-full border-2 border-rose-400 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-red-500/50"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <RiDeleteBin6Line size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Conjugation modal */}
      {conjugationModalProps?.isOpen && (
        <ConjugationModal {...conjugationModalProps} />
      )}
    </>
  );
};

export default React.memo(FavoriteWordsTable);
