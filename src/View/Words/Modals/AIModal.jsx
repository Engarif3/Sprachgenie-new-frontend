import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { useLockBodyScroll } from "./ModalScrolling";
import aiApi from "../../../AI_axios";
import { getUserInfo } from "../../../services/auth.services";

const AIModal = ({ isOpen, aiWord, selectedParagraph, onClose }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const userInfo = getUserInfo() || {};

  useLockBodyScroll(isOpen);

  useEffect(() => {
    setReportMessage("");
    setIsReportOpen(false);
  }, [aiWord?.id]);

  if (!isOpen || !aiWord) return null;

  const handleReportSubmit = async () => {
    if (!aiWord?.id) return Swal.fire("Error", "Missing word ID", "error");

    try {
      setReportLoading(true);
      const response = await aiApi.post("/paragraphs/report", {
        wordId: aiWord.id,
        userId: userInfo?.id ?? null,
        message: reportMessage?.trim() || null,
      });

      Swal.fire(
        "Reported",
        response.data.message || "Report submitted",
        "success",
      );

      setIsReportOpen(false);
      setReportMessage("");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      //   Swal.fire("Error", errorMessage, "error");
      Swal.fire(errorMessage);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      {/* AI Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl p-1 md:p-8 lg:p-8 w-full md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto mx-1 border-2 border-gray-700/50">
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-center mb-4">
            <span className="text-sky-400 font-bold">
              {typeof aiWord?.article === "string"
                ? aiWord.article
                : aiWord?.article?.name || ""}
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 capitalize">
              {aiWord?.value}
            </span>
          </h2>
          <div className="flex justify-center mb-6 ">
            <p className="text-center text-cyan-300 text-md px-4 py-2 bg-cyan-500/10 rounded-2xl border border-cyan-500/30">
              {/* <span className="text-pink-400 font-bold text-md">[</span> */}
              {Array.isArray(aiWord?.meaning)
                ? aiWord.meaning.join(", ")
                : aiWord?.meaning || ""}
              {/* <span className="text-pink-600 font-bold text-2xl">]</span> */}
            </p>
          </div>

          <div className="space-y-4 ">
            {aiWord?.aiMeanings?.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-2 md:p-4 lg:p-4 rounded-2xl border-2 border-green-400/50">
                <p className="text-base md:text-lg">
                  <strong className="text-green-400 font-semibold">
                    🤖 AI Meanings:
                  </strong>{" "}
                  <span className="text-white font-medium">
                    {aiWord.aiMeanings.join(", ")}
                  </span>
                </p>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 md:p-6 lg:p-6 rounded-2xl border-2 border-blue-400/50">
              <p className="text-white text-xl leading-relaxed whitespace-pre-line ">
                {selectedParagraph}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setIsReportOpen(true)}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50"
            >
              🚨 Report Issue
            </button>

            <button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg"
            >
              ✓ Close
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl shadow-2xl p-8 w-full md:w-1/3 mx-4 border-2 border-gray-200/50">
            <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
              🚨 Report Issue
            </h2>

            <p className="text-gray-700 text-sm mb-4 bg-yellow-100 border border-yellow-300 rounded-xl p-3">
              💡 Please describe the issue with this AI generation. (optional)
            </p>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              className="w-full border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl p-4 text-sm bg-white/50 backdrop-blur-sm transition-all"
              rows={4}
              placeholder="Describe the problem here..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsReportOpen(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={reportLoading}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {reportLoading ? "⏳ Submitting..." : "✓ Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIModal;
