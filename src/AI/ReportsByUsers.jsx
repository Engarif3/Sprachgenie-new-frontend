import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../axios";
import aiApi from "../AI_axios";
import { ScaleLoader, PuffLoader } from "react-spinners";
import { useAuth } from "../services/auth.services";
import AIModal from "../View/Words/Modals/AIModal";

const ReportsByUsers = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
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
      <div className="flex justify-between gap-1">
        <span>
          <strong>{user.name || "Unknown"}</strong>
        </span>
        <button
          onClick={() => setSelectedUser(user)}
          className="text-blue-600 text-xs underline hover:text-blue-800"
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

  // loading state
  if (loading)
    return (
      <p className="flex justify-center items-center  ">
        <span>
          {loading && (
            <ScaleLoader
              color="oklch(0.5 0.134 242.749)"
              loading={loading}
              // cssOverride={override}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          )}
        </span>
      </p>
    );
  if (error) return <p className="text-red-600">{error}</p>;
  if (reports.length === 0)
    return (
      <p className="flex justify-center items-center text-2xl text-white mt-12">
        No reports found.
      </p>
    );

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h2 className="text-md md:text-2xl lg:text-2xl font-bold mb-4 text-center  py-2 text-white bg-cyan-700  rounded">
        Reports By Users
      </h2>

      <div className="flex justify-center gap-4 mb-4 ">
        <button
          onClick={handleDeleteAllReports}
          className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
        >
          Delete All Reports
        </button>

        <button
          onClick={handleDeleteAllRegeneratedReports}
          className="btn btn-sm bg-orange-500 text-white hover:bg-orange-600"
        >
          Delete All Regenerated Reports
        </button>
      </div>

      <div className="overflow-x-auto mt-12 bg-white">
        {/* Table */}
        <table className="table-auto w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Word</th>
              <th className="px-4 py-2 border">Total Reports</th>
              <th className="px-4 py-2 border">Reported By</th>
              <th className="px-4 py-2 border">Message</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, index) => (
              <tr key={index} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-2 border">
                  <div className="flex justify-between gap-2">
                    <span>{r.word}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenAiModal(r)}
                      className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 ${
                        r.regenerationRequired === false
                          ? "border-emerald-400 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:shadow-green-500/50"
                          : "border-red-400 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:shadow-red-500/50"
                      }`}
                      disabled={openingWordId === r.wordId}
                      title={
                        r.regenerationRequired === false
                          ? "View current AI content"
                          : "Needs regeneration — view AI content"
                      }
                      aria-label="View current AI content"
                    >
                      {openingWordId === r.wordId ? (
                        <PuffLoader size={14} color="#ffffff" />
                      ) : (
                        "ai"
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 border">{r.reportCount}</td>
                <td className="px-4 py-2 border">
                  {r.reports.map((rep, i) => (
                    <div key={i} className="mt-2">
                      {getUserInfo(rep.userId)}
                      {i < r.reports.length - 1 && (
                        <hr className="border-gray-300 my-1" />
                      )}
                    </div>
                  ))}
                </td>

                <td className="px-4 py-2 border">
                  {r.reports.map((rep, i) => (
                    <div key={i}>
                      <div className="flex justify-between gap-2 items-center mt-2">
                        {rep.message.length > 25 ? (
                          <>
                            <p>{rep.message.slice(0, 10)}...</p>
                            <button
                              onClick={() => setSelectedMessage(rep.message)}
                              className="btn btn-sm btn-accent"
                            >
                              View
                            </button>
                          </>
                        ) : (
                          <p>{rep.message}</p>
                        )}
                      </div>
                      {i < r.reports.length - 1 && (
                        <hr className="border-gray-300 my-1" />
                      )}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AIModal
          key={aiWord?.id || "reports-ai-modal"}
          isOpen={isAIModalOpen}
          aiWord={aiWord}
          selectedParagraph={selectedParagraph}
          onWordUpdated={handleAiWordUpdated}
          onClose={() => setIsAIModalOpen(false)}
        />

        {/* Modal */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">User Info</h2>
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>User ID:</strong> {selectedUser.id}
              </p>
              <div className="mt-4 flex justify-end ">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn btn-sm btn-warning"
                >
                  Close
                </button>
                {/* <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedUser.id);
                  alert("User ID copied!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy ID
              </button> */}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-96 relative">
              <button
                className="absolute top-2 right-2 text-red-600 font-bold"
                onClick={() => setSelectedMessage(null)}
              >
                X
              </button>
              <h3 className="text-lg font-bold mb-4">Full Message</h3>
              <p>{selectedMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsByUsers;
