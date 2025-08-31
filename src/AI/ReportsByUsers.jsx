import { useEffect, useState } from "react";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios";
import aiApi from "../AI_axios";
import { ScaleLoader } from "react-spinners";

const ReportsByUsers = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchReportsAndUsers = async () => {
    try {
      setLoading(true);

      // fetch reports
      const reportRes = await aiApi.get("/paragraphs/get-reports");
      const reportData = reportRes.data || [];

      // fetch all users
      const freshToken = getFromLocalStorage(authKey);
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
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

  useEffect(() => {
    fetchReportsAndUsers();
  }, []);

  const getUserInfo = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return userId;

    return (
      <div className="flex justify-between gap-1">
        <span>
          <strong>{user.name || "Unknown"}</strong>
          {/* <span>- {user.email || "No email"} </span> */}
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
      <p className="flex justify-center items-center  ">No reports found.</p>
    );

  return (
    <div className="overflow-x-auto mt-4 bg-white">
      <h2 className="text-md md:text-2xl lg:text-2xl font-bold mb-4 text-center  py-2 text-white bg-cyan-700  rounded">
        Reports By Users
      </h2>
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
  );
};

export default ReportsByUsers;
