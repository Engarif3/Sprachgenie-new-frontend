import React from "react";
import { pronounceWord } from "../../../utils/wordPronounciation";
import { PuffLoader } from "react-spinners";
import { ImBin } from "react-icons/im";
import ConjugationModal from "../WordList/ConjugationModal";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to render word with prefix highlighting for separable verbs
const renderWordWithPrefix = (word) => {
  const wordValue = word.value || "";
  const prefix = word.prefix;
  const partOfSpeech = normalizeText(word?.partOfSpeech?.name);
  const prefixType = word.prefixType;

  if (partOfSpeech === "verb" && prefixType === "SEPARABLE" && prefix) {
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
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
          {tooltipText}
        </span>
      )}
    </span>
  );
};

const getArticleColumnDisplay = (word) => {
  const partOfSpeechName = normalizeText(word?.partOfSpeech?.name);
  const articleName =
    typeof word?.article?.name === "string" ? word.article.name : "";
  const defaultArticleClassName =
    "font-semibold text-orange-500 dark:text-orange-400 text-xs md:text-sm lg:text-base";
  const baseMarkerClassName =
    "inline-block bg-black w-full px-1 md:px-2 lg:px-2 py-1 rounded-xl border text-xs md:text-sm lg:text-sm shadow-sm";

  if (
    !partOfSpeechName ||
    partOfSpeechName === "unknown" ||
    partOfSpeechName === "not specified"
  ) {
    return {
      text: articleName,
      className: defaultArticleClassName,
      tooltipText: "",
    };
  }

  if (partOfSpeechName === "noun") {
    return {
      text: articleName,
      className: defaultArticleClassName,
      tooltipText: "",
    };
  }

  if (partOfSpeechName === "verb") {
    return {
      text: "vrb.",
      className: `${baseMarkerClassName} text-white bg-cyan-600 font-bold`,
      tooltipText: "Verb",
    };
  }

  if (partOfSpeechName === "adjective") {
    return {
      text: "adj.",
      className: `${baseMarkerClassName} text-emerald-300`,
      tooltipText: "Adjective",
    };
  }

  if (partOfSpeechName === "adverb") {
    return {
      text: "adv.",
      className: `${baseMarkerClassName} text-violet-300`,
      tooltipText: "Adverb",
    };
  }

  if (
    partOfSpeechName === "adjective/adverb" ||
    partOfSpeechName === "adjective / adverb"
  ) {
    return {
      text: "adj/adv",
      className: `${baseMarkerClassName} text-fuchsia-300`,
      tooltipText: "Adjective/Adverb",
    };
  }

  if (partOfSpeechName === "preposition") {
    return {
      text: "prep.",
      className: `${baseMarkerClassName} text-amber-200`,
      tooltipText: "Preposition",
    };
  }

  if (partOfSpeechName === "conjunction") {
    return {
      text: "conj.",
      className: `${baseMarkerClassName} text-rose-300`,
      tooltipText: "Conjunction",
    };
  }

  if (partOfSpeechName === "phrase") {
    return {
      text: "phr.",
      className: `${baseMarkerClassName} text-cyan-400`,
      tooltipText: "Phrase",
    };
  }

  return {
    text: articleName,
    className: defaultArticleClassName,
    tooltipText: "",
  };
};

