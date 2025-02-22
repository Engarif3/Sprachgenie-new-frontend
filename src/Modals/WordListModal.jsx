import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

const WordListModal = ({ closeModal, selectedWord, onEdit }) => {
  if (!selectedWord) return null;
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300  ">
      <div className="bg-white rounded-lg p-2 md:p-8 lg.p-8 max-w-4xl w-full shadow-2xl transform transition-all duration-300 scale-105 m-4">
        <p className="text-3xl font-bold text-sky-500 text-center mb-4 border-b border-dashed dark:border-gray-600  ">
          <span className="text-orange-500">Topic:</span>{" "}
          {selectedWord.topic?.name || ""}
        </p>

        <div className="flex justify-between items-center ">
          <h3 className="text-xl font-semibold text-gray-800 text-center flex items-center gap-4">
            <span> Word Details</span>
            {userLoggedIn && userInfo.role === "super_admin" && (
              <Link
                to={`/edit-word/${selectedWord.id}`}
                // onClick={() => onEdit(selectedWord.id)}
                className="btn btn-sm btn-warning"
              >
                Edit
              </Link>
            )}
          </h3>

          {/* <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.293 4.293a1 1 0 011.414 0L10 6.586l2.293-2.293a1 1 0 111.414 1.414L11.414 8l2.293 2.293a1 1 0 11-1.414 1.414L10 9.414l-2.293 2.293a1 1 0 11-1.414-1.414L8.586 8 6.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 lg.gap-6  p-2 md:p-4 lg:p-4">
          <p className="text-lg font-medium text-gray-700">
            <span className="font-bold text-sky-500">Word:</span>{" "}
            <span className="capitalize">{selectedWord.value}</span>
          </p>

          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500 capitalize">Synonyms:</span>{" "}
            {selectedWord.synonyms
              ?.map((synonym) => synonym.value)
              .join(", ") || ""}
          </p>
          {/* <p className="text-lg text-gray-600">
            <span className="font-bold">Article:</span>{" "}
            {selectedWord.article ? selectedWord.article.name : ""}
          </p> */}
          <p className="text-lg text-gray-600">
            <span className="font-bold text-sky-500">Meaning:</span>{" "}
            {selectedWord.meaning?.join(", ")}
          </p>

          {/* <p className="text-lg text-gray-600">
            <span className="font-bold">Part of Speech:</span>{" "}
            {selectedWord.partOfSpeech?.name}
          </p> */}
          <p className="text-lg text-gray-600 ">
            <span className="font-bold text-sky-500 capitalize">Antonyms:</span>{" "}
            {selectedWord.antonyms
              ?.map((antonym) => antonym.value)
              .join(", ") || ""}
          </p>
          <p className="text-lg text-gray-600 ">
            <span className="font-bold text-sky-500">Plural:</span>{" "}
            {selectedWord.pluralForm ? selectedWord.pluralForm : ""}
          </p>

          <p className="text-lg text-gray-600 capitalize">
            <span className="font-bold text-sky-500">Deceptive Word:</span>{" "}
            {selectedWord.similarWords
              ?.map((similarword) => similarword.value)
              .join(", ") || ""}
          </p>
          <p className="text-lg text-gray-600 ">
            <span className="font-bold text-sky-500">Level:</span>{" "}
            {selectedWord.level?.level || ""}
          </p>
          <p className="text-lg text-gray-600">
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
              <span className="text-gray-400"> No sentences available.</span>
            )}
          </p>
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
