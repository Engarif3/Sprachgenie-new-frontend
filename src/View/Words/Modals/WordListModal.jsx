import { useRef } from "react";
import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "./FavoriteButton";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLockBodyScroll } from "./ModalScrolling";
import { IoMdArrowDropright } from "react-icons/io";

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

  useLockBodyScroll(!!selectedWord);

  if (!selectedWord) return null;

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 ">
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg  max-w-4xl w-full mx-4 shadow-2xl transform transition-all duration-300 scale-105  border max-h-[90vh] overflow-y-auto "
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
              <span className="capitalize text-rose-900 font-bold">
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
                <span className="italic text-stone-950">
                  {" "}
                  {selectedWord.synonyms?.map((s) => s.value).join(", ") ||
                    ""}{" "}
                </span>
              </p>
            )}

            {selectedWord.antonyms.length > 0 && (
              <p className="text-lg text-gray-600">
                <span className=" text-sky-600 font-medium capitalize">
                  Antonyms:
                </span>{" "}
                <span className="italic text-stone-950">
                  {" "}
                  {selectedWord.antonyms?.map((a) => a.value).join(", ") ||
                    ""}{" "}
                </span>
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
                <span className="italic text-stone-950">
                  {selectedWord.similarWords
                    ?.map((sw) => sw.value)
                    .join(", ") || ""}
                </span>
              </p>
            )}

            <p className="text-lg text-gray-600">
              <span className=" text-sky-600 font-medium">Level:</span>{" "}
             <span className="text-xs bg-stone-950 rounded py-[1px] px-[3px] text-white font-semibold"> {selectedWord.level?.level || ""} </span>
            </p>
          </div>
          <div className="text-lg text-gray-600">
            <span className=" text-sky-600 font-medium">Sentences:</span>
            {selectedWord.sentences && selectedWord.sentences.length > 0 ? (
              <ul className=" space-y-2 list-disc">
                {selectedWord.sentences.map((sentence, index) => {
                  const trimmed = sentence.trim();
                  let className = "text-gray-600 list-disc ";
                  let cleanSentence = sentence;

                  // Determine styling and clean sentence
                  if (trimmed.startsWith("##")) {
                    className =
                      "font-semibold text-cyan-700 list-none w-full text-center underline capitalize ";
                    cleanSentence = sentence.replace(/^##\s*/, "");
                  } else if (trimmed.startsWith("**")) {
                    className =
                      "text-green-600 list-none text-sm first-letter:uppercase";
                    cleanSentence = sentence
                      .replace(/^\*\*\s*/, "-")
                      .replace(/\*\*$/, "")
                      .trim();
                  }

                  // Check if the speaker button should be hidden
                  const showSpeakerButton =
                    !trimmed.startsWith("##") && !trimmed.startsWith("**");

                  return (
                    <div
                      key={index}
                      className="text-gray-600 flex  items-start"
                    >
                      {showSpeakerButton && (
                        <span className="flex items-start">
                          <button
                            onClick={() => pronounceWord(cleanSentence)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Pronounce"
                          >
                            🔊
                          </button>
                          <span>
                            <IoMdArrowDropright
                              className="text-pink-600 mt-1"
                              size={20}
                            />
                          </span>
                        </span>
                      )}
                      <span className={className}>{cleanSentence}</span>
                    </div>
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
