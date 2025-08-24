import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";

const WordListModal = ({ closeModal, selectedWord }) => {
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
        className="bg-white rounded-lg p-2 md:p-8 max-w-4xl w-full shadow-2xl transform transition-all duration-300 scale-105 m-4 border max-h-[90vh] overflow-y-auto"
      >
        <p className="text-3xl font-bold text-sky-500 text-center mb-4 border-b border-dashed">
          <span className="text-orange-500">Topic:</span>{" "}
          {selectedWord.topic?.name || ""}
        </p>

        <div className="flex justify-between items-center">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 p-2 md:p-4">
          <p className="text-lg font-medium text-gray-700">
            <span className="font-bold text-sky-500">Word:</span>{" "}
            <span className="capitalize">{selectedWord.value}</span>
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500 capitalize">Synonyms:</span>{" "}
            {selectedWord.synonyms?.map((s) => s.value).join(", ") || ""}
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Meaning:</span>{" "}
            {selectedWord.meaning?.join(", ")}
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500 capitalize">Antonyms:</span>{" "}
            {selectedWord.antonyms?.map((a) => a.value).join(", ") || ""}
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Plural:</span>{" "}
            {selectedWord.pluralForm || ""}
          </p>
          <p className="text-lg text-gray-600 capitalize">
            <span className="font-bold text-sky-500">Deceptive Word:</span>{" "}
            {selectedWord.similarWords?.map((sw) => sw.value).join(", ") || ""}
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Level:</span>{" "}
            {selectedWord.level?.level || ""}
          </p>
          {/* <div className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Sentences:</span>
            {selectedWord.sentences && selectedWord.sentences.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {selectedWord.sentences.map((sentence, index) => (
                  <li key={index} className="text-gray-600">
                    {sentence}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No sentences available.</span>
            )}
          </div> */}
          <div className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Sentences:</span>
            {selectedWord.sentences && selectedWord.sentences.length > 0 ? (
              <ul className="pl-5 space-y-2 list-disc">
                {selectedWord.sentences.map((sentence, index) => {
                  const trimmed = sentence.trim();

                  let isSpecial = false;
                  let className = "text-gray-600 list-disc";
                  let cleanSentence = sentence;

                  if (trimmed.startsWith("##")) {
                    isSpecial = true;
                    className =
                      "font-semibold text-cyan-700 list-none text-center underline capitalize";
                    cleanSentence = sentence.replace(/^(\#\#|)\s*/, "");
                  } else if (trimmed.startsWith("**")) {
                    isSpecial = true;
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

        <div className="mt-8 flex justify-center">
          <button
            onClick={closeModal}
            className="btn btn-wide bg-[#ff000d] font-semibold text-xl text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordListModal;
