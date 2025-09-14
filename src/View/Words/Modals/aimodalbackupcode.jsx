{
  isAIModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-1/2 lg:w-1/2 max-h-[90vh] overflow-y-auto  px-1 md:px-4 lg:px-4 mx-2">
        <h2 className="text-2xl md:text-5xl lg:text-5xl font-bold  text-center mb-2">
          <span className="text-orange-600">
            {" "}
            {typeof aiWord?.article === "string"
              ? aiWord.article
              : aiWord?.article?.name || ""}{" "}
          </span>
          <span className="text-slate-800 capitalize">{aiWord?.value}</span>
        </h2>
        <div className="flex justify-center">
          <p className="text-justify text-cyan-800 text-2xl mb-6  px-1 md:px-4 lg:px-4 mx-2">
            {/* [{aiWord?.meaning || ""}] */}
            <span className="text-pink-600 font-semibold text-3xl">[</span>
            {Array.isArray(aiWord?.meaning)
              ? aiWord.meaning.join(", ")
              : aiWord?.meaning || ""}
            <span className="text-pink-600 font-semibold text-3xl">]</span>
          </p>
        </div>

        <p className="whitespace-pre-line text-xl md:text-2xl lg:text-2xl  font-mono text-slate900 -md p-2">
          <div>
            {" "}
            {aiWord?.aiMeanings?.length > 0 && (
              <p className=" text-gray-700 text-lg ml-2">
                <strong className="text-green-700">Meanings (AI):</strong>{" "}
                {aiWord.aiMeanings.join(", ")}
              </p>
            )}
          </div>
          <div className="border border-cyan-600 rounded p-2">
            <span> {selectedParagraph}</span>
          </div>
          <div className="hidden">
            {aiWord?.sentences?.length > 0 && (
              <span className="mt-4 text-left text-slate-700 ">
                {aiWord.sentences.map((s, i) => (
                  <p key={i} className=" text-lg ml-2">
                    <strong className="text-green-700">Sentences:</strong>
                    {s}
                  </p>
                ))}
              </span>
            )}
          </div>
        </p>

        <div className="mt-8 flex justify-between sticky bottom-0 mx-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn btn-sm btn-error "
          >
            Report
          </button>
          <button
            onClick={() => setIsAIModalOpen(false)}
            className="btn btn-sm btn-warning"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

{
  /* =======AI modal=============== */
}

{
  /* ===================report========= */
}
{
  isReportModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-1/3 mx-2">
        <h2 className="text-xl font-bold mb-4 text-center">Report</h2>

        <p className="text-gray-600 text-sm mb-2">
          Reason for reporting this AI generation. (optional)
        </p>
        <textarea
          value={reportMessage}
          onChange={(e) => setReportMessage(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
          placeholder="Enter a message (optional)"
        />

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setIsReportModalOpen(false)}
            className="btn btn-sm"
          >
            Cancel
          </button>
          <button onClick={handleReportSubmit} className="btn btn-sm btn-error">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
