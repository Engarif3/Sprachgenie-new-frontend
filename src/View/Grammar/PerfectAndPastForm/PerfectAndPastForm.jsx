// import React from "react";
// import data from "./PerfectAndPastForm.json";
// import Container from "../../../utils/Container";

// const PerfectAndPastForm = () => {
//   return (
//     <Container>
//       <div className="mx-auto mt-16 mb-24 p-1">
//         <h2 className="text-3xl font-bold font-mono text-sky-700 my-5 text-center">
//           Verbs with Perfect & Präteritum Forms
//         </h2>

//         {data.map((group, groupIndex) => (
//           <div key={groupIndex} className="mb-10">
//             <h2 className="text-xl font-bold mb-4 text-blue-600">
//               {group.name}
//             </h2>
//             <div className="overflow-x-auto">
//               <table className="min-w-full rounded-lg shadow-md">
//                 <thead>
//                   <tr className="bg-cyan-700 text-white">
//                     <th className="py-2 px-4 text-start">Verb (Präsens)</th>
//                     <th className="py-2 px-4 text-start">Präteritum</th>
//                     <th className="py-2 px-4 text-start">Perfekt</th>
//                     <th className="py-2 px-4 text-start">Meaning</th>
//                     <th className="py-2 px-4 text-start">Perfekt Sentece</th>
//                     <th className="py-2 px-4 text-start">
//                       Präteritum Sentence
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {group.verbs.map((verb, verbIndex) => (
//                     <tr
//                       key={`${groupIndex}-${verbIndex}`}
//                       className="border-b text-slate-950 odd:bg-white even:bg-gray-300 hover:bg-gray-700 hover:text-white"
//                     >
//                       <td className="py-2 px-4 text-start font-bold">
//                         {verb.Präsens}
//                       </td>

//                       <td className="py-2 px-4 text-start">
//                         {verb.Präteritum}
//                       </td>
//                       <td className="py-2 px-4 text-start">{verb.Perfekt}</td>
//                       <td className="py-2 px-4 text-start">{verb.meaning}</td>
//                       <td className="py-2 px-4  text-start">
//                         <div className="mr-1 text-blue-600 font-semibold">
//                           {verb.PerfektSentence}
//                         </div>
//                       </td>
//                       <td className="py-2 px-4   text-justify">
//                         <div className="mr-1 text-pink-600 font-semibold">
//                           {verb.PräteritumSentence}{" "}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         ))}
//       </div>
//     </Container>
//   );
// };

// export default PerfectAndPastForm;

import React from "react";
import data from "./PerfectAndPastForm.json";
import Container from "../../../utils/Container";

const PerfectAndPastForm = () => {
  let totalPraesens = 0;

  data.forEach((group) => {
    totalPraesens += group.verbs.length;
  });

  return (
    <Container>
      <div className="mx-auto mt-16 mb-24 p-1">
        <h2 className="text-3xl font-bold font-mono text-sky-700 my-5 text-center">
          Starke und unregelmäßige Verben
          <br />({totalPraesens})
        </h2>

        {data.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-blue-600">
              {group.name}{" "}
              <span className="text-orange-600">({group.verbs.length})</span>
            </h2>

            {/* Desktop Table Format */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full rounded-lg shadow-md">
                <thead>
                  <tr className="bg-cyan-700 text-white">
                    <th className="py-2 px-4 text-start">Verb (Präsens)</th>
                    <th className="py-2 px-4 text-start">Präteritum</th>
                    <th className="py-2 px-4 text-start">Perfekt</th>
                    <th className="py-2 px-4 text-start">Meaning</th>
                    <th className="py-2 px-4 text-start">Perfekt Sentence</th>
                    <th className="py-2 px-4 text-start">
                      Präteritum Sentence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.verbs.map((verb, verbIndex) => (
                    <tr
                      key={`${groupIndex}-${verbIndex}`}
                      className="border-b text-slate-950 odd:bg-white even:bg-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <td className="py-2 px-4 text-start font-bold">
                        {verb.Präsens}
                      </td>
                      <td className="py-2 px-4 text-start">
                        {verb.Präteritum}
                      </td>
                      <td className="py-2 px-4 text-start">{verb.Perfekt}</td>
                      <td className="py-2 px-4 text-start">{verb.meaning}</td>
                      <td className="py-2 px-4 text-start">
                        <div className="mr-1 text-blue-600 font-semibold">
                          {verb.PerfektSentence}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-justify">
                        <div className="mr-1 text-pink-600 font-semibold">
                          {verb.PräteritumSentence}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Format */}
            <div className="md:hidden space-y-4">
              {group.verbs.map((verb, verbIndex) => (
                <div
                  key={`${groupIndex}-${verbIndex}`}
                  className="border rounded-lg p-4 bg-white shadow"
                >
                  <p>
                    <span className="font-semibold">Verb:</span> {verb.Präsens}
                  </p>
                  <p>
                    <span className="font-semibold">Präteritum:</span>{" "}
                    {verb.Präteritum}
                  </p>
                  <p>
                    <span className="font-semibold">Perfekt:</span>{" "}
                    {verb.Perfekt}
                  </p>
                  <p>
                    <span className="font-semibold">Meaning:</span>{" "}
                    {verb.meaning}
                  </p>

                  {/* Sentences in a Row on Small Devices */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
                    <div className="text-blue-600 font-semibold sm:w-1/2">
                      <span className="font-bold text-black">Perfekt:</span>{" "}
                      {verb.PerfektSentence}
                    </div>
                    <div className="text-pink-600 font-semibold sm:w-1/2">
                      <span className="font-bold text-black">Präteritum:</span>{" "}
                      {verb.PräteritumSentence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default PerfectAndPastForm;
