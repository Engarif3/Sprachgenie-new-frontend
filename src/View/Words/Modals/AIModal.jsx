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
        "success"
      );

      setIsReportOpen(false);
      setReportMessage("");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      {/* AI Modal */}
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

          <div className="whitespace-pre-line text-xl md:text-2xl lg:text-2xl  font-mono text-slate900 -md p-2">
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
          </div>

          <div className="mt-8 flex justify-between sticky bottom-0 mx-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className="btn btn-sm btn-error "
            >
              Report
            </button>

            <button onClick={onClose} className="btn btn-sm btn-warning">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportOpen && (
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
                onClick={() => setIsReportOpen(false)}
                className="btn btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={reportLoading}
                className="btn btn-sm btn-error"
              >
                {reportLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIModal;
