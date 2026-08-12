import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { useLockBodyScroll } from "./ModalScrolling";
import aiApi from "../../../AI_axios";
import api from "../../../axios";
import { useAuth } from "../../../services/auth.services";
import Button from "../../../components/UI/Button";
import {
  IoClose,
  IoAlertCircleOutline,
  IoCheckmark,
  IoSparklesOutline,
} from "react-icons/io5";

// CSS text-transform: capitalize treats "/" as a word boundary too, which
// wrongly capitalizes gendered nouns like "Abteilungsleiter/in" into
// ".../In". Capitalize only the very first character in JS instead.
const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

// Module-level so it survives across every AIModal mount within the page
// session (report reasons/settings rarely change) — cleared on full reload.
let cachedParagraphReportOptions = null;

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
  const [reportOptionsLoading, setReportOptionsLoading] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [selectedReasonIds, setSelectedReasonIds] = useState(new Set());
  const [reportFreeTextEnabled, setReportFreeTextEnabled] = useState(true);
  const [reportMaxCharacters, setReportMaxCharacters] = useState(50);
  const [reportValidationError, setReportValidationError] = useState("");
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
    setSelectedReasonIds(new Set());
    setReportValidationError("");

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

  // Only close when the click lands on the backdrop itself, not when it
  // bubbles up from something inside the card — mirrors WordListModal's
  // handleBackgroundClick.
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePreviewBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsPreviewOpen(false);
    }
  };

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

  const handleToggleReport = async () => {
    if (isReportOpen) {
      setIsReportOpen(false);
      return;
    }

    setIsReportOpen(true);
    setReportValidationError("");

    // Reasons/settings rarely change — reuse across report-form opens within
    // the same page session instead of re-hitting the AI service every time
    // (its serverless function is far less trafficked than the main backend,
    // so repeat cold-start latency is very noticeable otherwise).
    if (cachedParagraphReportOptions) {
      setReportReasons(cachedParagraphReportOptions.reasons);
      setReportFreeTextEnabled(cachedParagraphReportOptions.freeTextEnabled);
      setReportMaxCharacters(cachedParagraphReportOptions.maxCharacters);
      return;
    }

    setReportOptionsLoading(true);
    try {
      const [reasonsRes, settingsRes] = await Promise.all([
        aiApi.get("/paragraphs/report-reasons"),
        aiApi.get("/paragraphs/report-settings"),
      ]);
      const reasons = reasonsRes.data?.data || [];
      const freeTextEnabled = settingsRes.data?.data?.freeTextEnabled ?? true;
      const maxCharacters = settingsRes.data?.data?.maxCharacters ?? 50;

      cachedParagraphReportOptions = { reasons, freeTextEnabled, maxCharacters };
      setReportReasons(reasons);
      setReportFreeTextEnabled(freeTextEnabled);
      setReportMaxCharacters(maxCharacters);
    } catch (error) {
      console.error("Error loading report options:", error);
      setReportValidationError("Could not load report options. Please try again.");
    } finally {
      setReportOptionsLoading(false);
    }
  };

  const handleToggleReportReason = (reasonId) => {
    setSelectedReasonIds((prev) => {
      const next = new Set(prev);
      if (next.has(reasonId)) {
        next.delete(reasonId);
      } else {
        next.add(reasonId);
      }
      return next;
    });
  };

  const showReportNoteField = reportFreeTextEnabled;
  const reportMessageCharCount = (reportMessage || "").trim().length;
  const reportMessageTooLong =
    showReportNoteField && reportMessageCharCount > reportMaxCharacters;

  const handleReportSubmit = async () => {
    if (!activeWord?.id) {
      return Swal.fire("Error", "Missing word ID", "error");
    }

    setReportValidationError("");
    const hasMessage = showReportNoteField && reportMessage.trim().length > 0;
    if (selectedReasonIds.size === 0 && !hasMessage) {
      setReportValidationError("Select at least one reason or add a note.");
      return;
    }
    if (reportMessageTooLong) {
      setReportValidationError(`Your note must be ${reportMaxCharacters} characters or fewer.`);
      return;
    }

    const confirmation = await Swal.fire({
      title: "Submit this report?",
      text: "Let the admin know about this mistake.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    });
    if (!confirmation.isConfirmed) return;

    try {
      setReportLoading(true);
      const response = await aiApi.post("/paragraphs/report", {
        wordId: activeWord.id,
        userId,
        reasonIds: [...selectedReasonIds],
        message: showReportNoteField && reportMessage?.trim() ? reportMessage.trim() : null,
      });

      Swal.fire(
        "Reported",
        response.data.message || "Report submitted",
        "success",
      );

      setIsReportOpen(false);
      setReportMessage("");
      setSelectedReasonIds(new Set());
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
          meaning: activeWord.meaning,
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
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleBackgroundClick}
      >
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black rounded-3xl shadow-2xl p-1 md:p-8 lg:p-8 w-full md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto mx-1 border border-gray-200 dark:border-2 dark:border-gray-700/50">
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-center mb-4">
            <span className="text-sky-600 dark:text-sky-400 font-bold">
              {typeof activeWord?.article === "string"
                ? activeWord.article
                : activeWord?.article?.name || ""}
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 dark:from-orange-400 dark:via-pink-400 dark:to-purple-400">
              {activeWord?.isShortForm
                ? activeWord.value?.toUpperCase()
                : capitalizeFirstLetter(activeWord?.value)}
            </span>
          </h2>
          <div className="flex justify-center mb-6 ">
            <p className="text-center text-cyan-700 dark:text-cyan-300 text-md px-4 py-2 bg-cyan-500/10 rounded-2xl border border-cyan-500/30">
              {Array.isArray(activeWord?.meaning)
                ? activeWord.meaning.join(", ")
                : activeWord?.meaning || ""}
            </p>
          </div>

          <div className="space-y-4 ">
            {activeWord?.aiMeanings?.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-2 md:p-4 lg:p-4 rounded-2xl border-2 border-green-400/50">
                <p className="text-base md:text-lg">
                  <strong className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400 font-semibold">
                    <IoSparklesOutline size={16} aria-hidden="true" />
                    AI Meanings:
                  </strong>{" "}
                  <span className="text-gray-900 dark:text-white font-medium">
                    {activeWord.aiMeanings.join(", ")}
                  </span>
                </p>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 md:p-6 lg:p-6 rounded-2xl border-2 border-blue-400/50">
              <p className="text-gray-900 dark:text-white text-xl leading-relaxed whitespace-pre-line ">
                {currentParagraph}
              </p>
            </div>

            {isSuperAdmin && showSuperAdminTools && (
              <div className="space-y-4 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 md:p-6">
                <div>
                  <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-300">
                    Super Admin Correction
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Use a correction prompt to regenerate, then manually save
                    the final meaning and paragraph.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-700 dark:text-amber-200">
                    Correction Prompt
                  </label>
                  <textarea
                    value={correctionPrompt}
                    onChange={(e) => setCorrectionPrompt(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-amber-400/40 dark:border-amber-300/30 bg-white dark:bg-slate-950/60 p-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-amber-500 dark:focus:border-amber-300/60"
                    placeholder="Explain exactly what the AI got wrong and what it should produce instead."
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="primary"
                      surface="dark"
                      onClick={handlePromptCorrection}
                      disabled={promptLoading || saveLoading}
                    >
                      {promptLoading
                        ? "Generating Preview..."
                        : "Regenerate With Prompt"}
                    </Button>
                  </div>
                </div>

                {previewData && (
                  <div className="flex items-center justify-end gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-3">
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        surface="dark"
                        size="sm"
                        onClick={() => {
                          setPreviewData(null);
                          setIsPreviewOpen(false);
                        }}
                        disabled={saveLoading}
                      >
                        Clear Preview
                      </Button>
                      <Button
                        variant="secondary"
                        surface="dark"
                        size="sm"
                        onClick={() => setIsPreviewOpen(true)}
                      >
                        Open Preview
                      </Button>
                      <Button
                        variant="success"
                        surface="dark"
                        onClick={handlePublishPreview}
                        disabled={saveLoading}
                      >
                        {saveLoading ? "Publishing..." : "Publish Preview"}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-700 dark:text-amber-200">
                    Meanings
                  </label>
                  <textarea
                    value={manualMeanings}
                    onChange={(e) => setManualMeanings(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/60 p-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-amber-500 dark:focus:border-amber-300/60"
                    placeholder="One meaning per line"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-700 dark:text-amber-200">
                    Paragraph
                  </label>
                  <textarea
                    value={manualParagraph}
                    onChange={(e) => setManualParagraph(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/60 p-3 text-sm leading-6 text-gray-900 dark:text-white outline-none transition focus:border-amber-500 dark:focus:border-amber-300/60"
                    placeholder="Enter the final paragraph to store for this word"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="success"
                    surface="dark"
                    onClick={handleSaveManualCorrections}
                    disabled={saveLoading}
                  >
                    {saveLoading ? "Saving..." : "Save Manual Corrections"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                surface="dark"
                onClick={() => setShowSuperAdminTools((prev) => !prev)}
              >
                {showSuperAdminTools
                  ? "Hide Super Admin Tools"
                  : "Show Super Admin Tools"}
              </Button>
            </div>
          )}

          {isReportOpen && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/10 p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-300 mb-3">
                <IoAlertCircleOutline size={20} aria-hidden="true" />
                Report an Issue
              </h3>

              {reportOptionsLoading ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    What's wrong?
                  </p>
                  <div className="space-y-2 mb-4">
                    {reportReasons.map((reason) => (
                      <label
                        key={reason.id}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedReasonIds.has(reason.id)}
                          onChange={() => handleToggleReportReason(reason.id)}
                          className="mt-0.5 h-4 w-4 accent-red-500"
                        />
                        {reason.label}
                      </label>
                    ))}
                    {reportReasons.length === 0 && (
                      <p className="text-gray-500 text-sm italic">
                        No report reasons configured yet.
                      </p>
                    )}
                  </div>

                  {showReportNoteField && (
                    <>
                      <textarea
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                        className={`w-full rounded-lg bg-white dark:bg-gray-900 border text-sm text-gray-900 dark:text-white px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none ${
                          reportMessageTooLong
                            ? "border-red-400 focus:border-red-400"
                            : "border-gray-300 dark:border-gray-600 focus:border-red-400"
                        }`}
                        rows={3}
                        placeholder="Anything else? (optional)"
                      />
                      <p
                        className={`mt-1 text-xs ${reportMessageTooLong ? "text-red-500 dark:text-red-400" : "text-gray-500"}`}
                      >
                        {reportMessageCharCount}/{reportMaxCharacters} characters
                      </p>
                    </>
                  )}

                  {reportValidationError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                      {reportValidationError}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex gap-3">
                <Button
                  variant="danger"
                  surface="dark"
                  size="sm"
                  onClick={handleReportSubmit}
                  disabled={reportLoading || reportOptionsLoading}
                >
                  {reportLoading ? "Submitting…" : "Submit report"}
                </Button>
                <Button
                  variant="secondary"
                  surface="dark"
                  size="sm"
                  onClick={() => setIsReportOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-4">
            <Button variant="danger" surface="dark" size="lg" onClick={handleToggleReport}>
              <span className="inline-flex items-center gap-1.5">
                {isReportOpen ? (
                  <IoClose size={16} aria-hidden="true" />
                ) : (
                  <IoAlertCircleOutline size={16} aria-hidden="true" />
                )}
                {isReportOpen ? "Hide Report Form" : "Report Issue"}
              </span>
            </Button>

            <Button variant="secondary" surface="dark" size="lg" onClick={onClose}>
              <span className="inline-flex items-center gap-1.5">
                <IoCheckmark size={16} aria-hidden="true" />
                Close
              </span>
            </Button>
          </div>
        </div>
      </div>

      {isPreviewOpen && previewData && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handlePreviewBackgroundClick}
        >
          <div className="mx-3 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-sky-400/40 dark:border-sky-300/25 bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 shadow-2xl md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-sky-700 dark:text-sky-200">
                  Preview Changes
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Compare the current AI content with the proposed regenerated
                  content before publishing.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  surface="dark"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close Preview
                </Button>
                <Button
                  variant="success"
                  surface="dark"
                  onClick={handlePublishPreview}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Publishing..." : "Publish Preview"}
                </Button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Current
                </h4>

                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
                    AI Meanings
                  </p>
                  <p className="text-sm whitespace-pre-line text-gray-600 dark:text-slate-300">
                    {currentMeanings.length
                      ? currentMeanings.join("\n")
                      : "No stored AI meanings yet."}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
                    Paragraph
                  </p>
                  <p className="text-sm whitespace-pre-line text-gray-600 dark:text-slate-300">
                    {currentParagraph || "No stored paragraph yet."}
                  </p>
                </div>
              </div>

              <div className="space-y-5 rounded-2xl border border-sky-300/30 bg-sky-500/10 p-4">
                <h4 className="text-lg font-semibold text-sky-700 dark:text-sky-100">Proposed</h4>

                <div className="rounded-xl border border-sky-300/30 bg-white dark:bg-slate-900/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-200">
                    AI Meanings
                  </p>
                  <p className="text-sm whitespace-pre-line text-gray-900 dark:text-white">
                    {previewData.meanings.length
                      ? previewData.meanings.join("\n")
                      : "No meanings returned."}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-300/30 bg-white dark:bg-slate-900/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-200">
                    Paragraph
                  </p>
                  <p className="text-sm whitespace-pre-line text-gray-900 dark:text-white">
                    {previewData.paragraph || "No paragraph returned."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AIModal;
