import { useRef, useCallback, useMemo, memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLockBodyScroll } from "./ModalScrolling";
import { IoMdArrowDropright } from "react-icons/io";
import { FcSpeaker } from "react-icons/fc";

// Memoized sentence renderer component
const SentenceRenderer = memo(({ sentence, index }) => {
  const trimmed = sentence.trim();
  let className = "text-gray-300 list-disc text-sm md:text-lg lg:text-lg";
  let cleanSentence = sentence;

  // Determine styling and clean sentence
  if (trimmed.startsWith("##")) {
    className =
      "font-semibold text-md md:text-lg lg:text-lg text-sky-600 list-none w-full text-center underline capitalize ";
    cleanSentence = sentence.replace(/^##\s*/, "");
  } else if (trimmed.startsWith("**")) {
    className =
      "text-slate-400 list-none text-sm md:text-lg lg:text-lg first-letter:uppercase pl-1";
    cleanSentence = sentence
      .replace(/^\*\*\s*/, "⭕ ")
      .replace(/\*\*$/, "")
      .trim();
  }

  const showSpeakerButton =
    !trimmed.startsWith("##") && !trimmed.startsWith("**");

  // Always call useCallback - hooks must be called unconditionally
  const handlePronounce = useCallback(() => {
    if (showSpeakerButton) {
      pronounceWord(cleanSentence);
    }
  }, [cleanSentence, showSpeakerButton]);

  return (
    <div className="text-gray-600 flex items-start">
      {showSpeakerButton && (
        <span className="flex items-start">
          <button
            onClick={handlePronounce}
            className="text-blue-600 hover:text-blue-800 mr-1 md:mr-0 lg:mr-0"
            title="Pronounce"
          >
            {/* 🔊 */}
            <FcSpeaker size={20} className="mt-0 md:mt-1 lg:mt-1 " />
          </button>
          {/* <span className="hidden md:inline lg:inline"> */}
          <span className="hidden md:inline lg:inline">
            <IoMdArrowDropright className="text-pink-600 mt-1" size={20} />
          </span>
        </span>
      )}
      <span className={className}>{cleanSentence}</span>
    </div>
  );
});

SentenceRenderer.displayName = "SentenceRenderer";

const WordListModal = ({
  closeModal,
  selectedWord,
  favorites = [],
  toggleFavorite,
  loadingFavorites = {},
  isOpen = true,
}) => {
  const modalRef = useRef(null);

  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();

  // Call hooks BEFORE any conditional returns
  useLockBodyScroll(!!selectedWord);

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
  }, [toggleFavorite, selectedWord?.id]);

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

  // Memoized derived lists
  const synonymsList = useMemo(() => {
    return (selectedWord?.synonyms || [])?.map((s) => s.value).join(", ") || "";
  }, [selectedWord?.synonyms]);

  const antonymsList = useMemo(() => {
    return (selectedWord?.antonyms || [])?.map((a) => a.value).join(", ") || "";
  }, [selectedWord?.antonyms]);

  const similarWordsList = useMemo(() => {
    return (
      (selectedWord?.similarWords || [])?.map((sw) => sw.value).join(", ") || ""
    );
  }, [selectedWord?.similarWords]);

  const meaningsList = useMemo(() => {
    return selectedWord?.meaning?.join(", ") || "";
  }, [selectedWord?.meaning]);

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
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl max-w-4xl w-full mx-3 shadow-2xl transform transition-all duration-300 border-2 border-gray-700/50 max-h-[90vh] overflow-y-auto"
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
        <p className="text-center mt-8 md:mt-6 lg:mt-6 px-4 ">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full">
            <span className="text-cyan-500 text-lg font-bold">Topic:</span>
            <span className="text-md md:text-lg lg:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 ml-2">
              {selectedWord.topic?.name || ""}
            </span>
          </span>
        </p>
        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-8 mt-4" />
        <div className="flex justify-between items-center px-3 md:px-8 lg:px-8 mt-6 ml-1">
          <h3 className="text-lg md:text-2xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-4">
            <span>Word Details</span>
            <button
              onClick={handlePronounceWord}
              className="text-xl md:text-3xl lg:text-3xl hover:scale-110  hover:text-indigo-400 "
              title="Pronounce"
            >
              🔊
            </button>
            {userLoggedIn &&
              (userInfo.role === "super_admin" ||
                userInfo.role === "admin") && (
                <Link
                  to={`/edit-word/${selectedWord.id}`}
                  className="px-2 md:px-4 lg:px-4 py-1 md:py-2 lg:py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-full font-semibold text-white text-xs md:text-sm lg:text-sm transition-all duration-200 hover:scale-105 shadow-md"
                >
                  ✏️ Edit
                </Link>
              )}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mx-1 md:mx-2 lg:mx-2 px-1 md:px-6 lg:px-6 mt-4">
          <div className="space-y-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-4 rounded-2xl border border-gray-700/30">
            <p className="text-sm md:text-lg lg:text-lg">
              <span className="text-blue-400 font-semibold">Word:</span>{" "}
              <span className="mr-2 font-bold text-orange-400 text-center text-md md:text-xl lg:text-xl">
                {selectedWord.article?.name}
              </span>
              <span className="capitalize text-white font-bold text-sm md:text-xl lg:text-xl">
                {capitalizedWord}
              </span>
            </p>
            <p className="text-sm md:text-lg lg:text-lg">
              <span className="text-blue-400 font-semibold">Meaning:</span>{" "}
              <span className="text-gray-300 font-medium">{meaningsList}</span>
            </p>

            {selectedWord.pluralForm && (
              <p className="text-sm md:text-lg lg:text-lg">
                <span className="text-blue-400 font-semibold">Plural:</span>{" "}
                {selectedWord.pluralForm && (
                  <>
                    <span className="font-bold text-orange-400 text-md md:text-xl lg:text-xl">
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
              <p className="text-sm md:text-lg lg:text-lg">
                <span className="text-blue-400 font-semibold capitalize">
                  Synonyms:
                </span>{" "}
                <span className="text-gray-300 font-medium">
                  {synonymsList}
                </span>
              </p>
            )}

            {(selectedWord.antonyms?.length || 0) > 0 && (
              <p className="text-sm md:text-lg lg:text-lg ">
                <span className="text-blue-400 font-semibold capitalize">
                  Antonyms:
                </span>{" "}
                <span className="text-gray-300 font-medium">
                  {antonymsList}
                </span>
              </p>
            )}

            {(selectedWord.similarWords?.length || 0) > 0 && (
              <p className="text-sm md:text-lg lg:text-lg ">
                <span className="text-blue-400 font-semibold">
                  Word to Watch:
                </span>{" "}
                <span className="text-gray-300 font-medium">
                  {similarWordsList}
                </span>
              </p>
            )}

            <p className="text-sm md:text-lg lg:text-lg">
              <span className="text-blue-400 font-semibold">Level:</span>{" "}
              <span className="inline-block px-2  md:px-3 lg:px-3 py-1  bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-bold text-xs md:text-sm lg.md:text-sm">
                {selectedWord.level?.level || ""}
              </span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-2 md:p-4 lg:p-4 rounded-2xl border border-gray-700/30 ">
            <p className="text-md md:text-lg lg:text-lg text-green-400 font-semibold mb-3">
              📝 Sentences:
            </p>
            {(selectedWord.sentences?.length || 0) > 0 ? (
              <ul className="space-y-2 ">
                {(selectedWord.sentences || []).map((sentence, index) => (
                  <SentenceRenderer
                    key={`${selectedWord.id}-${index}`}
                    sentence={sentence}
                    index={index}
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

        <div className="sticky bottom-0 right-2 flex justify-end pr-2 pb-2 mt-6">
          <button
            onClick={handleCloseModal}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 p-1 rounded-full transition-all duration-200 hover:scale-110 shadow-xl hover:shadow-red-500/50"
            title="Close"
          >
            <RiCloseCircleFill size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(WordListModal);
