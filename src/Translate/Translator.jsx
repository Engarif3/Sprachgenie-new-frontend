// import { useState } from "react";

// export default function Translator() {
//   const [input, setInput] = useState("");
//   const [translation, setTranslation] = useState("");

//   // Static German → English dictionary
//   const dictionary = {
//     "Guten Morgen!": "Good morning!",
//     "Wie geht es dir?": "How are you?",
//     "Das Wetter ist heute schön.": "The weather is nice today.",
//     "Ich lerne React.": "I am learning React.",
//     "Ich liebe Programmierung.": "I love programming.",
//   };

//   function translateText() {
//     // Look up the translation in the static dictionary
//     const translated = dictionary[input];
//     if (translated) {
//       setTranslation(translated);
//     } else {
//       setTranslation("Translation not found in static dictionary.");
//     }
//   }

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>German → English Translator (Static)</h2>

//       {/* Dropdown to choose sample text */}
//       <select onChange={(e) => setInput(e.target.value)} value={input}>
//         <option value="">-- Choose a sample text --</option>
//         {Object.keys(dictionary).map((txt, i) => (
//           <option key={i} value={txt}>
//             {txt}
//           </option>
//         ))}
//       </select>

//       <br />
//       <br />

//       {/* Textarea for manual input */}
//       <textarea
//         rows="3"
//         cols="40"
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         placeholder="Or type your own German text..."
//       />
//       <br />
//       <button onClick={translateText}>Translate</button>

//       <p>
//         <b>Translation:</b> {translation}
//       </p>
//     </div>
//   );
// }

import { useState } from "react";
import { IoMdArrowDropright } from "react-icons/io";
import { pronounceWord } from "../utils/wordPronounciation";

const Translator = ({ sentences }) => {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState({});

  async function translateSentence(sentence) {
    if (translations[sentence]) return; // avoid re-translation

    setLoading((prev) => ({ ...prev, [sentence]: true }));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/translate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sentence,
            source: "de",
            target: "en",
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Translation API error:", data);
        throw new Error(data.error || "Translation API error");
      }

      if (!data.data?.translated) {
        console.error("No translation in response:", data);
        throw new Error("No translation received");
      }

      setTranslations((prev) => ({
        ...prev,
        [sentence]: data.data.translated,
      }));
    } catch (err) {
      console.error("Translation failed:", err);
      setTranslations((prev) => ({
        ...prev,
        [sentence]: `❌ ${err.message}`,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [sentence]: false }));
    }
  }

  return (
    <ul className="space-y-2 list-disc">
      {sentences.map((sentence, index) => {
        const trimmed = sentence.trim();
        let className = "text-gray-600 list-disc ";
        let cleanSentence = sentence;

        if (trimmed.startsWith("##")) {
          className =
            "font-semibold text-cyan-700 list-none w-full text-center underline capitalize ";
          cleanSentence = sentence.replace(/^##\s*/, "");
        } else if (trimmed.startsWith("**")) {
          className = "text-green-600 list-none text-sm first-letter:uppercase";
          cleanSentence = sentence
            .replace(/^\*\*\s*/, "-")
            .replace(/\*\*$/, "")
            .trim();
        }

        const showSpeakerButton =
          !trimmed.startsWith("##") && !trimmed.startsWith("**");

        return (
          <div key={index} className="flex items-start gap-2">
            {showSpeakerButton && (
              <button
                onClick={() => pronounceWord(cleanSentence)}
                className="text-blue-600 hover:text-blue-800"
                title="Pronounce"
              >
                🔊
              </button>
            )}
            <span className={className}>{cleanSentence}</span>
            {showSpeakerButton && (
              <button
                onClick={() => translateSentence(cleanSentence)}
                className="text-green-700 hover:text-green-900 text-sm ml-2"
              >
                {loading[sentence] ? "Translating..." : "Translate"}
              </button>
            )}
            {translations[cleanSentence] && (
              <p className="text-gray-500 ml-6 mt-1 italic">
                {translations[cleanSentence]}
              </p>
            )}
          </div>
        );
      })}
    </ul>
  );
};

export default Translator;