const TABLE_VARIANTS = {
  page: {
    articleCell:
      "border border-slate-200 border-dotted p-0 text-center dark:border-gray-700 md:p-2 lg:p-2",
    wordCell:
      "border border-slate-200 border-dotted p-1 dark:border-gray-700 md:p-2 lg:p-2",
    wordText:
      "max-w-[120px] cursor-pointer break-words pl-1 text-sm font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:text-blue-700 line-clamp-2 hover:line-clamp-none hover:max-w-full dark:text-blue-400 dark:hover:text-blue-300 md:max-w-full md:pl-0 md:text-lg lg:pl-0 lg:text-lg",
    pronounceButton:
      "rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 p-1 text-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-blue-100 hover:to-cyan-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-white dark:hover:from-blue-500/40 dark:hover:to-cyan-500/40",
    meaningCell:
      "border border-slate-200 border-dotted p-0 pl-2 dark:border-gray-700 md:p-2 lg:p-2",
    meaningText:
      "max-w-[120px] break-words text-sm font-medium text-slate-700 line-clamp-2 hover:line-clamp-none dark:text-white md:max-w-full md:text-base lg:text-base",
    conjugateCell:
      "border border-slate-200 border-dotted p-1 text-center dark:border-gray-700 md:p-2 lg:p-2",
    synonymsCell:
      "hidden border border-slate-200 border-dotted p-1 dark:border-gray-700 md:table-cell md:p-2 lg:p-2",
    synonymsTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-md font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-blue-100 hover:to-indigo-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-purple-500/20 dark:text-blue-300 dark:hover:from-blue-500/40 dark:hover:to-purple-500/40 dark:hover:shadow-blue-500/50",
    antonymsCell:
      "hidden border border-slate-200 p-1 dark:border-gray-700/50 lg:table-cell md:p-2 lg:p-2",
    antonymsTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1.5 text-md font-semibold text-rose-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-rose-100 hover:to-pink-100 dark:border-red-500/50 dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-300 dark:hover:from-red-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-red-500/50",
    similarCell:
      "hidden border border-slate-200 border-dotted p-1 dark:border-gray-700 lg:table-cell md:p-2 lg:p-2",
    similarTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-1.5 text-md font-semibold text-violet-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-violet-100 hover:to-fuchsia-100 dark:border-purple-500/50 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-300 dark:hover:from-purple-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-purple-500/50",
    removeCell:
      "border border-slate-200 border-dotted p-1 text-center dark:border-gray-700 md:p-2 lg:p-2",
  },
  dashboard: {
    articleCell:
      "border border-slate-200 border-dotted p-2 text-center dark:border-gray-700 md:p-2 lg:p-2",
    wordCell:
      "border border-slate-200 border-dotted p-2 dark:border-gray-700 md:p-2 lg:p-2",
    wordText:
      "max-w-[80px] cursor-pointer break-words text-xs font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:text-blue-700 line-clamp-2 hover:line-clamp-none dark:text-blue-400 dark:hover:text-blue-300 md:max-w-full md:text-sm lg:text-base",
    pronounceButton:
      "rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 px-1 text-xs text-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-blue-100 hover:to-cyan-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-white dark:hover:from-blue-500/40 dark:hover:to-cyan-500/40 md:text-sm",
    meaningCell:
      "border border-slate-200 border-dotted p-2 dark:border-gray-700 md:p-2 lg:p-2",
    meaningText:
      "max-w-[120px] break-words text-xs font-medium text-slate-700 line-clamp-2 hover:line-clamp-none dark:text-white md:max-w-full md:text-sm lg:text-base",
    conjugateCell:
      "border border-slate-200 border-dotted p-1 text-center dark:border-gray-700 md:p-2 lg:p-2",
    synonymsCell:
      "hidden border border-slate-200 border-dotted p-2 dark:border-gray-700 md:table-cell md:p-2 lg:p-2",
    synonymsTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-blue-100 hover:to-indigo-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-purple-500/20 dark:text-blue-300 dark:hover:from-blue-500/40 dark:hover:to-purple-500/40 dark:hover:shadow-blue-500/50 md:text-sm",
    antonymsCell:
      "hidden border border-slate-200 border-dotted p-2 dark:border-gray-700 lg:table-cell md:p-2 lg:p-2",
    antonymsTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-rose-100 hover:to-pink-100 dark:border-red-500/50 dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-300 dark:hover:from-red-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-red-500/50 md:text-sm",
    similarCell:
      "hidden border border-slate-200 border-dotted p-2 dark:border-gray-700 lg:table-cell md:p-2 lg:p-2",
    similarTag:
      "inline-flex cursor-pointer items-center gap-1 rounded-full border border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-violet-100 hover:to-fuchsia-100 dark:border-purple-500/50 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-300 dark:hover:from-purple-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-purple-500/50 md:text-sm",
    removeCell:
      "border border-slate-200 border-dotted p-2 text-center dark:border-gray-700 md:p-2 lg:p-2",
  },
};

