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

    const colorClass = `text-${conjunction.color} font-bold`;

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
        <span key={index} className={colorClass}>
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
        <h2 className="text-3xl font-bold font-mono text-center text-sky-700 mb-4">
          Coordinating Conjunctions
        </h2>
        <p className="text-lg text-center my-12">
          These conjunctions do not affect the word order (verb position) in the
          sentence.
        </p>
        <h4 className="p-3 text-xl font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 text-white rounded-t-md">
          <span className="ml-4">Nebenordnende Konjunktionen</span>
        </h4>
        {conjunctionData.map((item, index) => (
          <div key={index}>
            <div
              className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md shadow-md cursor-pointer"
              onClick={() => toggleExpand(item.conjunction)}
            >
              <h4 className="text-lg font-medium text-sky-600">
                {item.conjunction}
              </h4>
              <div>
                {expandedWords[item.conjunction] ? <FaMinus /> : <FaPlus />}
              </div>
            </div>

            {expandedWords[item.conjunction] && (
              <div className="p-4 border border-gray-200 rounded-b-md">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  <strong>Meaning:</strong> {item.meaning}
                </p>
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
