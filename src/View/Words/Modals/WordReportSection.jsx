import { useState } from "react";
import api from "../../../axios";
import { countWords } from "../../../utils/countWords";

// A word's `sentences` array mixes real example sentences with "##"/"**"
// prefixed section headers/notes (see SentenceRenderer in WordListModal) —
// only real sentences make sense to flag as "incorrect", but the original
// array index has to be preserved since that's how the backend (and the
// superadmin's red-highlight view) addresses a specific sentence.
const getReportableSentences = (sentences) =>
  (sentences || [])
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => {
      const trimmed = text.trim();
      return !trimmed.startsWith("##") && !trimmed.startsWith("**");
    });

// Nested inside WordListModal — shared by both the WordList and Favorites
// pages since they render the exact same modal component. Collapsed by
// default; fetches reasons/settings/already-reported status lazily, only
// once the admin/user actually opens this section.
const WordReportSection = ({ wordId, sentences }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [freeTextEnabled, setFreeTextEnabled] = useState(true);
  const [maxWords, setMaxWords] = useState(50);

  const [selectedReasonIds, setSelectedReasonIds] = useState(new Set());
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reportableSentences = getReportableSentences(sentences);
  const needsSentence = [...selectedReasonIds].some(
    (id) => reasons.find((r) => r.id === id)?.requiresSentence,
  );
  const messageWordCount = countWords(message);
  const messageTooLong = freeTextEnabled && messageWordCount > maxWords;

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setLoading(true);
    try {
      const [checkRes, reasonsRes, settingsRes] = await Promise.all([
        api.get(`/word-reports/check/${wordId}`),
        api.get("/word-reports/reasons"),
        api.get("/word-reports/settings"),
      ]);

      setAlreadyReported(!!checkRes.data?.data?.alreadyReported);
      setReasons(reasonsRes.data?.data || []);
      setFreeTextEnabled(settingsRes.data?.data?.freeTextEnabled ?? true);
      setMaxWords(settingsRes.data?.data?.maxWords ?? 50);
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

    if (selectedReasonIds.size === 0) {
      setSubmitError("Select at least one reason.");
      return;
    }
    if (needsSentence && selectedSentenceIndex === null) {
      setSubmitError("Select which sentence is incorrect.");
      return;
    }
    if (messageTooLong) {
      setSubmitError(`Your note must be ${maxWords} words or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/word-reports", {
        wordId,
        reasonIds: [...selectedReasonIds],
        sentenceIndex: needsSentence ? selectedSentenceIndex : undefined,
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
    <div className="mx-1 mt-4 px-1 md:px-3 lg:px-2">
      <button
        type="button"
        onClick={handleExpand}
        className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
      >
        🚩 {expanded ? "Hide report form" : "Report a problem with this word"}
      </button>

      {expanded && (
        <div className="mt-3 rounded-2xl border border-gray-700/50 bg-gray-900/60 p-4">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : submitted ? (
            <p className="text-emerald-400 text-sm font-medium">
              ✅ Thanks — your report has been submitted.
            </p>
          ) : alreadyReported ? (
            <p className="text-amber-400 text-sm font-medium">
              You have already reported this word.
            </p>
          ) : (
            <>
              <p className="text-gray-300 text-sm font-semibold mb-2">
                What's wrong?
              </p>
              <div className="space-y-2 mb-3">
                {reasons.map((reason) => (
                  <label
                    key={reason.id}
                    className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasonIds.has(reason.id)}
                      onChange={() => handleToggleReason(reason.id)}
                      className="mt-0.5 h-4 w-4 accent-red-500"
                    />
                    {reason.label}
                  </label>
                ))}
              </div>

              {needsSentence && (
                <div className="mb-3">
                  <p className="text-gray-300 text-sm font-semibold mb-2">
                    Which sentence?
                  </p>
                  {reportableSentences.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      This word has no sentences to select.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {reportableSentences.map(({ text, index }) => (
                        <label
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-400 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="report-sentence"
                            checked={selectedSentenceIndex === index}
                            onChange={() => setSelectedSentenceIndex(index)}
                            className="mt-1 h-4 w-4 accent-red-500"
                          />
                          <span>{text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {freeTextEnabled && (
                <div className="mb-3">
                  <label
                    htmlFor="word-report-message"
                    className="block text-gray-300 text-sm font-semibold mb-1"
                  >
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="word-report-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className={`w-full rounded-lg border bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      messageTooLong
                        ? "border-red-500 focus:ring-red-500/30"
                        : "border-gray-600 focus:ring-blue-500/30"
                    }`}
                    placeholder="Describe the mistake..."
                  />
                  <p
                    className={`mt-1 text-xs ${messageTooLong ? "text-red-400" : "text-gray-500"}`}
                  >
                    {messageWordCount}/{maxWords} words
                  </p>
                </div>
              )}

              {submitError && (
                <p className="mb-3 text-sm text-red-400">{submitError}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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

export default WordReportSection;