const FavoriteWordsTable = ({
  paginatedFavorites,
  openModal,
  openWordInModal,
  generateParagraph,
  loadingParagraphs,
  handleConjugate,
  loadingConjugations,
  conjugationModalProps,
  handleRemoveFavorite,
  variant = "page",
}) => {
  const tableVariant = TABLE_VARIANTS[variant] ?? TABLE_VARIANTS.page;

  return (
    <>
      <div className="overflow-hidden rounded-2xl  shadow-xl dark:border-gray-700/50 dark:shadow-2xl">
        <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="bg-slate-900 text-sm text-white md:text-xl lg:text-xl dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <th className="rounded-tl-xl border-l border-slate-200 py-3 text-center text-sm font-bold text-orange-400 md:text-lg lg:text-lg dark:border-gray-700 w-[5%] md:w-[3%] lg:w-[3%]">
                {/* Art. */}
              </th>
              <th className="border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-blue-400 dark:border-gray-700 w-[15%] md:w-[10%] lg:w-[10%]">
                Word
              </th>
              <th className="border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-purple-400 dark:border-gray-700 w-[10%] md:w-[25%] lg:w-[25%]">
                Meaning
              </th>
              <th className="border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-violet-400 dark:border-gray-700 w-[3%] md:w-[5%] lg:w-[5%]">
                Conju.
              </th>
              <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-cyan-400 dark:border-gray-700 md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                Synonym
              </th>
              <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-pink-400 dark:border-gray-700  lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                Antonym
              </th>
              <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-green-400 dark:border-gray-700 lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                Word to Watch
              </th>
              <th className="rounded-tr-xl border-l border-r border-dotted border-slate-200 py-3 text-center text-sm font-bold text-red-400 dark:border-gray-700 md:text-lg lg:text-lg w-[3%] md:w-[3%] lg:w-[3%]"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedFavorites.map((word, index) => {
              const articleColumnDisplay = getArticleColumnDisplay(word);

              return (
                <tr
                  key={word.id}
                  className={`${
                    index % 2 === 0
                      ? "bg-white hover:bg-sky-50/70 dark:bg-gray-800 dark:hover:bg-gray-700"
                      : "bg-slate-50/80 hover:bg-sky-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  } border-b border-slate-200 transition-all duration-300 dark:border-gray-700`}
                >
                  <td className={tableVariant.articleCell}>
                    <PartOfSpeechBadge
                      text={articleColumnDisplay.text}
                      className={articleColumnDisplay.className}
                      tooltipText={articleColumnDisplay.tooltipText}
                    />
                  </td>
                  <td className={tableVariant.wordCell}>
                    <div className="flex justify-between gap-1 md:gap-4 items-center">
                      <span
                        className={tableVariant.wordText}
                        onClick={() => openModal(word)}
                      >
                        {renderWordWithPrefix(word)}
                      </span>

                      <div className="flex gap-1 md:gap-2 lg:gap-2">
                        <button
                          onClick={() => pronounceWord(word.value)}
                          className={tableVariant.pronounceButton}
                        >
                          🔊
                        </button>

                        <div
                          onClick={() => generateParagraph(word)}
                          className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 px-2 py-1 text-sm italic text-emerald-700 shadow-sm transition-all duration-300 hover:scale-110 hover:border-emerald-400 hover:from-emerald-500 hover:to-green-500 hover:text-white dark:border-green-500/50 dark:from-green-500/20 dark:to-emerald-500/20 dark:text-white dark:hover:border-green-400 dark:hover:from-green-500 dark:hover:to-emerald-500"
                        >
                          {loadingParagraphs[word.id] && (
                            <span className="absolute inset-0 flex items-center justify-center z-10">
                              <PuffLoader size={20} color="#10b981" />
                            </span>
                          )}
                          <span
                            className={`${
                              loadingParagraphs[word.id]
                                ? "invisible"
                                : "text-xs font-bold "
                            }`}
                          >
                            ai
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={tableVariant.meaningCell}>
                    <span className={tableVariant.meaningText}>
                      {word.meaning?.join(", ")}
                    </span>
                  </td>
                  <td className={tableVariant.conjugateCell}>
                    {normalizeText(word?.partOfSpeech?.name) === "verb" ? (
                      <button
                        type="button"
                        onClick={() => handleConjugate?.(word)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-violet-400 bg-gradient-to-r from-violet-600 to-purple-600 px-2 py-1.5 md:px-3 text-[11px] md:text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                        disabled={!!loadingConjugations?.[word.id]}
                        title="Show conjugation table"
                        aria-label="Show conjugation table"
                      >
                        {loadingConjugations?.[word.id] ? (
                          <PuffLoader size={14} color="#ffffff" />
                        ) : (
                          <span className="hidden md:inline">Conju.</span>
                        )}
                        {!loadingConjugations?.[word.id] && (
                          <span className="md:hidden leading-none">C</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </td>
                  <td className={tableVariant.synonymsCell}>
                    <div className="flex flex-wrap gap-1.5">
                      {word.synonyms?.map((synonym, synonymIndex) => (
                        <span
                          key={synonymIndex}
                          onClick={() => openWordInModal(synonym.value)}
                          className={tableVariant.synonymsTag}
                        >
                          {synonym.value}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className={tableVariant.antonymsCell}>
                    <div className="flex flex-wrap gap-1.5">
                      {word.antonyms?.map((antonym, antonymIndex) => (
                        <span
                          key={antonymIndex}
                          onClick={() => openWordInModal(antonym.value)}
                          className={tableVariant.antonymsTag}
                        >
                          {antonym.value}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={tableVariant.similarCell}>
                    <div className="flex flex-wrap gap-1.5">
                      {word.similarWords?.map((similarWord, similarIndex) => (
                        <span
                          key={similarIndex}
                          onClick={() => openWordInModal(similarWord.value)}
                          className={tableVariant.similarTag}
                        >
                          {similarWord.value}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className={tableVariant.removeCell}>
                    <button
                      onClick={() => handleRemoveFavorite(word.id)}
                      className="rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 p-2.5 font-bold text-rose-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-red-600 hover:to-pink-600 hover:text-white dark:border-red-500/50 dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-300 dark:shadow-lg dark:hover:shadow-red-500/50"
                    >
                      <ImBin size={12} />
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
