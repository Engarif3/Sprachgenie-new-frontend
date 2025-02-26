// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import { FaPlus, FaMinus } from "react-icons/fa";

// const PrefixList = () => {
//   const { id: prefixTypeId } = useParams();
//   const [prefixData, setPrefixData] = useState(null);
//   const [expandedWords, setExpandedWords] = useState({});

//   useEffect(() => {
//     const fetchPrefixData = async () => {
//       try {
//         const response = await fetch(
//           `https://sprcahgenie-new-backend.vercel.app/api/v1/prefix/prefix-type/${prefixTypeId}`
//         );
//         const data = await response.json();
//         console.log(data);
//         if (data.success) {
//           setPrefixData(data.data);
//         }
//       } catch (error) {
//         console.error("Error fetching prefix data:", error);
//       }
//     };

//     fetchPrefixData();
//   }, [prefixTypeId]);

//   const toggleExpand = (wordId) => {
//     setExpandedWords((prev) => ({
//       ...prev,
//       [wordId]: !prev[wordId],
//     }));
//   };

//   if (!prefixData) {
//     return <p className="text-center text-gray-500">Loading...</p>;
//   }

//   const groupedPrefixes = prefixData.prefixes.reduce((acc, prefix) => {
//     if (!acc[prefix.prefixName]) {
//       acc[prefix.prefixName] = [];
//     }
//     acc[prefix.prefixName].push(prefix);
//     return acc;
//   }, {});

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-semibold text-gray-800 mb-4">
//         {prefixData.name} Prefixes
//       </h2>
//       {Object.entries(groupedPrefixes).map(([prefixName, words]) => (
//         <div key={prefixName} className="mb-4">
//           <h3 className="text-xl font-bold text-blue-600">{prefixName}</h3>
//           <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
//             {words.map((word) => (
//               <div key={word.id} className="border-b last:border-b-0">
//                 <div
//                   className="flex justify-between items-center p-3 cursor-pointer bg-gray-100 hover:bg-gray-200"
//                   onClick={() => toggleExpand(word.id)}
//                 >
//                   <div>
//                     <span className="font-medium text-lg">
//                       {word.prefixWord}
//                     </span>
//                     <span className="text-sm text-gray-600 ml-2">
//                       ({word.meaning.join(", ")})
//                     </span>
//                   </div>
//                   <button className="text-gray-600">
//                     {expandedWords[word.id] ? <FaMinus /> : <FaPlus />}
//                   </button>
//                 </div>
//                 {expandedWords[word.id] && (
//                   <div className="p-3 bg-gray-50 text-gray-700">
//                     <h4 className="text-sm font-semibold text-gray-800">
//                       Example Sentences:
//                     </h4>
//                     <ul className="list-disc list-inside text-sm mt-1 space-y-1">
//                       {word.sentences.map((sentence, index) => (
//                         <li key={index}>{sentence}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default PrefixList;
// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import { FaPlus, FaMinus } from "react-icons/fa";

// const PrefixList = () => {
//   const { id: prefixTypeId } = useParams();
//   const [prefixData, setPrefixData] = useState(null);
//   const [expandedWords, setExpandedWords] = useState({});

//   useEffect(() => {
//     const fetchPrefixData = async () => {
//       try {
//         const response = await fetch(
//           `https://sprcahgenie-new-backend.vercel.app/api/v1/prefix/prefix-type/${prefixTypeId}`
//         );
//         const data = await response.json();
//         if (data.success) {
//           setPrefixData(data.data);
//         }
//       } catch (error) {
//         console.error("Error fetching prefix data:", error);
//       }
//     };

//     fetchPrefixData();
//   }, [prefixTypeId]);

//   const toggleExpand = (wordId) => {
//     setExpandedWords((prev) => ({
//       ...prev,
//       [wordId]: !prev[wordId],
//     }));
//   };

//   if (!prefixData) {
//     return <p className="text-center text-gray-500">Loading...</p>;
//   }

//   const groupedPrefixes = prefixData.prefixes.reduce((acc, prefix) => {
//     const key = prefix.prefixName;
//     if (!acc[key]) {
//       acc[key] = { verbs: [], noVerbs: [] };
//     }
//     if (prefix.verb) {
//       acc[key].verbs.push(prefix);
//     } else {
//       acc[key].noVerbs.push(prefix);
//     }
//     return acc;
//   }, {});

