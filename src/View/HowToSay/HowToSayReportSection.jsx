import { useState } from "react";
import api from "../../axios";

// Module-level so it survives across every HowToSayReportSection mount
// within the page session (report reasons/settings rarely change) —
// cleared on reload. The already-reported check is per-title/user and
// always refetched.
let cachedReportOptions = null;

// Nested inside each expanded phrase card. Collapsed by default; fetches
// reasons/settings/already-reported status lazily, only once the user
// actually opens this section. Unlike the word-report version, sentences
// here already have real ids (HowToSaySentence rows), so no index-based
// workaround is needed to let the user pick which one is wrong.
const HowToSayReportSection = ({ titleId, sentences, isLight }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [freeTextEnabled, setFreeTextEnabled] = useState(true);
  const [maxCharacters, setMaxCharacters] = useState(50);

  const [selectedReasonIds, setSelectedReasonIds] = useState(new Set());
  const [selectedSentenceId, setSelectedSentenceId] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const needsSentence = [...selectedReasonIds].some(
    (id) => reasons.find((r) => r.id === id)?.requiresSentence,
  );
  const messageCharCount = message.trim().length;
  const messageTooLong = freeTextEnabled && messageCharCount > maxCharacters;

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setLoading(true);
    try {
      if (cachedReportOptions) {
        const checkRes = await api.get(`/how-to-say-reports/check/${titleId}`);
        setAlreadyReported(!!checkRes.data?.data?.alreadyReported);
        setReasons(cachedReportOptions.reasons);
        setFreeTextEnabled(cachedReportOptions.freeTextEnabled);
        setMaxCharacters(cachedReportOptions.maxCharacters);
      } else {
        const [checkRes, reasonsRes, settingsRes] = await Promise.all([
          api.get(`/how-to-say-reports/check/${titleId}`),
          api.get("/how-to-say-reports/reasons"),
          api.get("/how-to-say-reports/settings"),
        ]);

        const nextReasons = reasonsRes.data?.data || [];
        const nextFreeTextEnabled =
          settingsRes.data?.data?.freeTextEnabled ?? true;
        const nextMaxCharacters = settingsRes.data?.data?.maxCharacters ?? 50;

        cachedReportOptions = {
          reasons: nextReasons,
          freeTextEnabled: nextFreeTextEnabled,
          maxCharacters: nextMaxCharacters,
        };
        setAlreadyReported(!!checkRes.data?.data?.alreadyReported);
        setReasons(nextReasons);
        setFreeTextEnabled(nextFreeTextEnabled);
        setMaxCharacters(nextMaxCharacters);
      }
    } catch (err) {
      console.error("Error loading report options:", err);
      setSubmitError("Could not load report options. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReason = (reasonId) => {
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

  const handleSubmit = async () => {
    setSubmitError("");

    const hasMessage = freeTextEnabled && message.trim().length > 0;
    if (selectedReasonIds.size === 0 && !hasMessage) {
      setSubmitError("Select at least one reason or add a note.");
      return;
    }
    if (needsSentence && !selectedSentenceId) {
      setSubmitError("Select which sentence is incorrect.");
      return;
    }
    if (messageTooLong) {
      setSubmitError(`Your note must be ${maxCharacters} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/how-to-say-reports", {
        titleId,
        reasonIds: [...selectedReasonIds],
        sentenceId: needsSentence ? selectedSentenceId : undefined,
        message: freeTextEnabled && message.trim() ? message.trim() : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setAlreadyReported(true);
      } else {
        setSubmitError(
          err.response?.data?.message || "Failed to submit report.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleExpand}
        className="text-sm font-semibold text-rose-500 transition-colors hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
      >
        🚩 {expanded ? "Hide report" : "Report a problem"}
      </button>

      {expanded && (
        <div
          className={`mt-3 rounded-2xl border p-4 ${
            isLight
              ? "border-slate-200 bg-slate-50"
              : "border-slate-700/60 bg-slate-950/40"
          }`}
        >
          {loading ? (
            <p
              className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              Loading...
            </p>
          ) : submitted ? (
            <p className="text-sm font-medium text-emerald-500 dark:text-emerald-400">
              ✅ Thanks — your report has been submitted.
            </p>
          ) : alreadyReported ? (
            <p className="text-sm font-medium text-amber-500 dark:text-amber-400">
              You have already reported this phrase.
            </p>
          ) : (
            <>
              <p
                className={`mb-2 text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
              >
                What's wrong?
              </p>
              <div className="mb-3 space-y-2">
                {reasons.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex cursor-pointer items-start gap-2 text-sm ${
                      isLight ? "text-slate-600" : "text-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasonIds.has(reason.id)}
                      onChange={() => handleToggleReason(reason.id)}
                      className="mt-0.5 h-4 w-4 accent-rose-500"
                    />
                    {reason.label}
                  </label>
                ))}
              </div>

              {needsSentence && (
                <div className="mb-3">
                  <p
                    className={`mb-2 text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                  >
                    Which sentence?
                  </p>
                  {(sentences || []).length === 0 ? (
                    <p
                      className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                    >
                      This phrase has no sentences to select.
                    </p>
                  ) : (
                    <div
                      className={`max-h-40 space-y-1.5 overflow-y-auto rounded-lg border p-2.5 ${
                        isLight
                          ? "border-slate-200 bg-white"
                          : "border-slate-700 bg-slate-900/60"
                      }`}
                    >
                      {sentences.map((sentenceItem) => (
                        <label
                          key={sentenceItem.id}
                          className={`flex cursor-pointer items-start gap-2 text-sm ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`report-sentence-${titleId}`}
                            checked={selectedSentenceId === sentenceItem.id}
                            onChange={() =>
                              setSelectedSentenceId(sentenceItem.id)
                            }
                            className="mt-1 h-4 w-4 accent-rose-500"
                          />
                          <span>{sentenceItem.sentence}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {freeTextEnabled && (
                <div className="mb-3">
                  <label
                    htmlFor={`how-to-say-report-message-${titleId}`}
                    className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                  >
                    Anything else? (optional)
                  </label>
                  <textarea
                    id={`how-to-say-report-message-${titleId}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      messageTooLong
                        ? "border-red-500 focus:ring-red-500/30"
                        : isLight
                          ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-sky-500/30"
                          : "border-slate-600 bg-slate-800 text-white placeholder-slate-500 focus:ring-sky-500/30"
                    }`}
                    placeholder="Describe the mistake..."
                  />
                  <p
                    className={`mt-1 text-xs ${
                      messageTooLong
                        ? "text-red-500 dark:text-red-400"
                        : isLight
                          ? "text-slate-400"
                          : "text-slate-500"
                    }`}
                  >
                    {messageCharCount}/{maxCharacters} characters
                  </p>
                </div>
              )}

              {submitError && (
                <p className="mb-3 text-sm text-red-500 dark:text-red-400">
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HowToSayReportSection;
