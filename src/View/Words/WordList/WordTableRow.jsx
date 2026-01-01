import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { pronounceWord } from "../../../utils/wordPronounciation";
import FavoriteButton from "../Modals/FavoriteButton";
import { PuffLoader } from "react-spinners";

const WordTableRow = ({
  word,
  index,
  learningMode,
  currentIndex,
  revealedWords,
  showActionColumn,
  userLoggedIn,
  userInfo,
  favorites,
  loadingFavorites,
  loadingParagraphs,
  focusElement,
  revealMeaning,
  openModal,
  generateParagraph,
  handleArrowKeyPress,
  openWordInModal,
  handleDelete,
  toggleFavorite,
  setSelectedHistory,
  setIsHistoryModalOpen,
}) => {
  return (
    <tr key={word.id} className={index % 2 === 0 ? "bg-white " : "bg-gray-300"}>
      {/* Article */}
      <td className=" border-gray-400 p-0 md:p-2 lg:p-2 font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
        {word.article?.name}
      </td>

      {/* Word value */}
      <td className="border-l border-gray-400  p-2 capitalize border-dotted">
        <div className="flex justify-between">
          <span
            tabIndex={learningMode ? 0 : -1}
            ref={learningMode && index === currentIndex ? focusElement : null}
            className="cursor-pointer p-0 md:p-2 lg:p-2 text-blue-500 text-sm md:text-lg lg:text-lg font-bold break-words max-w-[120px] md:max-w-full"
            onClick={() => openModal(word)}
          >
            {word.value}
          </span>

          <div className="flex gap-1 md:gap-4 lg:gap-4 ">
            <button
              onClick={() => pronounceWord(word.value)}
              className=" text-blue-500 hover:text-blue-700 ml-0 md:ml-2 lg:ml-2 "
            >
              🔊
            </button>

            {userLoggedIn && (
              <div
                onClick={() => generateParagraph(word)}
                className="relative border-2 bg-green-700 text-white italic px-2 py-1 text-sm rounded-full mt-4 h-6 w-6 cursor-pointer hover:scale-105 hover:bg-green-600 hover:text-white border-orange-500 "
                disabled={loadingParagraphs[word.id]}
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
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Meaning */}
      <td
        className={`border-l border-gray-400 border-dotted pl-1  p-0 md:p-2 lg:p-2 text-sm md:text-lg lg:text-lg ${
          learningMode && index === currentIndex
            ? "bg-sky-700 text-white font-bold "
            : "text-sky-950 font-serif"
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

      {/* Synonyms */}
      <td className="border-l border-gray-400 border-dotted p-2 text-blue-500  hidden md:table-cell ">
        <div className="flex flex-wrap gap-1">
          {word.synonyms?.map((synonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(synonym.value)}
              className="text-sm sm:text-base btn btn-sm btn-info"
            >
              {synonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Antonyms */}
      <td className="border-l border-gray-400 border-dotted p-2 text-blue-500  hidden lg:table-cell xl:table-cell">
        <div className="flex flex-wrap gap-1">
          {word.antonyms?.map((antonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(antonym.value)}
              className="text-sm sm:text-base btn btn-sm btn-info "
            >
              {antonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Similar Words */}
      <td className="border-l border-gray-400 border-dotted  p-2 text-blue-500  hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {word.similarWords?.map((similarword, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(similarword.value)}
              className="text-sm sm:text-base btn btn-sm btn-info"
            >
              {similarword.value}
            </span>
          ))}
        </div>
      </td>

      {/* Level */}
      <td className="border-l border-r border-gray-400 border-dotted  p-2 hidden md:table-cell text-center">
        <span className="text-base sm:text-lg ">{word.level?.level}</span>
      </td>

      {/* Action */}
      <td
        className={`border-l border-r border-gray-400  p-2 text-center ${
          showActionColumn ? "table-cell" : "hidden"
        } `}
      >
        <div className="flex  gap-1 justify-center">
          <Link
            to={`/edit-word/${word.id}`}
            className="btn btn-sm btn-warning "
          >
            Edit
          </Link>
          <button
            onClick={() => handleDelete(word.id, word.value)}
            className="btn btn-sm btn-error"
          >
            Delete
          </button>
        </div>
      </td>

      {/* Favorite */}
      {userLoggedIn && (
        <td className="border-l border-r border-gray-400 border-dotted p-0 md:p-1 lg:p-1 text-center ">
          <FavoriteButton
            isFavorite={favorites.includes(word.id)}
            loading={loadingFavorites[word.id]}
            onClick={() => toggleFavorite(word.id)}
          />
        </td>
      )}

      {/* History */}
      {userLoggedIn &&
        (userInfo.role === "super_admin" || userInfo.role === "admin") && (
          <td className="border-l border-gray-400 border-dotted p-2 text-center hidden lg:table-cell">
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
