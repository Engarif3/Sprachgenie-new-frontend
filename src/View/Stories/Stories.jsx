// import React, { useState } from "react";
// import stories from "./stories.json";
// import Container from "../../utils/Container";

// const Modal = ({ word, meaning, onClose }) => {
//   return (
//     <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
//       <div className="px-4 py-2 rounded-lg shadow-lg md:w-1/5 lg:md:w-1/5 bg-white">
//         <h3 className="text-2xl font-bold  text-pink-600 font-mono text-center">
//           {word}
//         </h3>
//         <hr />
//         <p className="text-xl  text-cyan-700 mb-2">{meaning}</p>
//         <div className="flex justify-end">
//           <button onClick={onClose} className="btn btn-sm btn-warning">
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Stories = () => {
//   const { title, image, description, passage_vocabulary, vocabulary } = stories;
//   const [selectedWord, setSelectedWord] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);

//   const openModal = (word, meaning) => {
//     setSelectedWord({ word, meaning });
//     setModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//   };

//   // Function to underline the words that are in the passage_vocabulary list
//   const underlineText = (text) => {
//     const words = text.split(" ");
//     const processedWords = new Set();

//     // Split the text into words and map through them to underline matching words
//     const updatedText = words.map((word, index) => {
//       const cleanWord = word.toLowerCase().replace(/[^\wäöüß]/g, ""); // Clean word for matching
//       const matchedWord = passage_vocabulary.find(
//         (item) =>
//           cleanWord === item.word.toLowerCase() &&
//           !processedWords.has(cleanWord)
//       );

//       if (matchedWord) {
//         processedWords.add(cleanWord); // Mark word as processed
//         return (
//           <span
//             key={index}
//             // className="underline cursor-pointer text-orange-600"
//             className=" cursor-pointer border-b text-orange-500"
//             onClick={() => openModal(matchedWord.word, matchedWord.meaning)}
//           >
//             {word}{" "}
//           </span>
//         );
//       }

//       // If no match, just return the word
//       return word + " ";
//     });

//     return updatedText;
//   };

//   return (
//     <Container>
//       <div className="min-h-screen flex flex-col justify-center items-center text-2xl text-slate-950 p-4">
//         {/* Story Title */}
//         <h2 className="text-3xl font-bold mb-12">{title}</h2>

//         {/* Story Image */}
//         <img
//           src={image}
//           alt={title}
//           className="mb-4 w-96 md:w-4/12 lg:w-4/12 h-auto object-cover rounded-lg"
//         />

//         {/* Story Description */}
//         <p className="text-xl text-black text-justify mb-6 w-full   md:w-8/12">
//           {underlineText(description.text)}
//         </p>

//         {/* Vocabulary List */}
//         <div className="text-lg w-full  md:w-8/12 my-12">
//           <h3 className="font-bold mb-2 uppercase">Vocabulary</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 lg.grid-cols-3 ">
//             {vocabulary.map((item, index) => (
//               <button className="btn btn-md m-1 flex justify-start" key={index}>
//                 <span className="text-orange-500 font-bold">
//                   {item.word}{" "}
//                   <span className="text-green-600 font-bold">&rarr;</span>
//                 </span>{" "}
//                 <span> {item.meaning}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Modal for displaying word meaning */}
//       {modalOpen && (
//         <Modal
//           word={selectedWord.word}
//           meaning={selectedWord.meaning}
//           onClose={closeModal}
//         />
//       )}
//     </Container>
//   );
// };

// export default Stories;

// import React, { useState } from "react";
// import stories from "./stories.json";
// import Container from "../../utils/Container";

// const Modal = ({ word, meaning, onClose }) => {
//   return (
//     <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
//       <div className="px-4 py-2 rounded-lg shadow-lg md:w-1/5 lg:md:w-1/5 bg-white">
//         <h3 className="text-2xl font-bold text-pink-600 font-mono text-center">
//           {word}
//         </h3>
//         <hr />
//         <p className="text-xl text-cyan-700 mb-2">{meaning}</p>
//         <div className="flex justify-end">
//           <button onClick={onClose} className="btn btn-sm btn-warning">
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Stories = () => {
//   const [selectedWord, setSelectedWord] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);

//   const openModal = (word, meaning) => {
//     setSelectedWord({ word, meaning });
//     setModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//   };

//   // Refactored to accept passage_vocabulary as argument
//   const underlineText = (text, passage_vocabulary) => {
//     const words = text.split(" ");
//     const processedWords = new Set();

//     const updatedText = words.map((word, index) => {
//       const cleanWord = word.toLowerCase().replace(/[^\wäöüß]/g, "");
//       const matchedWord = passage_vocabulary.find(
//         (item) =>
//           cleanWord === item.word.toLowerCase() &&
//           !processedWords.has(cleanWord)
//       );

//       if (matchedWord) {
//         processedWords.add(cleanWord);
//         return (
//           <span
//             key={index}
//             className="cursor-pointer border-b text-orange-500"
//             onClick={() => openModal(matchedWord.word, matchedWord.meaning)}
//           >
//             {word}{" "}
//           </span>
//         );
//       }

//       return word + " ";
//     });

//     return updatedText;
//   };

//   return (
//     <Container>
//       <div className="min-h-screen flex flex-col justify-center items-center text-2xl text-slate-950 p-4">
//         {stories.map((story, index) => (
//           <div key={index} className="mb-16 w-full flex flex-col items-center">
//             {/* Story Title */}
//             <h2 className="text-3xl font-bold mb-6">{story.title}</h2>

//             {/* Story Image */}
//             <img
//               src={story.image}
//               alt={story.title}
//               className="mb-4 w-96 md:w-4/12 lg:w-4/12 h-auto object-cover rounded-lg"
//             />

//             {/* Story Description */}
//             <p className="text-xl text-black text-justify mb-6 w-full md:w-8/12">
//               {underlineText(story.description.text, story.passage_vocabulary)}
//             </p>

//             {/* Vocabulary List */}
//             <div className="text-lg w-full md:w-8/12 my-12">
//               <h3 className="font-bold mb-2 uppercase">Vocabulary</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
//                 {story.vocabulary.map((item, idx) => (
//                   <button
//                     className="btn btn-md m-1 flex justify-start"
//                     key={idx}
//                     onClick={() => openModal(item.word, item.meaning)}
//                   >
//                     <span className="text-orange-500 font-bold">
//                       {item.word}{" "}
//                       <span className="text-green-600 font-bold">&rarr;</span>
//                     </span>{" "}
//                     <span> {item.meaning}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Modal */}
//       {modalOpen && selectedWord && (
//         <Modal
//           word={selectedWord.word}
//           meaning={selectedWord.meaning}
//           onClose={closeModal}
//         />
//       )}
//     </Container>
//   );
// };

// export default Stories;

import React, { useState } from "react";
import stories from "./stories.json";
import Container from "../../utils/Container";

// Pronunciation function using Web Speech API
const pronounceWord = (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE"; // German pronunciation
  speechSynthesis.speak(utterance);
};

// Modal component for word meaning
const Modal = ({ word, meaning, onClose }) => {
  return (
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
  const { title, image, description, passage_vocabulary, vocabulary } =
    stories[0]; // Access first story in array
  const [selectedWord, setSelectedWord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (word, meaning) => {
    setSelectedWord({ word, meaning });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Underline words in passage_vocabulary and make them clickable
  const underlineText = (text) => {
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
      <div className="min-h-screen flex flex-col justify-center items-center text-2xl text-slate-950 p-4">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-12">{title}</h2>

        {/* Image */}
        <img
          src={image}
          alt={title}
          className="mb-4 w-96 md:w-4/12 h-auto object-cover rounded-lg"
        />

        {/* Description */}
        <p className="text-xl text-black text-justify mb-6 w-full md:w-8/12">
          {underlineText(description.text)}
        </p>

        {/* Vocabulary List */}
        <div className="text-lg w-full md:w-8/12 my-12">
          <h3 className="font-bold mb-2 uppercase">Vocabulary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {vocabulary.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-start p-2 bg-gray-100 rounded shadow"
              >
                <span className="text-orange-500 font-bold mr-2">
                  {item.word}
                  <button
                    onClick={() => pronounceWord(item.word)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    title="Pronounce"
                  >
                    🔊
                  </button>
                </span>
                <span className="ml-2 text-gray-800">{item.meaning}</span>
              </div>
            ))}
          </div>
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
