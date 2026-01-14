import React, { useState } from "react";
import stories from "./stories.json";
import Container from "../../utils/Container";
import { pronounceWord } from "../../utils/wordPronounciation";

// Modal component for word meaning
const Modal = ({ word, meaning, onClose }) => {
  return (
    // <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
      <div className="px-4 py-2 rounded-lg shadow-lg md:w-1/5 bg-white">
        <h3 className="text-2xl font-bold text-pink-600 font-mono text-center flex items-center justify-center gap-2">
          {word}
          <button
            onClick={() => pronounceWord(word)}
            className="text-blue-600 hover:text-blue-800"
            title="Pronounce"
          >
            🔊
          </button>
        </h3>
        <hr />
        <p className="text-xl text-cyan-700 mb-2">{meaning}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="btn btn-sm btn-warning">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Stories = () => {
  // const { title, image, description, passage_vocabulary, vocabulary } =
  //   stories[0]; // Access first story in array
  const [selectedWord, setSelectedWord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (word, meaning) => {
    setSelectedWord({ word, meaning });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const underlineText = (text, passage_vocabulary) => {
    const words = text.split(" ");
    const processedWords = new Set();

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\wäöüß]/g, "");
      const matchedWord = passage_vocabulary.find(
        (item) =>
          cleanWord === item.word.toLowerCase() &&
          !processedWords.has(cleanWord)
      );

      if (matchedWord) {
        processedWords.add(cleanWord);
        return (
          <span
            key={index}
            className="cursor-pointer border-b text-orange-500"
            onClick={() => openModal(matchedWord.word, matchedWord.meaning)}
          >
            {word}{" "}
          </span>
        );
      }

      return word + " ";
    });
  };

  return (
    <Container>
      <div className="min-h-screen p-4 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-black/50">
        {/* Header Section */}
        <div className="text-center mb-12 mt-8">
          <div className="mb-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
              📗 Read & Learn
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-4">
            German Stories
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Immerse yourself in engaging stories to enhance reading skills
          </p>
          <div className="flex justify-center mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        <div className="text-2xl text-white p-1 md:p-4">
          {stories.map(
            (
              { title, image, description, vocabulary, passage_vocabulary },
              index
            ) => (
              <div
                key={index}
                className={`mb-12 ${
                  index === stories.length - 1 ? "" : "border-b border-dotted"
                } border-cyan-950 p-1 md:p-4 flex justify-center items-center flex-col mt-4`}
              >
                {/* Title */}
                <h2 className="text-3xl font-bold mb-12">{title}</h2>

                {/* Image */}
                <img
                  src={image}
                  alt={title}
                  className="mb-4 w-96 md:w-6/12 h-auto object-cover rounded-lg "
                />

                {/* Description */}
                <p className="text-xl md:text-2xl lg:text-2xl text-white text-justify mb-6 w-full md:w-8/12 bg-gray-900/60 backdrop-blur-sm border border-gray-700/30 p-6 rounded-2xl shadow-xl">
                  {underlineText(description.text, passage_vocabulary)}
                </p>

                {/* Vocabulary List */}
                <div className="text-lg w-full md:w-8/12 my-12 ">
                  <h3 className="font-bold mb-2 uppercase">Vocabulary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    {vocabulary.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-between gap-2 justify-start p-3 bg-gray-800/40 backdrop-blur-sm border border-gray-700/40 rounded-xl shadow-lg hover:border-orange-500/40 transition-all duration-300"
                      >
                        <div className="text-orange-500 font-bold flex justify-between">
                          <span> {item.word}</span>
                          <div
                            onClick={() => pronounceWord(item.word)}
                            className=" text-blue-600 hover:text-blue-800 ml-2 cursor-pointer"
                            title="Pronounce"
                          >
                            🔊
                          </div>
                        </div>
                        <span className="  text-white">{item.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          word={selectedWord.word}
          meaning={selectedWord.meaning}
          onClose={closeModal}
        />
      )}
    </Container>
  );
};

export default Stories;
