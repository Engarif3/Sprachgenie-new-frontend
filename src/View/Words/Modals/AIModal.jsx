import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { useLockBodyScroll } from "./ModalScrolling";
import aiApi from "../../../AI_axios";
import api from "../../../axios";
import { useAuth } from "../../../services/auth.services";

const splitItems = (value, separators) =>
  String(value || "")
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean);

const splitMeaningItems = (value) => splitItems(value, /[\n,;]+/);
const toJoinedLines = (items) =>
  Array.isArray(items) ? items.filter(Boolean).join("\n") : "";

const getWordLevelValue = (word) => {
  if (typeof word?.level === "string") {
    return word.level;
  }

  if (typeof word?.level?.level === "string") {
    return word.level.level;
  }

  return "A1";
};

const AIModal = ({
  isOpen,
  aiWord,
  selectedParagraph,
  onClose,
  onWordUpdated,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [currentWordData, setCurrentWordData] = useState(aiWord);
  const [currentParagraph, setCurrentParagraph] = useState(selectedParagraph);
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [manualMeanings, setManualMeanings] = useState("");
  const [manualParagraph, setManualParagraph] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSuperAdminTools, setShowSuperAdminTools] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { userId, isSuperAdmin } = useAuth();
  const activeWord = aiWord || currentWordData;

  useLockBodyScroll(isOpen);

  useEffect(() => {
    setCurrentWordData(aiWord);
    setCurrentParagraph(selectedParagraph || "");
    setReportMessage("");
    setIsReportOpen(false);

    const nextMeanings =
      Array.isArray(aiWord?.aiMeanings) && aiWord.aiMeanings.length
        ? aiWord.aiMeanings
        : Array.isArray(aiWord?.meaning)
          ? aiWord.meaning
          : [];

    setCorrectionPrompt("");
    setManualMeanings(nextMeanings.join("\n"));
    setManualParagraph(selectedParagraph || "");
    setShowSuperAdminTools(false);
    setPreviewData(null);
    setIsPreviewOpen(false);
  }, [aiWord, selectedParagraph]);

  if (!isOpen || !activeWord) return null;

  const applyUpdatedContent = ({ meanings, paragraph }) => {
    const nextMeanings = Array.isArray(meanings) ? meanings : [];
    const nextParagraph = paragraph || "";

    const nextWord = {
      ...activeWord,
      aiMeanings: nextMeanings,
    };

    setCurrentWordData(nextWord);
    setCurrentParagraph(nextParagraph);
    setManualMeanings(nextMeanings.join("\n"));
    setManualParagraph(nextParagraph);
    setPreviewData(null);
    setIsPreviewOpen(false);
    onWordUpdated?.(nextWord, nextParagraph);
  };

  const saveCorrections = async ({
    meanings,
    paragraph,
    confirmationTitle,
    confirmationText,
    confirmButtonText,
    successTitle,
    successText,
  }) => {
    if (!isSuperAdmin) {
      return;
    }

    if (!activeWord?.id) {
      return Swal.fire("Error", "Missing word ID", "error");
    }

    if (!Array.isArray(meanings) || meanings.length === 0) {
      return Swal.fire(
        "Meanings Required",
        "Please enter at least one meaning.",
        "warning",
      );
    }

    if (!String(paragraph || "").trim()) {
      return Swal.fire(
        "Paragraph Required",
        "Please enter the corrected paragraph.",
        "warning",
      );
    }

    const confirmation = await Swal.fire({
      title: confirmationTitle,
      text: confirmationText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setSaveLoading(true);

      const response = await api.put(
        `/word/paragraph/override/${activeWord.id}`,
        {
          word: activeWord.value,
          level: getWordLevelValue(activeWord),
          language: "de",
          meanings,
          paragraph: String(paragraph || "").trim(),
        },
      );

      const paragraphData = response.data?.data || response.data;

      applyUpdatedContent({
        meanings: paragraphData.meanings,
        paragraph: paragraphData.paragraph,
        otherSentences: paragraphData.otherSentences || paragraphData.sentences,
      });

      await Swal.fire({
        title: successTitle,
        text: successText,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message;
      Swal.fire("Error", message, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!activeWord?.id) {
      return Swal.fire("Error", "Missing word ID", "error");
    }

    try {
      setReportLoading(true);
      const response = await aiApi.post("/paragraphs/report", {
        wordId: activeWord.id,
        userId,
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

  const handlePromptCorrection = async () => {
    if (!isSuperAdmin) {
      return;
    }

    if (!activeWord?.id) {
      return Swal.fire("Error", "Missing word ID", "error");
    }

    const normalizedPrompt = correctionPrompt.trim();

    const confirmation = await Swal.fire({
      title: normalizedPrompt
        ? "Generate preview with this prompt?"
        : "Generate preview without a prompt?",
      text: normalizedPrompt
        ? "This will generate a preview using your correction instructions."
        : "This will generate a preview using the default AI regeneration without any correction prompt.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: normalizedPrompt
        ? "Yes, generate preview"
        : "Yes, continue without prompt",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setPromptLoading(true);
      const response = await api.post(
        `/word/paragraph/regenerate-with-prompt-preview/${activeWord.id}`,
        {
          word: activeWord.value,
          level: getWordLevelValue(activeWord),
          language: "de",
          prompt: normalizedPrompt,
        },
      );

      const paragraphData = response.data?.data || response.data;

      setPreviewData({
        meanings: Array.isArray(paragraphData.meanings)
          ? paragraphData.meanings
          : [],
        paragraph: paragraphData.paragraph || "",
      });

      setManualMeanings(toJoinedLines(paragraphData.meanings));
      setManualParagraph(paragraphData.paragraph || "");
      setIsPreviewOpen(true);

      await Swal.fire({
        title: "Preview Ready",
        text: "Review the proposed AI changes in the preview modal, then publish them if you want to keep them.",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });

      return;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message;
      Swal.fire("Error", message, "error");
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSaveManualCorrections = async () => {
    const meanings = splitMeaningItems(manualMeanings);
    const paragraph = manualParagraph.trim();

    return saveCorrections({
      meanings,
      paragraph,
      confirmationTitle: "Save manual corrections?",
      confirmationText:
        "This will update only the AI meanings and stored AI paragraph.",
      confirmButtonText: "Yes, save it",
      successTitle: "Saved",
      successText: "Meaning and paragraph corrections have been saved.",
    });
  };

  const handlePublishPreview = async () => {
    if (!previewData) {
      return Swal.fire(
        "No Preview",
        "Generate a prompt preview first.",
        "warning",
      );
    }

    return saveCorrections({
      meanings: Array.isArray(previewData.meanings) ? previewData.meanings : [],
      paragraph: previewData.paragraph || "",
      confirmationTitle: "Publish preview changes?",
      confirmationText:
        "This will publish the previewed AI meanings and paragraph for the selected word.",
      confirmButtonText: "Yes, publish",
      successTitle: "Published",
      successText: "Previewed AI changes have been published.",
    });
  };

  const currentMeanings =
    Array.isArray(activeWord?.aiMeanings) && activeWord.aiMeanings.length
      ? activeWord.aiMeanings
      : [];

  return (
    <>
      {/* AI Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl p-1 md:p-8 lg:p-8 w-full md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto mx-1 border-2 border-gray-700/50">
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-center mb-4">
            <span className="text-sky-400 font-bold">
              {typeof activeWord?.article === "string"
                ? activeWord.article
                : activeWord?.article?.name || ""}
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 capitalize">
              {activeWord?.value}
            </span>
          </h2>
          <div className="flex justify-center mb-6 ">
            <p className="text-center text-cyan-300 text-md px-4 py-2 bg-cyan-500/10 rounded-2xl border border-cyan-500/30">
              {Array.isArray(activeWord?.meaning)
                ? activeWord.meaning.join(", ")
                : activeWord?.meaning || ""}
            </p>
          </div>

          <div className="space-y-4 ">
            {activeWord?.aiMeanings?.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-2 md:p-4 lg:p-4 rounded-2xl border-2 border-green-400/50">
                <p className="text-base md:text-lg">
                  <strong className="text-green-400 font-semibold">
                    🤖 AI Meanings:
                  </strong>{" "}
                  <span className="text-white font-medium">
                    {activeWord.aiMeanings.join(", ")}
                  </span>
                </p>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 md:p-6 lg:p-6 rounded-2xl border-2 border-blue-400/50">
              <p className="text-white text-xl leading-relaxed whitespace-pre-line ">
                {currentParagraph}
              </p>
            </div>

            {isSuperAdmin && showSuperAdminTools && (
              <div className="space-y-4 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 md:p-6">
                <div>
                  <h3 className="text-xl font-semibold text-amber-300">
                    Super Admin Correction
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Use a correction prompt to regenerate, then manually save
                    the final meaning and paragraph.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-200">
                    Correction Prompt
                  </label>
                  <textarea
                    value={correctionPrompt}
                    onChange={(e) => setCorrectionPrompt(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-amber-300/30 bg-slate-950/60 p-3 text-sm text-white outline-none transition focus:border-amber-300/60"
                    placeholder="Explain exactly what the AI got wrong and what it should produce instead."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handlePromptCorrection}
                      disabled={promptLoading || saveLoading}
                      className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                      {promptLoading
                        ? "Generating Preview..."
                        : "Regenerate With Prompt"}
                    </button>
                  </div>
                </div>

                {previewData && (
                  <div className="flex items-center justify-end gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewData(null);
                          setIsPreviewOpen(false);
                        }}
                        disabled={saveLoading}
                        className="rounded-full border border-white/15 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                      >
                        Clear Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="rounded-full border border-sky-300/40 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30"
                      >
                        Open Preview
                      </button>
                      <button
                        type="button"
                        onClick={handlePublishPreview}
                        disabled={saveLoading}
                        className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                      >
                        {saveLoading ? "Publishing..." : "Publish Preview"}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-200">
                    Meanings
                  </label>
                  <textarea
                    value={manualMeanings}
                    onChange={(e) => setManualMeanings(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-white outline-none transition focus:border-amber-300/60"
                    placeholder="One meaning per line"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-200">
                    Paragraph
                  </label>
                  <textarea
                    value={manualParagraph}
                    onChange={(e) => setManualParagraph(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-white outline-none transition focus:border-amber-300/60"
                    placeholder="Enter the final paragraph to store for this word"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveManualCorrections}
                    disabled={saveLoading}
                    className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {saveLoading ? "Saving..." : "Save Manual Corrections"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowSuperAdminTools((prev) => !prev)}
                className="rounded-full border border-amber-300/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:border-amber-300/70 hover:bg-amber-500/20"
              >
                {showSuperAdminTools
                  ? "Hide Super Admin Tools"
                  : "Show Super Admin Tools"}
              </button>
            </div>
          )}

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

      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-3 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-sky-300/25 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-2xl md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-sky-200">
                  Preview Changes
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Compare the current AI content with the proposed regenerated
                  content before publishing.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-full border border-white/15 bg-slate-900/60 px-5 py-2.5 font-semibold text-white transition hover:scale-105"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={handlePublishPreview}
                  disabled={saveLoading}
                  className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {saveLoading ? "Publishing..." : "Publish Preview"}
                </button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-slate-100">
                  Current
                </h4>

                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-200">
                    AI Meanings
                  </p>
                  <p className="text-sm whitespace-pre-line text-slate-300">
                    {currentMeanings.length
                      ? currentMeanings.join("\n")
                      : "No stored AI meanings yet."}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-200">
                    Paragraph
                  </p>
                  <p className="text-sm whitespace-pre-line text-slate-300">
                    {currentParagraph || "No stored paragraph yet."}
                  </p>
                </div>
              </div>

              <div className="space-y-5 rounded-2xl border border-sky-300/30 bg-sky-500/10 p-4">
                <h4 className="text-lg font-semibold text-sky-100">Proposed</h4>

                <div className="rounded-xl border border-sky-300/30 bg-slate-900/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-sky-200">
                    AI Meanings
                  </p>
                  <p className="text-sm whitespace-pre-line text-white">
                    {previewData.meanings.length
                      ? previewData.meanings.join("\n")
                      : "No meanings returned."}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-300/30 bg-slate-900/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-sky-200">
                    Paragraph
                  </p>
                  <p className="text-sm whitespace-pre-line text-white">
                    {previewData.paragraph || "No paragraph returned."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
