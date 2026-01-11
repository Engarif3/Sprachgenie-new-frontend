import { useRef, useCallback, useMemo, memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLockBodyScroll } from "./ModalScrolling";
import { IoMdArrowDropright } from "react-icons/io";

// Memoized sentence renderer component
const SentenceRenderer = memo(({ sentence, index }) => {
  const trimmed = sentence.trim();
  let className = "text-gray-600 list-disc text-md md:text-lg lg:text-lg";
  let cleanSentence = sentence;

  // Determine styling and clean sentence
  if (trimmed.startsWith("##")) {
    className =
      "font-semibold text-cyan-700 list-none w-full text-center underline capitalize ";
    cleanSentence = sentence.replace(/^##\s*/, "");
  } else if (trimmed.startsWith("**")) {
    className = "text-green-600 list-none text-sm first-letter:uppercase";
    cleanSentence = sentence
      .replace(/^\*\*\s*/, "-")
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
            className="text-blue-600 hover:text-blue-800"
            title="Pronounce"
          >
            🔊
          </button>
          <span>
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
      className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 "
      onClick={handleBackgroundClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg  max-w-4xl w-full mx-3  shadow-2xl transform transition-all duration-300 scale-105  border max-h-[90vh] overflow-y-auto "
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
        <p className=" text-sky-600 text-center  mt-8 md:mt-4 lg:mt-4">
          <span className="text-orange-500 text-3xl font-bold">Topic:</span>{" "}
          <span className="text-3xl font-bold">
            {" "}
            {selectedWord.topic?.name || ""}
          </span>
        </p>
        <hr className="border-0 border-b border-cyan-800  border-dashed  mx-8  mt-2" />
        <div className="flex justify-between items-center px-3 md:px-8 lg:px-8 mt-4">
          <h3 className="text-xl font-semibold text-gray-800 text-center flex items-center gap-4">
            <span>Word Details</span>
            <button
              onClick={handlePronounceWord}
              className="text-blue-600 hover:text-blue-800"
              title="Pronounce"
            >
              🔊
            </button>
            {userLoggedIn &&
              (userInfo.role === "super_admin" ||
                userInfo.role === "admin") && (
                <Link
                  to={`/edit-word/${selectedWord.id}`}
                  className="btn btn-sm btn-warning"
                >
                  Edit
                </Link>
              )}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6  mx-2 px-1  md:px-6 lg:px-6 ">
          <div className="">
            <p className="text-lg  text-gray-700">
              <span className=" text-sky-600  font-medium">Word:</span>{" "}
              <span className=" mr-2 font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
                {selectedWord.article?.name}
              </span>
              <span className="capitalize text-rose-900 font-bold">
                {capitalizedWord}
              </span>
            </p>
            <p className="text-lg text-gray-600">
              <span className=" text-sky-600 font-medium">Meaning:</span>{" "}
              <span className="text-md md:text-lg lg:text-lg">
                {" "}
                {meaningsList}{" "}
              </span>
            </p>

            {selectedWord.pluralForm && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium">Plural:</span>{" "}
                {selectedWord.pluralForm && (
                  <>
                    <span className=" font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
                      die
                    </span>{" "}
                    {capitalizedPluralForm}
                  </>
                )}
              </p>
            )}

            {(selectedWord.synonyms?.length || 0) > 0 && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium capitalize">
                  Synonyms:
                </span>{" "}
                <span className="italic text-stone-950"> {synonymsList} </span>
              </p>
            )}

            {(selectedWord.antonyms?.length || 0) > 0 && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium capitalize">
                  Antonyms:
                </span>{" "}
                <span className="italic text-stone-950"> {antonymsList} </span>
              </p>
            )}

            {(selectedWord.similarWords?.length || 0) > 0 && (
              <p className="text-lg text-gray-600 capitalize">
                <span className=" text-sky-600 font-medium">
                  Word to Watch:
                </span>{" "}
                <span className="italic text-stone-950">
                  {similarWordsList}
                </span>
              </p>
            )}

            <p className="text-lg text-gray-600">
              <span className=" text-sky-600 font-medium">Level:</span>{" "}
              <span className="text-xs bg-stone-950 rounded py-[1px] px-[3px] text-white font-semibold ">
                {" "}
                {selectedWord.level?.level || ""}{" "}
              </span>
            </p>
          </div>
          <div className="text-lg text-gray-600">
            <span className=" text-sky-600 font-medium">Sentences:</span>
            {(selectedWord.sentences?.length || 0) > 0 ? (
              <ul className=" space-y-2 list-disc">
                {(selectedWord.sentences || []).map((sentence, index) => (
                  <SentenceRenderer
                    key={`${selectedWord.id}-${index}`}
                    sentence={sentence}
                    index={index}
                  />
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No sentences available.</span>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 right-2 flex justify-end pr-2  text-red-500">
          <RiCloseCircleFill
            onClick={handleCloseModal}
            size={40}
            className="hover:text-rose-700 transition-transform duration-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default memo(WordListModal);
