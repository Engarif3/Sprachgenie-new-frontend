import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../axios";
import aiApi from "../AI_axios";
import { ScaleLoader } from "react-spinners";
import { isLoggedIn } from "../services/auth.services";
import { getUserInfo as getAuthUserInfo } from "../services/auth.services";

const ReportsByUsers = () => {
  const userLoggedIn = isLoggedIn();
  const userInfo = getAuthUserInfo() || {};

  // Security check: Only allow admin/super_admin users
  if (
    !userLoggedIn ||
    !userInfo.id ||
    (userInfo.role !== "admin" && userInfo.role !== "super_admin")
  ) {
    return <Navigate to="/" replace />;
  }
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [regenerating, setRegenerating] = useState(null);

  const fetchReportsAndUsers = async () => {
    try {
      setLoading(true);

      // fetch reports
      const reportRes = await aiApi.get("/paragraphs/get-reports");
      const reportData = reportRes.data || [];

      // fetch all users
      const userRes = await api.get("/user");
      const usersData = userRes.data.data;

      setReports(reportData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching reports/users:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    fetchReportsAndUsers();
  }, []);

  // Component to handle async user info fetching
  const UserInfoDisplay = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchUserInfo = async () => {
        // Check if already in users list
        let foundUser = users.find((u) => u.id === userId);

        // Check if in cache
        if (!foundUser && userCache[userId]) {
          foundUser = userCache[userId];
        }

        // Fetch on-demand if not found (checks backend user table and related tables)
        if (!foundUser) {
          try {
            const res = await api.get(`/user/${userId}`);
            if (res.data.data) {
              foundUser = res.data.data;
              setUserCache((prev) => ({ ...prev, [userId]: foundUser }));
            }
          } catch (err) {
            console.error(`Could not fetch user ${userId}:`, err);
          }
        }

        setUser(foundUser);
        setLoading(false);
      };

      fetchUserInfo();
    }, [userId, users, userCache]);

    if (loading) {
      return <span className="text-gray-400 text-sm">Loading...</span>;
    }

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

  // Re-generate handler

  const handleRegenerate = async (report) => {
    try {
      // Step 1: Show confirmation dialog
      const result = await Swal.fire({
        title: `Re-generate AI for "${report.word}"?`,
        text: "This will regenerate the AI content for this word.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, regenerate it!",
        cancelButtonText: "Cancel",
      });

      // Step 2: Only proceed if user confirmed
      if (!result.isConfirmed) return;

      // Step 3: Show loading while API is in progress
      Swal.fire({
        title: "Regenerating...",
        text: `Please wait while AI content for "${report.word}" is regenerated.`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      setRegenerating(report.wordId);

      // Step 4: Call the API
      await aiApi.post("/paragraphs/regenerate", {
        userId: report.reports[0]?.userId,
        wordId: report.wordId,
        word: report.word,
        level: report.level,
        language: report.language,
      });

      // Step 5: Update frontend state (mark as regenerated)

      setReports((prev) =>
        prev.map((r) =>
          r.wordId === report.wordId
            ? { ...r, regenerationRequired: false }
            : r,
        ),
      );

      // Step 6: Close loading and show success
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Re-generated!",
        text: `AI content for "${report.word}" has been regenerated successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error regenerating:", err);
      Swal.close();

      // Check if it's a limit or service error
      const errorMessage = err.response?.data?.error || err.message;
      const isLimitError =
        err.response?.status === 403 ||
        errorMessage?.toLowerCase().includes("limit") ||
        errorMessage?.toLowerCase().includes("exceeded");
      const isServiceError =
        (err.response?.status === 500 ||
          err.response?.status === 429 ||
          err.response?.status === 503) &&
        !isLimitError;

      if (isLimitError) {
        Swal.fire({
          icon: "warning",
          title: "Limit Reached",
          text: errorMessage || "You have exceeded your daily/monthly limit",
        });
      } else if (isServiceError) {
        Swal.fire({
          icon: "info",
          title: "Service Temporarily Unavailable",
          text:
            errorMessage || "AI service is busy. Please try again in a moment.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "Failed to re-generate word. Please try again.",
        });
      }
    } finally {
      setRegenerating(null);
    }
  };
  // Add this at the top, inside ReportsByUsers component
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
          const filteredReports = r.reports.filter(
            (rep) => r.regenerationRequired !== false, // keep reports that are not regenerated
          );
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
                <td className="px-4 py-2 border">{r.word}</td>
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
                {/* 🔹 Re-generate button */}

                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => handleRegenerate(r)}
                    className={`btn btn-sm ${
                      r.regenerationRequired === false
                        ? // ? "bg-gray-400 text-white cursor-not-allowed"
                          "bg-cyan-700 text-white "
                        : "bg-red-600 text-white"
                    }`}
                    // disabled={
                    //   regenerating === r.wordId ||
                    //   r.regenerationRequired === false
                    // }
                  >
                    {regenerating === r.wordId
                      ? "Regenerating..."
                      : r.regenerationRequired === false
                        ? "Generated"
                        : "Re-generate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
