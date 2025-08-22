import { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import Container from "../../../../utils/Container";
import conjunctionData from "./coordinating.json";

const CoordinatingConjunction = () => {
  const [expandedWords, setExpandedWords] = useState({});

  const toggleExpand = (conjunction) => {
    setExpandedWords((prev) => ({
      ...prev,
      [conjunction]: !prev[conjunction],
    }));
  };

  const highlightConjunctions = (sentence, conjunction) => {
    const conjunctionParts = conjunction.conjunction
      .split(" … ")
      .map((part) => part.trim().toLowerCase().split(/\s+/));

    // Split into tokens while preserving original formatting
    const tokens = sentence.split(/(\s+)/).map((token, index) => ({
      original: token,
      clean: token
        .replace(/[.,!?;:()]/g, "")
        .toLowerCase()
        .trim(),
      index,
      isWhitespace: /^\s+$/.test(token),
    }));

    // Filter out whitespace for sequence checking
    const nonWhitespaceTokens = tokens.filter((t) => !t.isWhitespace);
    const highlightedIndices = new Set();

    // Check each conjunction part
    conjunctionParts.forEach((part) => {
      const partLength = part.length;
      for (let i = 0; i <= nonWhitespaceTokens.length - partLength; i++) {
        const sequence = nonWhitespaceTokens
          .slice(i, i + partLength)
          .map((t) => t.clean);

        if (sequence.join(" ") === part.join(" ")) {
          nonWhitespaceTokens
            .slice(i, i + partLength)
            .forEach((t) => highlightedIndices.add(t.index));
        }
      }
    });

    // Rebuild sentence with highlighting
    return tokens.map((token, index) =>
      highlightedIndices.has(token.index) ? (
        <span key={index} className="text-sky-700 font-bold">
          {token.original}
        </span>
      ) : (
        token.original
      )
    );
  };

  const renderExamples = (examples, conjunction) => (
    <ul className="list-disc list-inside mt-1 space-y-1 ml-1 border-l-8 border-pink-600">
      {examples.map((example, idx) => (
        <li key={idx} className="normal-case ml-2">
          {highlightConjunctions(example, conjunction)}
        </li>
      ))}
    </ul>
  );

  return (
    <Container>
      <div className="max-w-4xl min-h-screen mx-auto p-4">
        <h2 className="text-3xl font-bold font-mono text-center text-white mb-4">
          Coordinating Conjunctions
        </h2>
        <p className="text-lg text-center my-12 text-white">
          These conjunctions do not affect the word order (verb position) in the
          sentence.
        </p>
        <h4 className="p-3 text-xl font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600   text-white rounded-t-md">
          <span className="ml-4"> Nebenordnende Konjunktionen</span>
        </h4>
        {conjunctionData.map((item, index) => (
          <div key={index} className="">
            <div
              className={`flex justify-between items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 border ${
                index !== conjunctionData.length - 1
                  ? "border-b border-dotted border-b-sky-400"
                  : ""
              }`}
              onClick={() => toggleExpand(item.conjunction)}
            >
              <div className="text-stone-950">
                <span className="font-medium text-lg uppercase ml-4">
                  {item.conjunction} -
                </span>
                <span className="ml-2 text-lg">({item.meaning})</span>
              </div>
              <button className="text-sky-700">
                {expandedWords[item.conjunction] ? <FaMinus /> : <FaPlus />}
              </button>
            </div>
            {expandedWords[item.conjunction] && (
              <div className="p-3 bg-gray-50 text-gray-700">
                <button className="font-semibold capitalize btn btn-sm bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 text-white">
                  Examples
                </button>
                {/* {renderExamples(item.examples)} */}
                {renderExamples(item.examples, item)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
};

export default CoordinatingConjunction;
