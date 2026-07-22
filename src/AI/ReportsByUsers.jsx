import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../axios";
import aiApi from "../AI_axios";
import { ScaleLoader, PuffLoader } from "react-spinners";
import { useAuth } from "../services/auth.services";
import AIModal from "../View/Words/Modals/AIModal";

const ReportsByUsers = () => {
  const { isAdmin, isSuperAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openingWordId, setOpeningWordId] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiWord, setAiWord] = useState(null);
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState(new Set());

  const allWordIds = reports.map((r) => r.wordId);
  const allWordsSelected =
    allWordIds.length > 0 && allWordIds.every((id) => selectedWordIds.has(id));

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

  const handleToggleSelectAllWords = () => {
    setSelectedWordIds(allWordsSelected ? new Set() : new Set(allWordIds));
  };

  const fetchUsersByIds = async (userIds) => {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

    if (uniqueIds.length === 0) {
      return {};
    }

    const settledUsers = await Promise.allSettled(
      uniqueIds.map(async (reportUserId) => {
        const response = await api.get(`/user/${reportUserId}`);
        const userData = response.data?.data || response.data;

        return [reportUserId, userData];
      }),
    );

    return settledUsers.reduce((acc, result) => {
      if (result.status === "fulfilled") {
        const [reportUserId, userData] = result.value;
        acc[reportUserId] = userData;
      }

      return acc;
    }, {});
  };

  useEffect(() => {
    const loadReportsAndUsers = async () => {
      try {
        setLoading(true);

        const reportRes = await aiApi.get("/paragraphs/get-reports");
        const reportData = reportRes.data || [];
        const userIds = reportData.flatMap((report) =>
          Array.isArray(report.reports)
            ? report.reports.map((entry) => entry.userId)
            : [],
        );
        const usersData = await fetchUsersByIds(userIds);

        setReports(reportData);
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching reports/users:", err);
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReportsAndUsers();
  }, []);

  const UserInfoDisplay = ({ userId }) => {
    const user = users[userId];

    if (!user) {
      return (
        <div className="text-gray-500 text-sm">
          <span className="italic">{userId.substring(0, 8)}...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2">
        <strong className="text-white text-sm">{user.name || "Unknown"}</strong>
        <button
          onClick={() => setSelectedUser(user)}
          className="text-cyan-400 text-xs underline hover:text-cyan-300 shrink-0"
        >
          View ID
        </button>
      </div>
    );
  };

  const getUserInfo = (userId) => {
    return <UserInfoDisplay userId={userId} />;
  };

  const handleOpenAiModal = async (report) => {
    try {
      setOpeningWordId(report.wordId);

      const [wordResponse, paragraphResponse] = await Promise.all([
        api.get(`/word/${report.wordId}`),
        aiApi.get(`/paragraphs/${report.wordId}`),
      ]);

      const wordData = wordResponse.data?.data || wordResponse.data;
      const paragraphData =
        paragraphResponse.data?.data || paragraphResponse.data;

      setAiWord({
        ...wordData,
        aiMeanings: Array.isArray(paragraphData?.meanings)
          ? paragraphData.meanings
          : [],
        sentences: Array.isArray(paragraphData?.otherSentences)
          ? paragraphData.otherSentences
          : Array.isArray(paragraphData?.sentences)
            ? paragraphData.sentences
            : [],
      });
      setSelectedParagraph(paragraphData?.paragraph || "");
      setIsAIModalOpen(true);
    } catch (err) {
      console.error("Error opening AI modal from reports:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message;

      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: errorMessage || "Failed to open AI details for this word.",
      });
    } finally {
      setOpeningWordId(null);
    }
  };

  const handleAiWordUpdated = (updatedWord, paragraph) => {
    setAiWord(updatedWord);
    setSelectedParagraph(paragraph || "");
    setReports((prev) =>
      prev.map((report) =>
        report.wordId === updatedWord?.id
          ? {
              ...report,
              word: updatedWord?.value || report.word,
              regenerationRequired: false,
            }
          : report,
      ),
    );
  };

  const handleDeleteAllReports = async () => {
    try {
      const result = await Swal.fire({
        title: "Delete All Reports?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete all!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await aiApi.delete("/paragraphs/delete-all-reports");

      setReports([]);
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "All reports have been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting all reports:", err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Failed to delete all reports. Try again.",
      });
    }
  };

  const handleDeleteAllRegeneratedReports = async () => {
    try {
      const result = await Swal.fire({
        title: "Delete All Regenerated Reports?",
        text: "This will remove only reports linked to regenerated paragraphs.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete them!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await aiApi.delete("/paragraphs/delete-all-regenerated-reports");

      // Remove regenerated reports from frontend state
      const updatedReports = reports
        .map((r) => {
          const filteredReports =
            r.regenerationRequired !== false ? r.reports : [];
          return {
            ...r,
            reports: filteredReports,
            reportCount: filteredReports.length,
          };
        })
        .filter((r) => r.reports.length > 0);

      const anyDeleted =
        updatedReports.length !== reports.length ||
        reports.some((r) => r.reports.length !== r.reportCount);

      setReports(updatedReports);
      Swal.close();

      if (anyDeleted) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "All regenerated reports have been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Nothing to delete",
          text: "There were no regenerated reports to delete.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error deleting regenerated reports:", err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Failed to delete regenerated reports. Try again.",
      });
    }
  };

  const handleDeleteSelectedWordReports = async () => {
    if (selectedWordIds.size === 0) return;

    try {
      const result = await Swal.fire({
        title: `Delete All Reports for ${selectedWordIds.size} Selected Word(s)?`,
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await aiApi.delete("/paragraphs/admin/words/bulk", {
        data: { wordIds: [...selectedWordIds] },
      });

      setReports((prev) => prev.filter((r) => !selectedWordIds.has(r.wordId)));
      setSelectedWordIds(new Set());

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Reports for the selected word(s) have been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting selected word reports:", err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Failed to delete reports for the selected word(s). Try again.",
      });
    }
  };

  // loading state
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <ScaleLoader
          color="oklch(0.5 0.134 242.749)"
          loading={loading}
          size={150}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    );
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  if (reports.length === 0)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <p className="text-2xl text-gray-400">No reports found.</p>
      </div>
    );

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            AI Paragraph Reports
          </h1>
          <p className="text-gray-400 text-sm">
            Words flagged by users for incorrect AI-generated paragraphs.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={handleDeleteAllReports}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
            >
              Delete All Reports
            </button>

            <button
              onClick={handleDeleteAllRegeneratedReports}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
            >
              Delete All Regenerated Reports
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/60 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={allWordsSelected}
                onChange={handleToggleSelectAllWords}
                className="h-4 w-4 accent-cyan-500"
              />
              Select all words
            </label>

            {selectedWordIds.size > 0 && (
              <button
                onClick={handleDeleteSelectedWordReports}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold transition-colors"
              >
                Delete Selected ({selectedWordIds.size} word
                {selectedWordIds.size !== 1 ? "s" : ""})
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.wordId}
              className="rounded-2xl border border-gray-700 bg-gray-800/60 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {isSuperAdmin && (
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-rose-500"
                      checked={selectedWordIds.has(r.wordId)}
                      onChange={() => handleToggleSelectWord(r.wordId)}
                      title="Select this word to delete all its reports"
                    />
                  )}
                  <span className="text-lg font-bold text-white">{r.word}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {r.reportCount} report{r.reportCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAiModal(r)}
                  disabled={openingWordId === r.wordId}
                  title={
                    r.regenerationRequired === false
                      ? "View current AI content"
                      : "Needs regeneration — view AI content"
                  }
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                    r.regenerationRequired === false
                      ? "border-emerald-400 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      : "border-red-400 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
                  }`}
                >
                  {openingWordId === r.wordId ? (
                    <PuffLoader size={14} color="#ffffff" />
                  ) : (
                    "View AI content"
                  )}
                </button>
              </div>

              <div className="divide-y divide-gray-700/60">
                {r.reports.map((rep, i) => (
                  <div key={rep.id ?? i} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      {getUserInfo(rep.userId)}
                      <div className="mt-1 flex items-start justify-between gap-2">
                        {rep.message.length > 60 ? (
                          <>
                            <p className="text-sm text-gray-300 italic truncate">
                              "{rep.message.slice(0, 60)}…"
                            </p>
                            <button
                              onClick={() => setSelectedMessage(rep.message)}
                              className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300 underline"
                            >
                              View full
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-gray-300 italic">
                            "{rep.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <AIModal
          key={aiWord?.id || "reports-ai-modal"}
          isOpen={isAIModalOpen}
          aiWord={aiWord}
          selectedParagraph={selectedParagraph}
          onWordUpdated={handleAiWordUpdated}
          onClose={() => setIsAIModalOpen(false)}
        />

        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-white">User Info</h2>
              <p className="text-gray-300 text-sm mb-1">
                <strong className="text-white">Name:</strong> {selectedUser.name}
              </p>
              <p className="text-gray-300 text-sm mb-1">
                <strong className="text-white">Email:</strong> {selectedUser.email}
              </p>
              <p className="text-gray-300 text-sm mb-1">
                <strong className="text-white">User ID:</strong> {selectedUser.id}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md relative border border-gray-700">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-white font-bold"
                onClick={() => setSelectedMessage(null)}
              >
                ✕
              </button>
              <h3 className="text-lg font-bold mb-4 text-white">Full Message</h3>
              <p className="text-gray-300 text-sm">{selectedMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsByUsers;