//   const renderWordList = (words) => (
//     <div>
//       {words.map((word, index) => (
//         <div
//           key={word.id}
//           className={index !== words.length - 1 ? "border-b" : ""}
//         >
//           <div
//             className="flex justify-between items-center p-3 cursor-pointer bg-gray-100 hover:bg-gray-200"
//             onClick={() => toggleExpand(word.id)}
//           >
//             <div>
//               <span className="font-medium text-lg">{word.prefixWord}</span>
//               <span className="text-sm text-gray-600 ml-2">
//                 ({word.meaning.join(", ")})
//               </span>
//             </div>
//             <button className="text-gray-600">
//               {expandedWords[word.id] ? <FaMinus /> : <FaPlus />}
//             </button>
//           </div>
//           {expandedWords[word.id] && (
//             <div className="p-3 bg-gray-50 text-gray-700">
//               <h4 className="text-sm font-semibold text-gray-800">
//                 Example Sentences:
//               </h4>
//               <ul className="list-disc list-inside text-sm mt-1 space-y-1">
//                 {word.sentences.map((sentence, idx) => (
//                   <li key={idx}>{sentence}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-semibold text-gray-800 mb-4">
//         {prefixData.name} Prefixes
//       </h2>
//       {Object.entries(groupedPrefixes).map(
//         ([prefixName, { verbs, noVerbs }]) => (
//           <div key={prefixName} className="mb-4">
//             <h3 className="text-xl font-bold text-blue-600 mb-2">
//               {prefixName}
//             </h3>
//             <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
//               {verbs.length > 0 && (
//                 <div>
//                   <h4 className="p-3 font-semibold bg-gray-50 border-b">
//                     Verbs
//                   </h4>
//                   {renderWordList(verbs)}
//                 </div>
//               )}
//               {noVerbs.length > 0 && (
//                 <div>
//                   <h4 className="p-3 font-semibold bg-gray-50 border-b">
//                     Non-Verbs
//                   </h4>
//                   {renderWordList(noVerbs)}
//                 </div>
//               )}
//             </div>
//           </div>
//         )
//       )}
//     </div>
//   );
// };

// export default PrefixList;
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaPlus, FaMinus } from "react-icons/fa";
import Container from "../../utils/Container";

const PrefixList = () => {
  const { id: prefixTypeId } = useParams();
  const [prefixData, setPrefixData] = useState(null);
  const [expandedWords, setExpandedWords] = useState({});

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

  if (!prefixData) {
    return <p className="text-center text-gray-500">Loading...</p>;
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
          <div
            key={word.id}
            className={index !== words.length - 1 ? "border-b" : ""}
          >
            <div
              className="flex justify-between items-center p-3 cursor-pointer bg-gray-100 hover:bg-gray-200"
              onClick={() => toggleExpand(word.id)}
            >
              <div>
                <span className="font-medium text-lg">{word.prefixWord}</span>
                <span className=" ml-2">({word.meaning.join(", ")})</span>
              </div>
              <button className="text-gray-600">
                {expandedWords[word.id] ? <FaMinus /> : <FaPlus />}
              </button>
            </div>
            {expandedWords[word.id] && (
              <div className="p-3 bg-gray-50 text-gray-700">
                <h4 className="text font-semibold text-gray-800">Sentences:</h4>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {word.sentences.map((sentence, idx) => (
                    <li key={idx}>{sentence}</li>
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
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-3xl font-bold font-mono text-center  text-gray-800 mb-4">
          {prefixData.name} Prefixes
        </h2>
        {Object.entries(groupedPrefixes).map(
          ([prefixName, { verbs, noVerbs }]) => (
            <div key={prefixName} className="mb-4">
              <h3 className="text-xl font-bold text-blue-600 mb-2">
                {prefixName.toUpperCase()}
              </h3>
              <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
                <div className="space-y-6">
                  {verbs.length > 0 && (
                    <div>
                      <h4 className="p-3 font-semibold bg-gray-50 border-b">
                        Verbs ({verbs.length})
                      </h4>
                      {renderWordList(verbs)}
                    </div>
                  )}
                  {noVerbs.length > 0 && (
                    <div>
                      <h4 className="p-3 font-semibold bg-gray-50 border-b">
                        Non-Verbs ({noVerbs.length})
                      </h4>
                      {renderWordList(noVerbs)}
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
