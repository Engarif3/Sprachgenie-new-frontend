import React, { useState } from "react";
import data from "./VerbWithPreposition.json"; // Import the JSON file with the data
import Container from "../../../utils/Container";
import PrepositionLabel from "../../../components/UI/PrepositionLabel";

const VerbWithPreposition = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query
  const filteredData = data.filter((item) =>
    item.Verb.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Container>
      <div className=" mx-auto mt-16 mb-24 p-1">
        <h2 className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent my-5 text-center">
          Verbs with Prepositions <br />
          <span className="text-gray-700 dark:text-white">
            ({data.length})
          </span>
        </h2>
        <div className="flex flex-col md:flex-row lg:flex-row justify-between items-center ">
          <div className="text-center my-8 w-full md:w-4/12 lg:w-4/12 flex border border-cyan-700 rounded-lg ">
            <input
              type="text"
              placeholder="Search by verb"
              className="p-2 border rounded-md w-full px-8 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-center mb-2 md:mb-0 lg:mb-0 w-full md:w-4/12 lg:w-4/12   hidden md:block lg.block">
            <p className=" text-lg border rounded-md bg-green-700  p-2 text-white font-bold w-full ">
              PN = Pronoun & K = Kasus (Case)
            </p>
          </div>
        </div>

        <div className="block md:hidden ">
          {/* Mobile layout */}
          {filteredData.map((item, index) => (
            <div
              key={index}
              className="mb-4 py-4 px-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-900 text-gray-700 dark:text-white "
            >
              <div className="mb-3 border-b border-gray-200 dark:border-gray-700 ">
                {item.Pronoun !== "-" && (
                  <div className="pb-2 ">
                    {item.Pronoun} -{" "}
                    <span>
                      <span className="font-bold text-slate-900 dark:text-white text-lg">
                        {item.Verb}
                      </span>{" "}
                      -{" "}
                      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                        <PrepositionLabel text={item["Preposition"]} />
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          Case:{" "}
                        </span>
                        {item.Kasus}
                      </span>
                    </span>
                  </div>
                )}
                {item.Pronoun === "-" && (
                  <div className="pb-2 ">
                    <span className="font-bold text-slate-900 dark:text-white text-lg py-2">
                      {item.Verb}
                    </span>{" "}
                    -{" "}
                    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 py-2">
                      <PrepositionLabel text={item["Preposition"]} />
                      <span className="text-orange-600 dark:text-orange-400 font-bold">
                        Case:{" "}
                      </span>
                      {item.Kasus}
                    </span>
                  </div>
                )}
              </div>
              <div className=" border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className=" text-orange-600 dark:text-orange-400 font-bold ">
                  Meaning:
                </span>{" "}
                {item.Meaning}
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 italic py-2">
                {item.Beispielsatz}
              </div>
              <div className="italic pt-2">{item.Übersetzung}</div>
            </div>
          ))}
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block lg:block">
          <table className="min-w-full  rounded-lg shadow-md ">
            <thead>
              <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="py-2 px-4 text-start">PN</th>
                <th className="py-2 px-4 text-start">Verb</th>
                <th className="py-2 px-4 text-start">Präposition</th>
                <th className="py-2 px-4 text-start">Meaning</th>
                <th className="py-2 px-4 text-start">K</th>
                <th className="py-2 px-4 text-center">Beispielsatz</th>
                <th className="py-2 px-4 text-center">Übersetzung</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-700 text-slate-800 odd:bg-white even:bg-slate-50 hover:bg-sky-50 dark:text-slate-100 dark:odd:bg-slate-900 dark:even:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <td className="py-2 px-4 text-start w-[2%]">
                    {item.Pronoun}
                  </td>
                  <td className="py-2 px-4 text-start font-bold ">
                    {item.Verb}
                  </td>
                  <td className="py-2 px-4 text-start whitespace-nowrap">
                    <PrepositionLabel text={item["Preposition"]} />
                  </td>
                  <td className="py-2 px-4 text-start w-[22%]">
                    {item.Meaning}
                  </td>

                  <td className="py-2 px-4 text-start ">{item.Kasus}</td>
                  <td className="py-2 px-4 text-start w-[35%]">
                    {item.Beispielsatz}
                  </td>
                  <td className="py-2 px-4 text-start w-[35%]">
                    {item.Übersetzung}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
};

export default VerbWithPreposition;
