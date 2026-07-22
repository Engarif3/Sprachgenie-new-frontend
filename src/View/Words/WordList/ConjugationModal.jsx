import React, { useEffect, useState } from "react";
import aiApi from "../../../AI_axios";
import { useLockBodyScroll } from "../Modals/ModalScrolling";
import { countWords } from "../../../utils/countWords";

const TENSE_LABELS = {
  präsens: "Präsens",
  perfekt: "Perfekt",
  präteritum: "Präteritum",
};

// Finite sein/haben forms — matched wherever they appear in the row, not
// just the first word, since impersonal verbs (e.g. "es hat wehgetan")
// lead with a filler pronoun before the actual auxiliary.
const AUXILIARY_FORMS = new Set([
  "bin", "bist", "ist", "sind", "seid",
  "habe", "hast", "hat", "haben", "habt",
]);

const ConjugationCell = ({ conjugation, highlightAuxiliary }) => {
  if (!highlightAuxiliary || typeof conjugation !== "string") {
    return conjugation;
  }

  const words = conjugation.split(" ");
  const auxIndex = words.findIndex((w) => AUXILIARY_FORMS.has(w.toLowerCase()));
  if (auxIndex === -1) {
    return conjugation;
  }

  const before = words.slice(0, auxIndex).join(" ");
  const after = words.slice(auxIndex + 1).join(" ");
  return (
    <>
      {before}
      {before && " "}
      <span className="text-orange-400">{words[auxIndex]}</span>
      {after && " "}
      {after}
    </>
  );
};

