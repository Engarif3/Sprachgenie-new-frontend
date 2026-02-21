import React, { useEffect, useState } from "react";

const AdminVisitorsPage = () => {
  const [visitorsByLocation, setVisitorsByLocation] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationPage, setLocationPage] = useState(1);
  const [locationHasMore, setLocationHasMore] = useState(false);
  const [locationTotal, setLocationTotal] = useState(0);

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
    </div>
  );
};

export default AdminVisitorsPage;
