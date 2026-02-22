import React, { useCallback } from "react";
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
      className={`transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-purple-500/5 ${
        index % 2 === 0 ? "bg-gray-800/40" : "bg-gray-900/40"
      }`}
    >
      {/* Article */}
      <td className="border border-gray-700 border-dotted p-1 md:p-3 lg:p-3 font-bold text-orange-400 text-center text-xs md:text-lg lg:text-lg">
        {word.article?.name}
      </td>

      {/* Word value */}
      {/* Previous version with CSS capitalize - capitalizes every word */}
      {/* <td className="border-l border-gray-400  p-2 capitalize border-dotted"> */}
      <td className="border border-gray-700 border-dotted p-1 md:p-3">
        <div className="flex justify-between">
          <span
            tabIndex={learningMode ? 0 : -1}
            ref={learningMode && index === currentIndex ? focusElement : null}
            className="cursor-pointer p-0 md:p-2 lg:p-2 text-blue-400 hover:text-blue-300 text-sm md:text-lg lg:text-lg font-semibold md:font-bold lg:font-bold break-words max-w-[120px] md:max-w-full transition-colors duration-200"
            onClick={() => openModal(word)}
          >
            {/* Previous version - used CSS capitalize */}
            {/* {word.value} */}
            {capitalizeFirstLetter(word.value)}
          </span>

          <div className="flex gap-1 md:gap-4 lg:gap-4 ">
            <button
              onClick={() => pronounceWord(word.value)}
              className="text-md md:text-2xl lg:text-2xl hover:scale-110 transition-transform duration-200 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              title="Pronounce word"
            >
              🔊
            </button>

            {userLoggedIn ? (
              <div
                onClick={() => generateParagraph(word)}
                className="relative border-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full mt-4 h-6 w-6 cursor-pointer hover:scale-110 border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-green-500/50"
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
            ) : (
              <div
                onClick={handleAIGenerationLocked}
                className="relative border-2 bg-gradient-to-r from-gray-500 to-gray-500 text-gray-100 italic px-2 py-1 text-xs font-semibold md:font-bold lg:font-bold rounded-full mt-4 h-6 w-6 cursor-pointer border-gray-400 hover:from-gray-400 hover:to-gray-400 transition-all duration-200"
                title="Sign in to generate paragraphs"
              >
                <span className="flex items-center justify-center relative bottom-1">
                  ai
                </span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Meaning */}
      <td
        className={`border border-gray-700 border-dotted pl-1 p-0 md:p-3 lg:p-3 text-sm md:text-lg lg:text-lg ${
          learningMode && index === currentIndex
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold"
            : "text-cyan-300 font-serif"
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
      <td className="border border-gray-700 border-dotted p-2 md:p-3 text-blue-400 hidden md:table-cell">
        <div className="flex flex-wrap gap-2">
          {word.synonyms?.map((synonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(synonym.value)}
              className="text-md px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-full hover:from-blue-500/30 hover:to-cyan-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {synonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Antonyms */}
      <td className="border border-gray-700 border-dotted p-2 md:p-3 text-blue-400 hidden lg:table-cell xl:table-cell">
        <div className="flex flex-wrap gap-2">
          {word.antonyms?.map((antonym, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(antonym.value)}
              className="text-md  px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-full hover:from-red-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {antonym.value}
            </span>
          ))}
        </div>
      </td>

      {/* Similar Words */}
      <td className="border border-gray-700 border-dotted p-2 md:p-3 text-blue-400 hidden lg:table-cell">
        <div className="flex flex-wrap gap-2">
          {word.similarWords?.map((similarword, idx) => (
            <span
              key={idx}
              onClick={() => openWordInModal(similarword.value)}
              className="text-md  px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full hover:from-purple-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
            >
              {similarword.value}
            </span>
          ))}
        </div>
      </td>

      {/* Level */}
      <td className="border border-gray-700 border-dotted p-2 md:p-3 hidden md:table-cell text-center">
        <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-xs sm:text-sm">
          {word.level?.level}
        </span>
      </td>

      {/* Action */}
      <td
        className={`border border-gray-700 border-dotted p-2 md:p-3 text-center ${
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
      <td className="border border-gray-700 border-dotted p-0 md:p-3 text-center">
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
      {userLoggedIn &&
        (userInfo.role === "super_admin" || userInfo.role === "admin") && (
          <td className="border border-gray-700 border-dotted p-2 md:p-3 text-center hidden md:table-cell lg:table-cell">
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
