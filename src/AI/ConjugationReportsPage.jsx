import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { ScaleLoader } from "react-spinners";
import { useAuth } from "../services/auth.services";
import aiApi from "../AI_axios";
import ConjugationModal from "../View/Words/WordList/ConjugationModal";

const ConjugationReportsPage = () => {
  const { isAdmin, isSuperAdmin, isLoggedIn, userId } = useAuth();
  const canAccess = isLoggedIn && userId && isAdmin;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState({});
  const [deletingVerb, setDeletingVerb] = useState({});
  const [expandedVerb, setExpandedVerb] = useState(null);
  const [selectedVerbs, setSelectedVerbs] = useState(new Set());
  const [viewingVerb, setViewingVerb] = useState(null);
  // per-verb custom prompt inputs
  const [customPrompts, setCustomPrompts] = useState({});

  const viewingItem = reports.find((r) => r.verb === viewingVerb) || null;

  const handleToggleExpand = (verb) => {
    setExpandedVerb((prev) => (prev === verb ? null : verb));
  };

  const handleToggleSelectVerb = (verb) => {
    setSelectedVerbs((prev) => {
      const next = new Set(prev);
      if (next.has(verb)) {
        next.delete(verb);
      } else {
        next.add(verb);
      }
      return next;
    });
  };

  const allVerbs = reports.map((r) => r.verb);
  const allVerbsSelected =
    allVerbs.length > 0 && allVerbs.every((verb) => selectedVerbs.has(verb));

  const handleToggleSelectAllVerbs = () => {
    setSelectedVerbs(allVerbsSelected ? new Set() : new Set(allVerbs));
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await aiApi.get("/conjugations/reports");
      setReports(res.data?.data || []);
    } catch {
      toast.error("Failed to load conjugation reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchReports();
  }, [canAccess]);

  const handleRegenerate = async (verb, promptOverride) => {
    setRegenerating((prev) => ({ ...prev, [verb]: true }));
    const customPrompt = (promptOverride ?? customPrompts[verb] ?? "").trim();
    try {
      const res = await aiApi.post("/conjugations/regenerate", {
        verb,
        customPrompt: customPrompt || undefined,
      });
      const newData = res.data?.data;
      setReports((prev) =>
        prev.map((r) =>
          r.verb === verb
            ? { ...r, currentData: newData, reportCount: 0, reports: [] }
            : r,
        ),
      );
      // Clear the prompt after a successful regeneration
      setCustomPrompts((prev) => ({ ...prev, [verb]: "" }));
      toast.success(`"${verb}" regenerated successfully.`);
    } catch {
      toast.error(`Failed to regenerate "${verb}". Please try again.`);
    } finally {
      setRegenerating((prev) => ({ ...prev, [verb]: false }));
    }
  };

  const handleDeleteSelectedVerbReports = async () => {
    if (selectedVerbs.size === 0) return;

    const result = await Swal.fire({
      title: `Delete All Reports for ${selectedVerbs.size} Selected Verb(s)?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await aiApi.delete("/conjugations/admin/verbs/bulk", {
        data: { verbs: [...selectedVerbs] },
      });
      setReports((prev) =>
        prev.map((r) =>
          selectedVerbs.has(r.verb) ? { ...r, reports: [], reportCount: 0 } : r,
        ),
      );
      setSelectedVerbs(new Set());
      toast.success("Reports for the selected verb(s) deleted.");
    } catch {
      toast.error("Failed to delete reports for the selected verb(s). Please try again.");
    }
  };

  const handleDeleteAllReportsForVerb = async (verb) => {
    const result = await Swal.fire({
      title: `Delete All Reports for "${verb}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setDeletingVerb((prev) => ({ ...prev, [verb]: true }));
    try {
      await aiApi.delete(`/conjugations/admin/verb/${verb}/all`);
      setReports((prev) =>
        prev.map((r) => (r.verb === verb ? { ...r, reports: [], reportCount: 0 } : r)),
      );
      setSelectedVerbs((prev) => {
        const next = new Set(prev);
        next.delete(verb);
        return next;
      });
      toast.success(`All reports for "${verb}" deleted.`);
    } catch {
      toast.error(`Failed to delete reports for "${verb}". Please try again.`);
    } finally {
      setDeletingVerb((prev) => ({ ...prev, [verb]: false }));
    }
  };

  if (!canAccess) return <Navigate to="/" replace />;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h2 className="text-3xl font-bold font-mono text-white my-6 text-center">
        Conjugation Reports
      </h2>
      <p className="text-center text-gray-400 text-sm mb-8">
        Verbs flagged by users as having incorrect conjugation. Regenerate to
        produce a fresh AI result and clear all reports for that verb.
      </p>

      {isSuperAdmin && reports.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/60 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={allVerbsSelected}
              onChange={handleToggleSelectAllVerbs}
              className="h-4 w-4 accent-violet-500"
            />
            Select all verbs
          </label>

          {selectedVerbs.size > 0 && (
            <button
              onClick={handleDeleteSelectedVerbReports}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold transition-colors"
            >
              Delete Selected ({selectedVerbs.size} verb
              {selectedVerbs.size !== 1 ? "s" : ""})
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-16">
          <ScaleLoader color="oklch(0.5 0.134 242.749)" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-500 mt-16 text-lg">
          No reports yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => (
            <div
              key={item.verb}
              className="rounded-2xl border border-gray-700 bg-gray-800/60 overflow-hidden"
            >
              {/* Row header */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-rose-500"
                        checked={selectedVerbs.has(item.verb)}
                        onChange={() => handleToggleSelectVerb(item.verb)}
                        title="Select this verb to delete all its reports"
                      />
                    )}
                    <span className="text-xl font-bold text-white">{item.verb}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      {item.reportCount} report{item.reportCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setViewingVerb(item.verb)}
                      disabled={!item.currentData}
                      title={
                        item.currentData
                          ? "View the full conjugation table"
                          : "Nothing cached for this verb yet"
                      }
                      className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                    >
                      View Content
                    </button>
                    <button
                      onClick={() => handleToggleExpand(item.verb)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedVerb === item.verb ? "Hide details" : "View details"}
                    </button>
                  </div>
                </div>

                {/* Custom prompt + regenerate */}
                <div className="flex gap-2 items-start">
                  <textarea
                    rows={2}
                    value={customPrompts[item.verb] || ""}
                    onChange={(e) =>
                      setCustomPrompts((prev) => ({
                        ...prev,
                        [item.verb]: e.target.value,
                      }))
                    }
                    placeholder={`Optional: custom instruction for AI (e.g. "Use sein not haben — ${item.verb} is a movement verb")`}
                    className="flex-1 rounded-lg bg-gray-900 border border-gray-600 text-sm text-white px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <button
                    onClick={() => handleRegenerate(item.verb)}
                    disabled={!!regenerating[item.verb]}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shrink-0"
                  >
                    {regenerating[item.verb] ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Regenerating…
                      </>
                    ) : (
                      "Regenerate"
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedVerb === item.verb && (
                <div className="border-t border-gray-700 px-5 py-4 space-y-4">
                  {/* Current conjugation snapshot */}
                  {item.currentData && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                        Current cached conjugation
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        {["präsens", "präteritum"].map((tense) => (
                          <div key={tense} className="rounded-lg bg-gray-900/60 p-3">
                            <p className="text-violet-300 font-semibold mb-2 capitalize">
                              {tense === "präsens" ? "Präsens" : "Präteritum"}
                            </p>
                            {(item.currentData[tense] || []).map(({ pronoun, conjugation }) => (
                              <p key={pronoun} className="text-gray-300 text-xs">
                                <span className="text-cyan-400">{pronoun}</span>
                                {" → "}
                                {conjugation}
                              </p>
                            ))}
                          </div>
                        ))}
                        <div className="rounded-lg bg-gray-900/60 p-3">
                          <p className="text-violet-300 font-semibold mb-2">Perfekt</p>
                          <p className="text-xs text-amber-300 font-bold mb-1">
                            {item.currentData.perfekt?.auxiliary} +{" "}
                            {item.currentData.perfekt?.participleForm}
                          </p>
                          {(item.currentData.perfekt?.conjugations || []).slice(0, 3).map(
                            ({ pronoun, conjugation }) => (
                              <p key={pronoun} className="text-gray-300 text-xs">
                                <span className="text-cyan-400">{pronoun}</span>
                                {" → "}
                                {conjugation}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User reports */}
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        User reports
                      </p>
                      {isSuperAdmin && item.reports.length > 0 && (
                        <button
                          onClick={() => handleDeleteAllReportsForVerb(item.verb)}
                          disabled={!!deletingVerb[item.verb]}
                          className="text-xs px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition-colors"
                        >
                          {deletingVerb[item.verb] ? "Deleting…" : "Delete All"}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {item.reports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start gap-3 rounded-lg bg-gray-900/40 px-3 py-2 text-sm"
                        >
                          <span className="text-gray-500 text-xs mt-0.5 shrink-0">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {r.userId ? `User: ${r.userId.slice(0, 8)}…` : "Anonymous"}
                          </span>
                          {r.message && (
                            <span className="text-gray-300 text-xs italic">
                              "{r.message}"
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConjugationModal
        isOpen={!!viewingItem}
        onClose={() => setViewingVerb(null)}
        word={{ value: viewingItem?.verb }}
        data={viewingItem?.currentData}
        isLoading={false}
        error={null}
        userId={userId}
        isAdmin={isAdmin}
        alreadyReported={false}
        onAdminRegenerate={(customPrompt) =>
          handleRegenerate(viewingItem.verb, customPrompt)
        }
      />
    </div>
  );
};

export default ConjugationReportsPage;
