import { Link } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import { pronounceWord } from "../../../utils/wordPronounciation";

const WordListModal = ({ closeModal, selectedWord, onEdit }) => {
  if (!selectedWord) return null;
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();

  // const pronounceWord = (word) => {
  //   const utterance = new SpeechSynthesisUtterance(word);
  //   utterance.lang = "de-DE"; // German pronunciation
  //   speechSynthesis.speak(utterance);
  // };

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300  ">
      <div className="bg-white rounded-lg p-2 md:p-8 lg:p-8 max-w-4xl w-full shadow-2xl transform transition-all duration-300 scale-105 m-4 border">
        <p className="text-3xl font-bold text-sky-500 text-center mb-4 border-b border-dashed dark:border-gray-600  ">
          <span className="text-orange-500">Topic:</span>{" "}
          {selectedWord.topic?.name || ""}
        </p>

        <div className="flex justify-between items-center ">
          <h3 className="text-xl font-semibold text-gray-800 text-center flex items-center gap-4">
            <span> Word Details</span>
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
                  // onClick={() => onEdit(selectedWord.id)}
                  className="btn btn-sm btn-warning"
                >
                  Edit
                </Link>
              )}
          </h3>
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
