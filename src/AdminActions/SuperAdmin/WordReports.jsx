import { useEffect, useState } from "react";
import api from "../../axios";
import WordListModal from "../../View/Words/Modals/WordListModal";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { formatDateOnly as formatDate } from "../../utils/formatDateTime";
import {
  IoClipboardOutline,
  IoSettingsOutline,
  IoFlagOutline,
  IoWarningOutline,
} from "react-icons/io5";

const WordReports = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reasons
  const [reasons, setReasons] = useState([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [newReasonLabel, setNewReasonLabel] = useState("");
  const [newReasonRequiresSentence, setNewReasonRequiresSentence] =
    useState(false);
  const [editingReasonId, setEditingReasonId] = useState(null);
  const [editReasonLabel, setEditReasonLabel] = useState("");
  const [editReasonRequiresSentence, setEditReasonRequiresSentence] =
    useState(false);

  // Settings
  const [freeTextEnabled, setFreeTextEnabled] = useState(true);
  const [maxCharactersInput, setMaxCharactersInput] = useState("50");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Reported words summary
  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState(new Set());

  // Expanded per-word report list
  const [expandedWordId, setExpandedWordId] = useState(null);
  const [reportsForWord, setReportsForWord] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Delete confirmation (type "OK")
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // WordListModal preview
  const [modalWord, setModalWord] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const fetchReasons = async () => {
    setReasonsLoading(true);
    try {
      const response = await api.get("/word-reports/reasons");
      setReasons(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching reasons:", err);
      showError("Failed to load report reasons");
    } finally {
      setReasonsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await api.get("/word-reports/settings");
      const data = response.data?.data;
      setFreeTextEnabled(data?.freeTextEnabled ?? true);
      setMaxCharactersInput(String(data?.maxCharacters ?? 50));
    } catch (err) {
      console.error("Error fetching word report settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await api.get("/word-reports/admin/summary");
      setSummary(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching reported words:", err);
      showError("Failed to load reported words");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchReasons();
    fetchSettings();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Reasons CRUD ----

  const handleAddReason = async (e) => {
    e.preventDefault();
    if (!newReasonLabel.trim()) {
      showError("Reason label cannot be empty");
      return;
    }

    try {
      await api.post("/word-reports/reasons", {
        label: newReasonLabel.trim(),
        requiresSentence: newReasonRequiresSentence,
      });
      setNewReasonLabel("");
      setNewReasonRequiresSentence(false);
      showSuccess("Reason added!");
      fetchReasons();
    } catch (err) {
      console.error("Error adding reason:", err);
      showError(err.response?.data?.message || "Failed to add reason");
    }
  };

  const openEditReason = (reason) => {
    setEditingReasonId(reason.id);
    setEditReasonLabel(reason.label);
    setEditReasonRequiresSentence(reason.requiresSentence);
  };

  const closeEditReason = () => {
    setEditingReasonId(null);
    setEditReasonLabel("");
    setEditReasonRequiresSentence(false);
  };

  const handleSaveReason = async () => {
    if (!editReasonLabel.trim()) {
      showError("Reason label cannot be empty");
      return;
    }

    try {
      await api.put(`/word-reports/reasons/${editingReasonId}`, {
        label: editReasonLabel.trim(),
        requiresSentence: editReasonRequiresSentence,
      });
      showSuccess("Reason updated!");
      closeEditReason();
      fetchReasons();
    } catch (err) {
      console.error("Error updating reason:", err);
      showError(err.response?.data?.message || "Failed to update reason");
    }
  };

  const handleDeleteReason = (reason) => {
    openDeleteConfirm({ type: "reason", id: reason.id, label: reason.label });
  };

  // ---- Settings ----

  const handleSaveSettings = async () => {
    const maxCharacters = parseInt(maxCharactersInput, 10);
    if (!Number.isInteger(maxCharacters) || maxCharacters < 1) {
      showError("Max characters must be a whole number (1 or more)");
      return;
    }

    setSavingSettings(true);
    try {
      await api.patch("/word-reports/settings", { freeTextEnabled, maxCharacters });
      showSuccess("Settings saved!");
    } catch (err) {
      console.error("Error saving settings:", err);
      showError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // ---- Reported words / individual reports ----

  const handleToggleExpand = async (wordId) => {
    if (expandedWordId === wordId) {
      setExpandedWordId(null);
      setReportsForWord([]);
      return;
    }

    setExpandedWordId(wordId);
    setReportsLoading(true);
    try {
      const response = await api.get(`/word-reports/admin/word/${wordId}`);
      setReportsForWord(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching reports for word:", err);
      showError("Failed to load reports for this word");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleOpenWordPreview = async (wordId) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/words/${wordId}`);
      setModalWord(response.data || null);
    } catch (err) {
      console.error("Error loading word:", err);
      showError("Failed to load word details");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleSelectWord = (wordId) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const allWordIds = summary.map((item) => item.wordId);
  const allWordsSelected =
    allWordIds.length > 0 && allWordIds.every((id) => selectedWordIds.has(id));

  const handleToggleSelectAllWords = () => {
    setSelectedWordIds(allWordsSelected ? new Set() : new Set(allWordIds));
  };

  const openDeleteConfirm = (target) => {
    setDeleteTarget(target);
    setConfirmText("");
  };
  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setConfirmText("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || confirmText.trim().toUpperCase() !== "OK") return;

    setDeleting(true);
    try {
      if (deleteTarget.type === "single") {
        await api.delete("/word-reports/admin/bulk", {
          data: { reportIds: [deleteTarget.id] },
        });
        showSuccess("Report deleted!");
      } else if (deleteTarget.type === "allForWord") {
        await api.delete(`/word-reports/admin/word/${deleteTarget.wordId}/all`);
        showSuccess("All reports for this word deleted!");
      } else if (deleteTarget.type === "bulkWords") {
        await api.delete("/word-reports/admin/words/bulk", {
          data: { wordIds: deleteTarget.wordIds },
        });
        showSuccess(
          `Reports for ${deleteTarget.wordIds.length} word(s) deleted!`,
        );
        setSelectedWordIds(new Set());
      } else if (deleteTarget.type === "reason") {
        await api.delete(`/word-reports/reasons/${deleteTarget.id}`);
        showSuccess("Reason permanently deleted!");
        fetchReasons();
      }

      closeDeleteConfirm();

      if (deleteTarget.type !== "reason") {
        fetchSummary();
        if (expandedWordId) {
          const response = await api.get(
            `/word-reports/admin/word/${expandedWordId}`,
          );
          setReportsForWord(response.data?.data || []);
        }
      }
    } catch (err) {
      console.error("Error deleting:", err);
      showError(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const flaggedSentenceIndexes = expandedWordId
    ? [
        ...new Set(
          reportsForWord
            .filter(
              (r) => r.sentenceIndex !== null && r.sentenceIndex !== undefined,
            )
            .map((r) => r.sentenceIndex),
        ),
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <PageHeader
            title="Word Reports"
            subtitle="Manage report reasons, the optional note field, and review words users have flagged."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Reasons management */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 mb-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
            <IoClipboardOutline aria-hidden="true" />
            Report Reasons
          </h2>

          {reasonsLoading ? (
            <p className="text-slate-500 dark:text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {reasons.map((reason) =>
                  editingReasonId === reason.id ? (
                    <div
                      key={reason.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 dark:border-gray-600 dark:bg-gray-900/60"
                    >
                      <input
                        type="text"
                        value={editReasonLabel}
                        onChange={(e) => setEditReasonLabel(e.target.value)}
                        className="flex-1 min-w-[160px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={editReasonRequiresSentence}
                          onChange={(e) =>
                            setEditReasonRequiresSentence(e.target.checked)
                          }
                          className="h-4 w-4 accent-orange-500"
                        />
                        Requires sentence pick
                      </label>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveReason}
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={closeEditReason}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div
                      key={reason.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
                    >
                      <span className="text-sm text-slate-800 dark:text-white">
                        {reason.label}
                        {reason.requiresSentence && (
                          <span className="ml-2 rounded-full bg-orange-100 border border-orange-300 px-2 py-0.5 text-[11px] text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/40 dark:text-orange-300">
                            requires sentence
                          </span>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openEditReason(reason)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteReason(reason)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ),
                )}
                {reasons.length === 0 && (
                  <p className="text-slate-400 dark:text-gray-500 text-sm">
                    No reasons yet.
                  </p>
                )}
              </div>

              <form
                onSubmit={handleAddReason}
                className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-gray-700 pt-4"
              >
                <input
                  type="text"
                  value={newReasonLabel}
                  onChange={(e) => setNewReasonLabel(e.target.value)}
                  placeholder='e.g. "Spelling mistake"'
                  className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newReasonRequiresSentence}
                    onChange={(e) =>
                      setNewReasonRequiresSentence(e.target.checked)
                    }
                    className="h-4 w-4 accent-orange-500"
                  />
                  Requires sentence pick
                </label>
                <Button type="submit">Add Option</Button>
              </form>
            </>
          )}
        </div>

        {/* Settings */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 mb-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
            <IoSettingsOutline aria-hidden="true" />
            Note Field Settings
          </h2>
          {settingsLoading ? (
            <p className="text-slate-500 dark:text-gray-400">Loading...</p>
          ) : (
            <>
              <label className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={freeTextEnabled}
                  onChange={(e) => setFreeTextEnabled(e.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                Allow users to add a short note when reporting
              </label>
              <div className="mb-4 max-w-xs">
                <label
                  htmlFor="max-characters-input"
                  className="block text-slate-800 dark:text-white font-semibold mb-2 text-sm"
                >
                  Max characters in note
                </label>
                <input
                  id="max-characters-input"
                  type="number"
                  min="1"
                  value={maxCharactersInput}
                  onChange={(e) => setMaxCharactersInput(e.target.value)}
                  disabled={!freeTextEnabled}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 transition"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>

        {/* Reported words */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
            <IoFlagOutline aria-hidden="true" />
            Reported Words
          </h2>

          {!summaryLoading && summary.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={allWordsSelected}
                  onChange={handleToggleSelectAllWords}
                  className="h-4 w-4 accent-orange-500"
                />
                Select all words
              </label>

              {selectedWordIds.size > 0 && (
                <button
                  onClick={() =>
                    openDeleteConfirm({
                      type: "bulkWords",
                      wordIds: [...selectedWordIds],
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                >
                  Delete Selected ({selectedWordIds.size} word
                  {selectedWordIds.size !== 1 ? "s" : ""})
                </button>
              )}
            </div>
          )}

          {summaryLoading ? (
            <p className="text-slate-500 dark:text-gray-400">Loading...</p>
          ) : summary.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-400">
              No words have been reported.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.map((item) => (
                <div
                  key={item.wordId}
                  className="rounded-lg border border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1.5 h-4 w-4 shrink-0 accent-orange-500"
                        checked={selectedWordIds.has(item.wordId)}
                        onChange={() => handleToggleSelectWord(item.wordId)}
                        title="Select this word to delete all its reports"
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenWordPreview(item.wordId)}
                          disabled={modalLoading}
                          className="text-lg font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition disabled:opacity-50"
                        >
                          {item.wordValue}
                        </button>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                          {item.reportCount} report
                          {item.reportCount === 1 ? "" : "s"} · last{" "}
                          {formatDate(item.lastReportedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleExpand(item.wordId)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        {expandedWordId === item.wordId
                          ? "Hide Reports"
                          : "View Reports"}
                      </button>
                      <button
                        onClick={() =>
                          openDeleteConfirm({
                            type: "allForWord",
                            wordId: item.wordId,
                          })
                        }
                        className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 text-sm font-semibold rounded-lg transition"
                      >
                        Delete All
                      </button>
                    </div>
                  </div>

                  {expandedWordId === item.wordId && (
                    <div className="border-t border-slate-200 dark:border-gray-700 p-4">
                      {reportsLoading ? (
                        <p className="text-slate-500 dark:text-gray-400 text-sm">
                          Loading...
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {reportsForWord.map((report) => (
                              <div
                                key={report.id}
                                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap gap-1.5 mb-1">
                                    {report.reasons.map((r) => (
                                      <span
                                        key={r.id}
                                        className="rounded-full bg-orange-100 border border-orange-300 px-2 py-0.5 text-[11px] text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/40 dark:text-orange-300"
                                      >
                                        {r.label}
                                      </span>
                                    ))}
                                  </div>
                                  {report.sentenceIndex !== null &&
                                    report.sentenceIndex !== undefined && (
                                      <p className="text-xs text-red-600 dark:text-red-300 mb-1">
                                        Flagged sentence #
                                        {report.sentenceIndex + 1}
                                      </p>
                                    )}
                                  {report.message && (
                                    <p className="text-sm text-slate-600 dark:text-gray-300 italic mb-1">
                                      "{report.message}"
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-400 dark:text-gray-500">
                                    {report.user?.name || report.user?.email} ·{" "}
                                    {formatDate(report.createdAt)}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    openDeleteConfirm({
                                      type: "single",
                                      id: report.id,
                                    })
                                  }
                                  className="shrink-0 px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 text-xs font-semibold rounded-lg transition"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-red-700">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-red-400 mb-4">
                <IoWarningOutline aria-hidden="true" />
                Permanently Delete{" "}
                {deleteTarget.type === "allForWord"
                  ? "All Reports"
                  : deleteTarget.type === "bulkWords"
                    ? `Reports for ${deleteTarget.wordIds.length} Word(s)`
                    : deleteTarget.type === "reason"
                      ? "Reason"
                      : "Report"}
              </h2>
              <p className="text-gray-300 mb-6 text-sm">
                {deleteTarget.type === "reason"
                  ? `"${deleteTarget.label}" will no longer be offered to users. Existing reports keep their other reasons/notes. This cannot be undone.`
                  : "This cannot be undone."}
              </p>
              <label
                htmlFor="wordreport-delete-confirm"
                className="block text-white font-semibold mb-2"
              >
                Type <span className="text-red-400">OK</span> to confirm
              </label>
              <input
                id="wordreport-delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="OK"
                autoFocus
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={
                    deleting || confirmText.trim().toUpperCase() !== "OK"
                  }
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {modalWord && (
          <WordListModal
            selectedWord={modalWord}
            closeModal={() => setModalWord(null)}
            favorites={[]}
            toggleFavorite={() => {}}
            flaggedSentenceIndexes={flaggedSentenceIndexes}
          />
        )}
      </div>
    </div>
  );
};

export default WordReports;
