import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { RiCloseCircleFill } from "react-icons/ri";

const WordListModal = ({
  closeModal,
  selectedWord,
  favorites = [],
  toggleFavorite,
  loadingFavorites = {},
}) => {
  const modalRef = useRef(null);

  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  if (!selectedWord) return null;

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300">
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg  max-w-4xl w-full shadow-2xl transform transition-all duration-300 scale-105  border max-h-[90vh] overflow-y-auto "
      >
        {/* Favorite Toggle Button */}

        {userLoggedIn && (
          <FavoriteButton
            isFavorite={favorites.includes(selectedWord.id)}
            loading={loadingFavorites[selectedWord.id]}
            onClick={() => toggleFavorite(selectedWord.id)}
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
        <div className="flex justify-between items-center px-6 mt-4">
          <h3 className="text-xl font-semibold text-gray-800 text-center flex items-center gap-4">
            <span>Word Details</span>
            <button
              onClick={() => pronounceWord(selectedWord.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6  px-6">
          <div className="">
            <p className="text-lg  text-gray-700">
              <span className=" text-sky-600  font-medium">Word:</span>{" "}
              <span className=" mr-2 font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
                {selectedWord.article?.name}
              </span>
              <span className="capitalize">
                {selectedWord.value.charAt(0).toUpperCase() +
                  selectedWord.value.slice(1)}
              </span>
            </p>
            <p className="text-lg text-gray-600">
              <span className=" text-sky-600 font-medium">Meaning:</span>{" "}
              {selectedWord.meaning?.join(", ")}
            </p>

            {selectedWord.synonyms.length > 0 && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium capitalize">
                  Synonyms:
                </span>{" "}
                {selectedWord.synonyms?.map((s) => s.value).join(", ") || ""}
              </p>
            )}

            {selectedWord.antonyms.length > 0 && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium capitalize">
                  Antonyms:
                </span>{" "}
                {selectedWord.antonyms?.map((a) => a.value).join(", ") || ""}
              </p>
            )}

            {selectedWord.pluralForm && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium">Plural:</span>{" "}
                {selectedWord.pluralForm && (
                  <>
                    <span className=" font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
                      die
                    </span>{" "}
                    {selectedWord.pluralForm.charAt(0).toUpperCase() +
                      selectedWord.pluralForm.slice(1)}
                  </>
                )}
              </p>
            )}

            {selectedWord.similarWords.length > 0 && (
              <p className="text-lg text-gray-600 capitalize">
                <span className=" text-sky-600 font-medium">
                  Word to Watch:
                </span>{" "}
                {selectedWord.similarWords?.map((sw) => sw.value).join(", ") ||
                  ""}
              </p>
            )}

            <p className="text-lg text-gray-600">
              <span className=" text-sky-600 font-medium">Level:</span>{" "}
              {selectedWord.level?.level || ""}
            </p>
          </div>
          <div className="text-lg text-gray-600">
            <span className=" text-sky-600 font-medium">Sentences:</span>
            {selectedWord.sentences && selectedWord.sentences.length > 0 ? (
              <ul className="pl-5 space-y-2 list-disc">
                {selectedWord.sentences.map((sentence, index) => {
                  const trimmed = sentence.trim();
                  let className = "text-gray-600 list-disc";
                  let cleanSentence = sentence;

                  if (trimmed.startsWith("##")) {
                    className =
                      "font-semibold text-cyan-700 list-none text-center underline capitalize";
                    cleanSentence = sentence.replace(/^(\#\#|)\s*/, "");
                  } else if (trimmed.startsWith("**")) {
                    className =
                      " text-green-600 list-none text-sm first-letter:uppercase";
                    cleanSentence = sentence
                      .replace(/^\*\*\s*/, "-")
                      .replace(/\*\*$/, "")
                      .trim();
                  }

                  return (
                    <li key={index} className={className}>
                      {cleanSentence}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <span className="text-gray-400">No sentences available.</span>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 right-2 flex justify-end pr-2  text-red-700">
          <RiCloseCircleFill
            onClick={closeModal}
            size={50}
            className="hover:text-red-500 transition-transform duration-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default WordListModal;
