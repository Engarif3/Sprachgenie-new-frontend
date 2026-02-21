import React, { useEffect, useState } from "react";

const AdminVisitorsPage = () => {
  const [visitorsByLocation, setVisitorsByLocation] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationPage, setLocationPage] = useState(1);
  const [locationHasMore, setLocationHasMore] = useState(false);
  const [locationTotal, setLocationTotal] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    type: "", // "all", "location", "visitor"
    data: null,
    inputValue: "",
  });

  const fetchVisitorsByLocation = async (page = 1) => {
    setLocationLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/by-location?page=${page}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        // Replace data with new page (don't append)
        setVisitorsByLocation(data.data?.locations || []);
        setLocationTotal(data.data?.totalLocations || 0);
        setLocationHasMore(data.data?.hasMore || false);
        setLocationPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch visitors by location:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmation.inputValue !== "ok") {
      alert("Please type 'ok' to confirm deletion");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/delete-all`,
        { method: "DELETE" },
      );
      if (res.ok) {
        alert("All visitors deleted successfully!");
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        fetchVisitorsByLocation(1);
      } else {
        alert("Failed to delete visitors");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting visitors");
    }
  };

  const handleDeleteLocation = async (country, city) => {
    if (deleteConfirmation.inputValue !== "ok") {
      alert("Please type 'ok' to confirm deletion");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/delete-by-location`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, city }),
        },
      );
      if (res.ok) {
        alert(`Deleted all visitors from ${country}, ${city}`);
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        fetchVisitorsByLocation(1);
      } else {
        alert("Failed to delete location visitors");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting location visitors");
    }
  };

  const handleDeleteVisitor = async (ipAddress) => {
    if (deleteConfirmation.inputValue !== "ok") {
      alert("Please type 'ok' to confirm deletion");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/delete-by-ip`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ipAddress }),
        },
      );
      if (res.ok) {
        alert(`Deleted visitor ${ipAddress}`);
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        fetchVisitorsByLocation(1);
      } else {
        alert("Failed to delete visitor");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting visitor");
    }
  };

  useEffect(() => {
    fetchVisitorsByLocation(1);
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              🌍 Visitors by Location
            </h1>
            <p className="text-gray-400 mt-2">
              Total locations:{" "}
              <span className="font-bold text-blue-400">{locationTotal}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLocationLoading(true);
                setLocationPage(1);
                fetchVisitorsByLocation(1);
              }}
              disabled={locationLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {locationLoading ? "Refreshing..." : "🔄 Refresh"}
            </button>
            <button
              onClick={() =>
                setDeleteConfirmation({
                  show: true,
                  type: "all",
                  data: null,
                  inputValue: "",
                })
              }
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              🗑️ Delete All
            </button>
          </div>
        </div>

        {/* Content */}
        {locationLoading && locationPage === 1 ? (
          <div className="text-center p-12">
            <p className="text-gray-400 text-lg">Loading location data...</p>
          </div>
        ) : visitorsByLocation.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-400 text-lg">
              No visitor data available yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitorsByLocation.map((location, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      📍 {location.country || "Unknown"},{" "}
                      {location.city || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      {location.count}{" "}
                      {location.count === 1 ? "visitor" : "visitors"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {location.latitude && location.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        View Map ↗
                      </a>
                    )}
                    <button
                      onClick={() =>
                        setDeleteConfirmation({
                          show: true,
                          type: "location",
                          data: {
                            country: location.country,
                            city: location.city,
                          },
                          inputValue: "",
                        })
                      }
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      🗑️ Delete Location
                    </button>
                  </div>
                </div>

                {/* Visitors Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-300">
                    <thead className="bg-gray-800 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          IP Address
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Browser
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Device
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Visited At
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {location.visitors.map((visitor, vIdx) => (
                        <tr
                          key={vIdx}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-gray-400">
                            {visitor.ipAddress}
                          </td>
                          <td className="px-4 py-3">{visitor.browser}</td>
                          <td className="px-4 py-3">{visitor.device}</td>
                          <td className="px-4 py-3">
                            {new Date(visitor.visitedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setDeleteConfirmation({
                                  show: true,
                                  type: "visitor",
                                  data: { ipAddress: visitor.ipAddress },
                                  inputValue: "",
                                })
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <button
                onClick={() => fetchVisitorsByLocation(locationPage - 1)}
                disabled={locationLoading || locationPage === 1}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Previous
              </button>
              <span className="text-gray-300 font-medium text-center flex-1">
                Page{" "}
                <span className="text-blue-400 font-bold">{locationPage}</span>{" "}
                • {locationTotal} total locations
              </span>
              <button
                onClick={() => fetchVisitorsByLocation(locationPage + 1)}
                disabled={locationLoading || !locationHasMore}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-600 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              ⚠️ Confirm Deletion
            </h2>
            <p className="text-gray-300 mb-6">
              {deleteConfirmation.type === "all" &&
                "Are you sure you want to delete ALL visitors? This action cannot be undone."}
              {deleteConfirmation.type === "location" &&
                `Are you sure you want to delete all visitors from ${deleteConfirmation.data?.country}, ${deleteConfirmation.data?.city}? This action cannot be undone.`}
              {deleteConfirmation.type === "visitor" &&
                `Are you sure you want to delete visitor ${deleteConfirmation.data?.ipAddress}? This action cannot be undone.`}
            </p>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">
                Type "ok" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation.inputValue}
                onChange={(e) =>
                  setDeleteConfirmation({
                    ...deleteConfirmation,
                    inputValue: e.target.value,
                  })
                }
                placeholder="Type 'ok' to confirm"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-500"
                onKeyPress={(e) => {
                  if (
                    e.key === "Enter" &&
                    deleteConfirmation.inputValue === "ok"
                  ) {
                    if (deleteConfirmation.type === "all") {
                      handleDeleteAll();
                    } else if (deleteConfirmation.type === "location") {
                      handleDeleteLocation(
                        deleteConfirmation.data.country,
                        deleteConfirmation.data.city,
                      );
                    } else if (deleteConfirmation.type === "visitor") {
                      handleDeleteVisitor(deleteConfirmation.data.ipAddress);
                    }
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirmation({
                    show: false,
                    type: "",
                    data: null,
                    inputValue: "",
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmation.type === "all") {
                    handleDeleteAll();
                  } else if (deleteConfirmation.type === "location") {
                    handleDeleteLocation(
                      deleteConfirmation.data.country,
                      deleteConfirmation.data.city,
                    );
                  } else if (deleteConfirmation.type === "visitor") {
                    handleDeleteVisitor(deleteConfirmation.data.ipAddress);
                  }
                }}
                disabled={deleteConfirmation.inputValue !== "ok"}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitorsPage;
