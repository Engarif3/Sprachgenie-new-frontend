import React, { useEffect, useState } from "react";

// Health check endpoints will be defined in component state

// Example: Health check endpoints (replace with your real endpoints)
const HEALTH_ENDPOINTS = [
  { name: "API Server", url: "/api/health" },
  { name: "Database", url: "/api/db-health" },
  { name: "Auth Service", url: "/api/auth-health" },
];

const AdminSystemStatus = () => {
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [uptimeUrl, setUptimeUrl] = useState("");
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [visitorsLoading, setVisitorsLoading] = useState(true);

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
      setLoading(false);
    };
    fetchHealth();

    // Load saved UptimeRobot URL from localStorage
    const savedUrl = localStorage.getItem("uptimeRobotStatusUrl");
    if (savedUrl) {
      setUptimeUrl(savedUrl);
    }

    // Fetch unique visitors count
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
    fetchUniqueVisitors();
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
                  Last checked: {new Date().toLocaleTimeString()}
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
