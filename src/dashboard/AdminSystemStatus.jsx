import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const HEALTH_ENDPOINTS = [
  { name: "API Server", url: `${import.meta.env.VITE_BACKEND_API_URL}/health` },
  {
    name: "Database",
    url: `${import.meta.env.VITE_BACKEND_API_URL}/db-health`,
  },
  {
    name: "Auth Service",
    url: `${import.meta.env.VITE_BACKEND_API_URL}/auth-health`,
  },
];

const AdminSystemStatus = () => {
  const [health, setHealth] = useState({});
  const [healthTimestamp, setHealthTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uptimeUrl, setUptimeUrl] = useState("");
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: { daily: 0, weekly: 0, monthly: 0, yearly: 0, total: 0 },
    last30Days: {},
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const fetchUniqueVisitors = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/unique-count`,
      );
      if (res.ok) {
        const data = await res.json();
        setUniqueVisitors(data.data?.uniqueCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unique visitors:", error);
    } finally {
      setVisitorsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/analytics`,
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.data || {});
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const fetchHealth = async () => {
      const results = {};
      for (const endpoint of HEALTH_ENDPOINTS) {
        try {
          const res = await fetch(endpoint.url);
          results[endpoint.name] = res.ok ? "UP" : "DOWN";
        } catch {
          results[endpoint.name] = "DOWN";
        }
      }
      setHealth(results);
      setHealthTimestamp(new Date());
      setLoading(false);
    };
    fetchHealth();

    // Refresh health checks every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000);

    // Load saved UptimeRobot URL from localStorage
    const savedUrl = localStorage.getItem("uptimeRobotStatusUrl");
    if (savedUrl) {
      setUptimeUrl(savedUrl);
    }

    fetchUniqueVisitors();
    fetchAnalytics();

    // Cleanup interval on unmount
    return () => clearInterval(healthInterval);
  }, []);

  const handleSaveUptimeUrl = () => {
    if (uptimeUrl) {
      localStorage.setItem("uptimeRobotStatusUrl", uptimeUrl);
      alert("UptimeRobot status page URL saved!");
    }
  };

  // Refresh unique visitors count
  const handleRefreshVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/visitors/unique-count`,
      );
      if (res.ok) {
        const data = await res.json();
        setUniqueVisitors(data.data?.uniqueCount || 0);
      }
    } catch (error) {
      console.error("Failed to refresh visitor count:", error);
    } finally {
      setVisitorsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-8">
      {/* External Uptime Monitoring */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          📊 External Monitoring (UptimeRobot)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter your UptimeRobot Status Page URL:
            </label>
            <input
              type="text"
              placeholder="https://stats.uptimerobot.com/your-status-page"
              value={uptimeUrl}
              onChange={(e) => setUptimeUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveUptimeUrl}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save URL
            </button>
          </div>
          {uptimeUrl && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-300 text-sm font-medium mb-2">
                  ✅ Status Page URL Saved
                </p>
                <p className="text-green-200 text-xs break-all">{uptimeUrl}</p>
              </div>
              <a
                href={uptimeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🌐 View Status Page (opens in new tab)
              </a>
              <p className="text-gray-400 text-xs">
                ℹ️ UptimeRobot status pages cannot be embedded in iframes due to
                security settings. Click the button above to view real-time
                uptime status in a new tab.
              </p>
            </div>
          )}
          {!uptimeUrl && (
            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg space-y-3">
              <p className="text-blue-300 text-sm font-bold">
                💡 How to Get Your Public Status Page URL:
              </p>
              <ol className="list-decimal pl-5 text-blue-300 text-sm space-y-1">
                <li>
                  Log in to{" "}
                  <a
                    href="https://uptimerobot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-200"
                  >
                    UptimeRobot.com
                  </a>
                </li>
                <li>
                  Go to <strong>Status Pages</strong> (in the sidebar)
                </li>
                <li>Click your public status page or create a new one</li>
                <li>
                  Copy the <strong>public status page URL</strong> (it starts
                  with{" "}
                  <code className="bg-gray-800 px-1 rounded">
                    https://stats.uptimerobot.com/
                  </code>
                  )
                </li>
                <li>Paste it in the input field above</li>
              </ol>
              <p className="text-yellow-300 text-xs mt-2 pt-2 border-t border-blue-400">
                ⚠️ <strong>Note:</strong> Make sure you use your PUBLIC status
                page URL (stats.uptimerobot.com), not your dashboard URL
                (dashboard.uptimerobot.com)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Internal Health Checks */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          🖥️ Internal Health Status
        </h2>
        {loading ? (
          <p className="text-gray-400">Loading health checks...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HEALTH_ENDPOINTS.map((ep) => (
              <div
                key={ep.name}
                className="p-4 border rounded-lg"
                style={{
                  borderColor: health[ep.name] === "UP" ? "#10b981" : "#ef4444",
                  backgroundColor:
                    health[ep.name] === "UP"
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                }}
              >
                <p className="text-gray-300 text-sm font-medium mb-2">
                  {ep.name}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    health[ep.name] === "UP" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {health[ep.name]}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last checked:{" "}
                  {healthTimestamp
                    ? healthTimestamp.toLocaleTimeString()
                    : "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unique Visitors by IP */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            👥 Unique Visitors (by IP)
          </h2>
          <button
            onClick={handleRefreshVisitors}
            disabled={visitorsLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {visitorsLoading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
        {visitorsLoading ? (
          <p className="text-gray-400">Loading visitor data...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-blue-500/50 rounded-lg bg-blue-500/10">
              <p className="text-gray-300 text-sm font-medium mb-2">
                Total Unique Visitors
              </p>
              <p className="text-4xl font-bold text-blue-400">
                {uniqueVisitors.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ℹ️ Counted by unique IP address (same IP = one visitor)
              </p>
            </div>
            <div className="p-6 border border-purple-500/50 rounded-lg bg-purple-500/10">
              <p className="text-gray-300 text-sm font-medium mb-2">
                Last Updated
              </p>
              <p className="text-lg font-semibold text-purple-400">
                {new Date().toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ℹ️ Updates on page reload or manual refresh
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visitor Analytics */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            📊 Visitor Analytics
          </h2>
          <button
            onClick={() => {
              setAnalyticsLoading(true);
              fetch(
                `${import.meta.env.VITE_BACKEND_API_URL}/visitors/analytics`,
              )
                .then((res) => res.json())
                .then((data) => {
                  setAnalytics(data.data || {});
                  setAnalyticsLoading(false);
                })
                .catch((err) => {
                  console.error("Failed:", err);
                  setAnalyticsLoading(false);
                });
            }}
            disabled={analyticsLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {analyticsLoading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
        {analyticsLoading ? (
          <p className="text-gray-400">Loading analytics...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg">
              <p className="text-gray-400 text-xs font-medium mb-2">Today</p>
              <p className="text-3xl font-bold text-blue-400">
                {analytics.summary?.daily || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg">
              <p className="text-gray-400 text-xs font-medium mb-2">
                This Week
              </p>
              <p className="text-3xl font-bold text-green-400">
                {analytics.summary?.weekly || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg">
              <p className="text-gray-400 text-xs font-medium mb-2">
                This Month
              </p>
              <p className="text-3xl font-bold text-yellow-400">
                {analytics.summary?.monthly || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg">
              <p className="text-gray-400 text-xs font-medium mb-2">
                This Year
              </p>
              <p className="text-3xl font-bold text-purple-400">
                {analytics.summary?.yearly || 0}
              </p>
            </div>
          </div>
        )}
        <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm font-medium mb-3">
            Last 30 Days Breakdown
          </p>
          <div className="overflow-x-auto">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))",
              }}
            >
              {(() => {
                const entries = Object.entries(analytics.last30Days || {});
                const maxCount = Math.max(
                  ...entries.map(([, count]) => Number(count) || 0),
                  1,
                );

                return entries.map(([date, count]) => {
                  const numCount = Number(count) || 0;
                  const heightPercent = (numCount / maxCount) * 100;

                  return (
                    <div
                      key={date}
                      className="flex flex-col items-center justify-end gap-1"
                    >
                      <span className="text-xs text-white font-semibold h-5 flex items-center">
                        {numCount > 0 ? numCount : ""}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-500 hover:to-blue-300"
                        style={{
                          minHeight: "8px",
                          height: `${Math.max(heightPercent, 8)}px`,
                        }}
                        title={`${new Date(date).toLocaleDateString()}: ${numCount} visitors`}
                      />
                      <p className="text-xs text-gray-400 text-center whitespace-nowrap">
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Visitors by Location - Link to Dedicated Page */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              🌍 Visitors by Location
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Full visitor analytics and detailed location breakdown
            </p>
          </div>
        </div>
        <p className="text-gray-400 mb-4">
          View detailed visitor information grouped by location with pagination,
          IP addresses, browser and device information.
        </p>
        <Link
          to="/dashboard/visitors"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Open Visitors Dashboard →
        </Link>
      </div>

      {/* Analytics Section */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">📈 Analytics</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              Google Analytics
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Set up Google Analytics to track visitor counts, traffic patterns,
              and user behavior.
            </p>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Open Google Analytics →
            </a>
          </div>
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              Plausible Analytics
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Alternative privacy-focused analytics platform for tracking
              visitor data.
            </p>
            <a
              href="https://plausible.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Explore Plausible →
            </a>
          </div>
        </div>
      </div>

      {/* SSL Certificate Status */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          🔒 SSL Certificate Status
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          UptimeRobot monitors your SSL certificate validity and will alert you
          before expiry.
        </p>
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-300 font-medium">
            ✅ SSL is monitored by UptimeRobot
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStatus;
