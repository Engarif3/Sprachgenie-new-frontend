import { useEffect, useState } from "react";
import verbsData from "./VerbsWithGehen.json";
import Container from "../../../utils/Container";
import { useLockBodyScroll } from "../../Words/Modals/ModalScrolling";
import { IoClose } from "react-icons/io5";

const VerbSentencesModal = ({ verb, onClose }) => {
  useLockBodyScroll(!!verb);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!verb) return null;

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold text-pink-600">{verb.word}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Close"
          >
            <IoClose aria-hidden="true" />
          </button>
        </div>
        <p className="mb-4 text-gray-700 dark:text-white">{verb.meaning}</p>
        <div className="space-y-2 text-gray-700 dark:text-white">
          <p>
            <span className="font-semibold text-pink-600">Present:</span>{" "}
            {verb.sentences.present}
          </p>
          <p>
            <span className="font-semibold text-pink-600">Past:</span>{" "}
            {verb.sentences.past}
          </p>
          <p>
            <span className="font-semibold text-pink-600">Perfect:</span>{" "}
            {verb.sentences.perfect}
          </p>
          <p>
            <span className="font-semibold text-pink-600">Modal:</span>{" "}
            {verb.sentences.modal}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function VerbsWithGehen() {
  const [selectedVerb, setSelectedVerb] = useState(null);

  return (
    <Container>
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
        Verbs ending with "-gehen"
      </h1>

      {/* Section 1: List of all words — click one to see its sentences */}

      <div className="grid grid-cols-2 md:grid-cols-12 lg:grid-cols-12 justify-center items-center gap-1 md:gap-2 lg:gap.2 text-gray-700 m-1 md:m-4 lg:m-4">
        {verbsData.words.map((verb) => (
          <button
            key={verb.word}
            type="button"
            onClick={() => setSelectedVerb(verb)}
            className="btn btn-sm font-semibold"
            title={`Show sentences for "${verb.word}"`}
          >
            {verb.word}
          </button>
        ))}
      </div>

      {/* Section 2: Each word with four sentences */}
      <div className="m-1 md:m-4 lg:m-4">
        <h2 className="text-2xl font-semibold mb-4 text-orange-600">
          Sentences
        </h2>
        <div className="space-y-6 mb-8">
          {verbsData.words.map((verb) => (
            <div
              key={verb.word}
              className="rounded-lg border p-4 shadow-sm hover:shadow-md transition "
            >
              <h3 className="text-xl font-semibold mb-2 text-pink-600">
                {verb.word}
              </h3>
              <p className="text-gray-700 dark:text-white mb-3">{verb.meaning}</p>
              <div className="space-y-1 text-gray-700 dark:text-white">
                <p>
                  <span className="font-semibold text-pink-600">Present:</span>{" "}
                  {verb.sentences.present}
                </p>
                <p>
                  <span className="font-semibold text-pink-600">Past:</span>{" "}
                  {verb.sentences.past}
                </p>
                <p>
                  <span className="font-semibold text-pink-600">Perfect:</span>{" "}
                  {verb.sentences.perfect}
                </p>
                <p>
                  <span className="font-semibold text-pink-600">Modal:</span>{" "}
                  {verb.sentences.modal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <VerbSentencesModal
        verb={selectedVerb}
        onClose={() => setSelectedVerb(null)}
      />
    </Container>
  );
}
