import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaPlus, FaMinus } from "react-icons/fa";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";

const PrefixList = () => {
  const { id: prefixTypeId } = useParams();
  const [prefixData, setPrefixData] = useState(null);
  const [expandedWords, setExpandedWords] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrefixData = async () => {
      try {
        const response = await fetch(
          `https://sprcahgenie-new-backend.vercel.app/api/v1/prefix/prefix-type/${prefixTypeId}`
        );
        const data = await response.json();
        console.log(data.data);

        if (data.success) {
          // Normalize verb values to boolean
          const normalizedData = {
            ...data.data,
            prefixes: data.data.prefixes.map((prefix) => ({
              ...prefix,
              verb: Boolean(prefix.verb),
              // Force boolean conversion
            })),
          };
          setPrefixData(normalizedData);
        }
      } catch (error) {
        console.error("Error fetching prefix data:", error);
      }
    };

    fetchPrefixData();
  }, [prefixTypeId]);

  const toggleExpand = (wordId) => {
    setExpandedWords((prev) => ({
      ...prev,
      [wordId]: !prev[wordId],
    }));
  };

  // if (!prefixData) {
  //   return <Loader loading={loading} />;
  // }

  if (!prefixData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader loading={loading} />
      </div>
    );
  }

  const groupedPrefixes = prefixData.prefixes.reduce((acc, prefix) => {
    const key = prefix.prefixName.trim().toLowerCase();
    if (!acc[key]) {
      acc[key] = { verbs: [], noVerbs: [] };
    }

    // Handle different verb value types
    if (prefix.verb === true || prefix.verb === "true") {
      acc[key].verbs.push(prefix);
    } else {
      acc[key].noVerbs.push(prefix);
    }
    return acc;
  }, {});

  const sortAlphabetically = (a, b) => a.prefixWord.localeCompare(b.prefixWord);

  const renderWordList = (words) => (
    <div>
      {[...words] // Create copy to avoid mutation
        .sort(sortAlphabetically)
        .map((word, index) => (
          <div key={word.id} className={index !== words.length - 1 ? "" : ""}>
            {/* <div
              className="flex justify-between items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 border border-b-sky-400 "
              onClick={() => toggleExpand(word.id)}
            > */}
            <div
              key={word.id}
              className={`flex justify-between items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 border ${
                index !== words.length - 1
                  ? "border-b border-dotted border-b-sky-400"
                  : ""
              }`}
              onClick={() => toggleExpand(word.id)}
            >
              <div>
                <span className="font-medium text-lg">{word.prefixWord}</span>
                <span className=" ml-2">({word.meaning.join(", ")})</span>
              </div>
              <button className="text-sky-700">
                {expandedWords[word.id] ? <FaMinus /> : <FaPlus />}
              </button>
            </div>
            {expandedWords[word.id] && (
              <div className="p-3 bg-gray-50 text-gray-700">
                <button className="font-semibold capitalize btn btn-sm bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 text-white">
                  Sentences
                </button>
                <ul className="list-disc list-inside  mt-1 space-y-1 ml-1 border-l-8 border-pink-600">
                  {word.sentences.map((sentence, idx) => (
                    <li key={idx} class="normal-case ml-2">
                      {sentence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
    </div>
  );

  return (
    <Container>
      <div className="max-w-4xl mx-auto p-4 ">
        <h2 className="text-3xl font-bold font-mono text-center  text-sky-700  mb-4">
          {prefixData.name} Prefixes
        </h2>
        {Object.entries(groupedPrefixes).map(
          ([prefixName, { verbs, noVerbs }]) => (
            <div key={prefixName} className="mb-4">
              <h3 className="text-xl font-bold text-sky-700 mb-2 ml-2">
                {prefixName.toUpperCase()}
              </h3>
              <div className=" rounded-md shadow-sm overflow-hidden">
                <div className="space-y-6">
                  {verbs.length > 0 && (
                    <div>
                      <h4 className="p-3 font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600   text-white">
                        Verbs ({verbs.length})
                      </h4>
                      <span className="lowercase text-stone-950">
                        {renderWordList(verbs)}
                      </span>
                    </div>
                  )}
                  {noVerbs.length > 0 && (
                    <div>
                      <h4 className="p-3 font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600   text-white rounded-t-md ">
                        Non-Verbs ({noVerbs.length})
                      </h4>
                      <span className="lowercase text-stone-950">
                        {renderWordList(noVerbs)}{" "}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </Container>
  );
};

export default PrefixList;