const ConjugationTable = ({ rows, highlightAuxiliary = false }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left py-2 px-3 text-gray-400 font-semibold w-1/3">
          Pronoun
        </th>
        <th className="text-left py-2 px-3 text-gray-400 font-semibold">
          Conjugation
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(({ pronoun, conjugation }) => (
        <tr
          key={pronoun}
          className="border-b border-gray-800 hover:bg-white/5 transition-colors"
        >
          <td className="py-2 px-3 text-cyan-400 font-medium">{pronoun}</td>
          <td className="py-2 px-3 text-white font-semibold">
            <ConjugationCell
              conjugation={conjugation}
              highlightAuxiliary={highlightAuxiliary}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TenseSection = ({ label, children }) => (
  <div className="rounded-xl border border-gray-700 overflow-hidden">
    <div className="px-4 py-2.5 bg-gray-800 border-b border-gray-700">
      <span className="text-sm font-bold text-violet-300 tracking-wide">
        {label}
      </span>
    </div>
    <div className="bg-gray-900/60">{children}</div>
  </div>
);

const ConjugationModal = ({
  isOpen,
  onClose,
  word,
  data,
  isLoading,
  error,
  userId,
  isAdmin,
  alreadyReported,
  onReported,
  onAdminRegenerate,
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(alreadyReported ?? false);
  const [reportError, setReportError] = useState("");
  const [adminPrompt, setAdminPrompt] = useState("");
  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [reportOptionsLoading, setReportOptionsLoading] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [selectedReasonIds, setSelectedReasonIds] = useState(new Set());
  const [reportFreeTextEnabled, setReportFreeTextEnabled] = useState(true);
  const [reportMaxWords, setReportMaxWords] = useState(50);

  // Sync external "already reported" flag when modal re-opens for a new verb
  useEffect(() => {
    setReportDone(alreadyReported ?? false);
    setReportOpen(false);
    setReportMessage("");
    setReportError("");
    setSelectedReasonIds(new Set());
  }, [alreadyReported, data]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const verbLabel = data?.verb || word?.value || "";
  const meaning = data?.meaning ? `(${data.meaning})` : "";

  const handleOpenReport = async () => {
    setReportOpen(true);
    setReportError("");
    setReportOptionsLoading(true);
    try {
      const [reasonsRes, settingsRes] = await Promise.all([
        aiApi.get("/conjugations/report-reasons"),
        aiApi.get("/conjugations/report-settings"),
      ]);
      setReportReasons(reasonsRes.data?.data || []);
      setReportFreeTextEnabled(settingsRes.data?.data?.freeTextEnabled ?? true);
      setReportMaxWords(settingsRes.data?.data?.maxWords ?? 50);
    } catch (err) {
      console.error("Error loading report options:", err);
      setReportError("Could not load report options. Please try again.");
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
  const reportMessageWordCount = countWords(reportMessage || "");
  const reportMessageTooLong =
    showReportNoteField && reportMessageWordCount > reportMaxWords;

  const submitReport = async () => {
    setReportError("");
    if (selectedReasonIds.size === 0) {
      setReportError("Select at least one reason.");
      return;
    }
    if (reportMessageTooLong) {
      setReportError(`Your note must be ${reportMaxWords} words or fewer.`);
      return;
    }

    setReportSubmitting(true);
    try {
      await aiApi.post("/conjugations/report", {
        verb: verbLabel,
        userId: userId ?? null,
        reasonIds: [...selectedReasonIds],
        message: showReportNoteField && reportMessage.trim() ? reportMessage.trim() : null,
      });
      setReportDone(true);
      setReportOpen(false);
      if (onReported) onReported(verbLabel);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit report.";
      setReportError(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-lg md:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">
              AI Conjugation
            </p>
            <h2 className="text-2xl font-bold text-white">
              {verbLabel}{" "}
              {meaning && (
                <span className="text-base font-normal text-gray-400">
                  {meaning}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="mt-1 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">
                Generating conjugation table…
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-red-400 font-semibold">
                Failed to generate conjugation
              </p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* 3-column on md+, single column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TenseSection label={TENSE_LABELS.präsens}>
                  <ConjugationTable rows={data.präsens} />
                </TenseSection>

                <TenseSection label={TENSE_LABELS.perfekt}>
                  {/* <TenseSection
                  label={`${TENSE_LABELS.perfekt} (${data.perfekt.auxiliary} + ${data.perfekt.participleForm})`}
                > */}
                  {/* {data.perfekt?.auxiliary && data.perfekt?.participleForm && (
                    <div className="px-4 py-2.5 bg-violet-900/20 border-b border-gray-800 text-sm">
                      <span className="text-gray-400">Auxiliary: </span>
                      <span className="text-violet-300 font-bold">{data.perfekt.auxiliary}</span>
                      <span className="text-gray-500 mx-2">+</span>
                      <span className="text-emerald-300 font-bold">{data.perfekt.participleForm}</span>
                    </div>
                  )} */}
                  <ConjugationTable
                    rows={data.perfekt?.conjugations ?? []}
                    highlightAuxiliary
                  />
                </TenseSection>

                <TenseSection label={TENSE_LABELS.präteritum}>
                  <ConjugationTable rows={data.präteritum} />
                </TenseSection>
              </div>

              {/* Admin regenerate panel */}
              {isAdmin && adminPromptOpen && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-300">
                    Regenerate with custom instruction
                  </p>
                  <textarea
                    className="w-full rounded-lg bg-gray-800 border border-gray-600 text-sm text-white px-3 py-2 placeholder-gray-500 focus:outline-none focus:border-amber-400 resize-none"
                    rows={2}
                    placeholder={`Optional: tell AI what to fix (e.g. "Use sein not haben — ${verbLabel} is a movement verb")`}
                    value={adminPrompt}
                    onChange={(e) => setAdminPrompt(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAdminRegenerate(adminPrompt.trim() || undefined);
                        setAdminPromptOpen(false);
                        setAdminPrompt("");
                      }}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setAdminPromptOpen(false);
                        setAdminPrompt("");
                      }}
                      className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Report form */}
              {reportOpen && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-300">
                    Report incorrect conjugation
                  </p>

                  {reportOptionsLoading ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {reportReasons.map((reason) => (
                          <label
                            key={reason.id}
                            className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer"
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
                            className={`w-full rounded-lg bg-gray-800 border text-sm text-white px-3 py-2 placeholder-gray-500 focus:outline-none resize-none ${
                              reportMessageTooLong
                                ? "border-red-400 focus:border-red-400"
                                : "border-gray-600 focus:border-red-400"
                            }`}
                            rows={2}
                            placeholder="Optional: describe the error (e.g. wrong haben/sein)"
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                          />
                          <p
                            className={`text-xs ${reportMessageTooLong ? "text-red-400" : "text-gray-500"}`}
                          >
                            {reportMessageWordCount}/{reportMaxWords} words
                          </p>
                        </>
                      )}
                    </>
                  )}

                  {reportError && (
                    <p className="text-xs text-red-400">{reportError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={submitReport}
                      disabled={reportSubmitting || reportOptionsLoading}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {reportSubmitting ? "Submitting…" : "Submit report"}
                    </button>
                    <button
                      onClick={() => {
                        setReportOpen(false);
                        setReportError("");
                      }}
                      className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {data && !isLoading && (
          <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-600">
              Generated by AI · verify with a grammar reference
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {/* Admin: regenerate with optional custom prompt */}
              {isAdmin && onAdminRegenerate && (
                <button
                  onClick={() => setAdminPromptOpen((v) => !v)}
                  className="text-xs text-amber-400 hover:text-amber-200 transition-colors"
                >
                  {adminPromptOpen ? "Cancel regenerate" : "Regenerate"}
                </button>
              )}

              {/* Report button: shown to any logged-in user, including admins
                  (admins additionally see Regenerate above) */}
              {userId &&
                !reportOpen &&
                (reportDone ? (
                  <span className="text-xs text-green-500">✓ Reported</span>
                ) : (
                  <button
                    onClick={handleOpenReport}
                    className="text-xs text-red-400 hover:text-red-200 transition-colors"
                  >
                    Report error
                  </button>
                ))}

              <button
                onClick={onClose}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConjugationModal;
