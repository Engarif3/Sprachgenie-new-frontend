import { useState } from "react";
import verbsData from "./VerbsWithGehen.json";
import Container from "../../../utils/Container";

export default function VerbsWithGehen() {
  return (
    <Container>
      <h1 className="text-3xl font-bold mb-6 text-center">
        Verbs ending with "-gehen"
      </h1>

      {/* Section 1: List of all words */}

      <div className="grid grid-cols-2 md:grid-cols-12 lg:grid-cols-12 justify-center items-center gap-1 md:gap-2 lg:gap.2 text-gray-700 m-1 md:m-4 lg:m-4">
        {verbsData.words.map((verb) => (
          <button key={verb.word} className="btn btn-sm font-semibold">
            {verb.word}
          </button>
        ))}
      </div>

      {/* Section 2: Each word with four sentences */}
      <div className="m-1 md:m-4 lg:m-4">
        <h2 className="text-2xl font-semibold mb-4">Sentences</h2>
        <div className="space-y-6 mb-8">
          {verbsData.words.map((verb) => (
            <div
              key={verb.word}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold mb-2">{verb.word}</h3>
              <p className="text-gray-600 mb-3">{verb.meaning}</p>
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Present:</span>{" "}
                  {verb.sentences.present}
                </p>
                <p>
                  <span className="font-semibold">Past:</span>{" "}
                  {verb.sentences.past}
                </p>
                <p>
                  <span className="font-semibold">Perfect:</span>{" "}
                  {verb.sentences.perfect}
                </p>
                <p>
                  <span className="font-semibold">Modal:</span>{" "}
                  {verb.sentences.modal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
