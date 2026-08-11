import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../axios";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { formatDateOnly as formatDate } from "../../utils/formatDateTime";
import {
  IoClipboardOutline,
  IoSettingsOutline,
  IoFlagOutline,
  IoWarningOutline,
} from "react-icons/io5";

// Same shape as WordReports.jsx (reasons CRUD, note-field settings, reported
// items with per-item report review) — the only structural difference is
// that a How-to-Say sentence already has its own id, so a flagged sentence
// is shown by its resolved text instead of a "#N" index, and "preview" just
// links to the public page (filtered by title) instead of a dedicated modal.
const HowToSayReports = () => {
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

  // Reported titles summary
  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedTitleIds, setSelectedTitleIds] = useState(new Set());

  // Expanded per-title report list
  const [expandedTitleId, setExpandedTitleId] = useState(null);
  const [reportsForTitle, setReportsForTitle] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Delete confirmation (type "OK")
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      const response = await api.get("/how-to-say-reports/reasons");
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
      const response = await api.get("/how-to-say-reports/settings");
      const data = response.data?.data;
      setFreeTextEnabled(data?.freeTextEnabled ?? true);
      setMaxCharactersInput(String(data?.maxCharacters ?? 50));
    } catch (err) {
      console.error("Error fetching how-to-say report settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await api.get("/how-to-say-reports/admin/summary");
      setSummary(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching reported phrases:", err);
      showError("Failed to load reported phrases");
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
      await api.post("/how-to-say-reports/reasons", {
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
      await api.put(`/how-to-say-reports/reasons/${editingReasonId}`, {
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
      await api.patch("/how-to-say-reports/settings", {
        freeTextEnabled,
        maxCharacters,
      });
      showSuccess("Settings saved!");
    } catch (err) {
      console.error("Error saving settings:", err);
      showError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // ---- Reported phrases / individual reports ----

  const handleToggleExpand = async (titleId) => {
    if (expandedTitleId === titleId) {
      setExpandedTitleId(null);
      setReportsForTitle([]);
      return;
    }

    setExpandedTitleId(titleId);
    setReportsLoading(true);
    try {
      const response = await api.get(
        `/how-to-say-reports/admin/title/${titleId}`,
      );
      setReportsForTitle(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching reports for phrase:", err);
      showError("Failed to load reports for this phrase");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleToggleSelectTitle = (titleId) => {
    setSelectedTitleIds((prev) => {
      const next = new Set(prev);
      if (next.has(titleId)) {
        next.delete(titleId);
      } else {
        next.add(titleId);
      }
      return next;
    });
  };

  const allTitleIds = summary.map((item) => item.titleId);
  const allTitlesSelected =
    allTitleIds.length > 0 &&
    allTitleIds.every((id) => selectedTitleIds.has(id));

  const handleToggleSelectAllTitles = () => {
    setSelectedTitleIds(allTitlesSelected ? new Set() : new Set(allTitleIds));
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
        await api.delete("/how-to-say-reports/admin/bulk", {
          data: { reportIds: [deleteTarget.id] },
        });
        showSuccess("Report deleted!");
      } else if (deleteTarget.type === "allForTitle") {
        await api.delete(
          `/how-to-say-reports/admin/title/${deleteTarget.titleId}/all`,
        );
        showSuccess("All reports for this phrase deleted!");
      } else if (deleteTarget.type === "bulkTitles") {
        await api.delete("/how-to-say-reports/admin/titles/bulk", {
          data: { titleIds: deleteTarget.titleIds },
        });
        showSuccess(
          `Reports for ${deleteTarget.titleIds.length} phrase(s) deleted!`,
        );
        setSelectedTitleIds(new Set());
      } else if (deleteTarget.type === "reason") {
        await api.delete(`/how-to-say-reports/reasons/${deleteTarget.id}`);
        showSuccess("Reason permanently deleted!");
        fetchReasons();
      }

      closeDeleteConfirm();

      if (deleteTarget.type !== "reason") {
        fetchSummary();
        if (expandedTitleId) {
          const response = await api.get(
            `/how-to-say-reports/admin/title/${expandedTitleId}`,
          );
          setReportsForTitle(response.data?.data || []);
        }
      }
    } catch (err) {
      console.error("Error deleting:", err);
      showError(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <PageHeader
            title="How to Say Reports"
            subtitle="Manage report reasons, the optional note field, and review phrases users have flagged."
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
                  placeholder='e.g. "German sentence is unnatural"'
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
                  htmlFor="how-to-say-max-characters-input"
                  className="block text-slate-800 dark:text-white font-semibold mb-2 text-sm"
                >
                  Max characters in note
                </label>
                <input
                  id="how-to-say-max-characters-input"
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

        {/* Reported phrases */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
            <IoFlagOutline aria-hidden="true" />
            Reported Phrases
          </h2>

          {!summaryLoading && summary.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={allTitlesSelected}
                  onChange={handleToggleSelectAllTitles}
                  className="h-4 w-4 accent-orange-500"
                />
                Select all phrases
              </label>

              {selectedTitleIds.size > 0 && (
                <button
                  onClick={() =>
                    openDeleteConfirm({
                      type: "bulkTitles",
                      titleIds: [...selectedTitleIds],
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                >
                  Delete Selected ({selectedTitleIds.size} phrase
                  {selectedTitleIds.size !== 1 ? "s" : ""})
                </button>
              )}
            </div>
          )}

          {summaryLoading ? (
            <p className="text-slate-500 dark:text-gray-400">Loading...</p>
          ) : summary.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-400">
              No phrases have been reported.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.map((item) => (
                <div
                  key={item.titleId}
                  className="rounded-lg border border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1.5 h-4 w-4 shrink-0 accent-orange-500"
                        checked={selectedTitleIds.has(item.titleId)}
                        onChange={() => handleToggleSelectTitle(item.titleId)}
                        title="Select this phrase to delete all its reports"
                      />
                      <div>
                        <Link
                          to={`/how-to-say-in-german?q=${encodeURIComponent(item.titleText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-lg font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition"
                        >
                          {item.titleText}
                        </Link>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                          {item.reportCount} report
                          {item.reportCount === 1 ? "" : "s"} · last{" "}
                          {formatDate(item.lastReportedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleExpand(item.titleId)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        {expandedTitleId === item.titleId
                          ? "Hide Reports"
                          : "View Reports"}
                      </button>
                      <button
                        onClick={() =>
                          openDeleteConfirm({
                            type: "allForTitle",
                            titleId: item.titleId,
                          })
                        }
                        className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 text-sm font-semibold rounded-lg transition"
                      >
                        Delete All
                      </button>
                    </div>
                  </div>

                  {expandedTitleId === item.titleId && (
                    <div className="border-t border-slate-200 dark:border-gray-700 p-4">
                      {reportsLoading ? (
                        <p className="text-slate-500 dark:text-gray-400 text-sm">
                          Loading...
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {reportsForTitle.map((report) => (
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
                                {report.sentence && (
                                  <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-300 mb-1">
                                    <IoFlagOutline size={12} className="shrink-0" aria-hidden="true" />
                                    Flagged sentence: "{report.sentence.sentence}"
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
                {deleteTarget.type === "allForTitle"
                  ? "All Reports"
                  : deleteTarget.type === "bulkTitles"
                    ? `Reports for ${deleteTarget.titleIds.length} Phrase(s)`
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
                htmlFor="howtosayreport-delete-confirm"
                className="block text-white font-semibold mb-2"
              >
                Type <span className="text-red-400">OK</span> to confirm
              </label>
              <input
                id="howtosayreport-delete-confirm"
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
      </div>
    </div>
  );
};

export default HowToSayReports;
