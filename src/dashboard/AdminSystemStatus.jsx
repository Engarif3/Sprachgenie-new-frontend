import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../axios";

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

  // New monitoring states
  const [healthMetrics, setHealthMetrics] = useState({});
  const [databaseStats, setDatabaseStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchProtectedResource = async (path, onSuccess, errorMessage) => {
    try {
      const response = await api.get(path);
      onSuccess(response.data?.data);
      return true;
    } catch (error) {
      console.error(errorMessage, error);
      return false;
    }
  };

  const fetchUniqueVisitors = async () => {
    try {
      const response = await api.get("/visitors/unique-count");
      setUniqueVisitors(response.data?.data?.uniqueCount || 0);
    } catch (error) {
      console.error("Failed to fetch unique visitors:", error);
    } finally {
      setVisitorsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/visitors/analytics");
      setAnalytics(response.data?.data || {});
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // New monitoring fetch functions
  const fetchHealthMetrics = async () => {
    return fetchProtectedResource(
      "/health-metrics",
      (data) => setHealthMetrics(data || {}),
      "Failed to fetch health metrics:",
    );
  };

  const fetchDatabaseStats = async () => {
    return fetchProtectedResource(
      "/database-stats",
      (data) => setDatabaseStats(data || {}),
      "Failed to fetch database stats:",
    );
  };

  const fetchSystemStats = async () => {
    return fetchProtectedResource(
      "/system-stats",
      (data) => setSystemStats(data || {}),
      "Failed to fetch system stats:",
    );
  };

  const fetchRateLimitStatus = async () => {
    return fetchProtectedResource(
      "/rate-limit-status",
      (data) => setRateLimitStatus(data || {}),
      "Failed to fetch rate limit status:",
    );
  };

  const fetchErrorLogs = async () => {
    return fetchProtectedResource(
      "/error-logs",
      (data) => setErrorLogs(data?.recent || []),
      "Failed to fetch error logs:",
    );
  };

  const fetchActivityLogs = async () => {
    return fetchProtectedResource(
      "/activity-logs?limit=20",
      (data) => setActivityLogs(data?.recent || []),
      "Failed to fetch activity logs:",
    );
  };

  const fetchAlertHistory = async () => {
    return fetchProtectedResource(
      "/alert-history?limit=20",
      (data) => setAlertHistory(data?.recent || []),
      "Failed to fetch alert history:",
    );
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

    const fetchAllMonitoringData = async () => {
      setMetricsLoading(true);

      try {
        await Promise.allSettled([
          fetchHealthMetrics(),
          fetchDatabaseStats(),
          fetchSystemStats(),
          fetchRateLimitStatus(),
          fetchErrorLogs(),
          fetchActivityLogs(),
          fetchAlertHistory(),
        ]);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchHealth();
    fetchAllMonitoringData();

    // Refresh health checks every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000);

    // Refresh monitoring data every 60 seconds
    const monitoringInterval = setInterval(fetchAllMonitoringData, 60000);

    // Load saved UptimeRobot URL from localStorage
    const savedUrl = localStorage.getItem("uptimeRobotStatusUrl");
    if (savedUrl) {
      setUptimeUrl(savedUrl);
    }

    fetchUniqueVisitors();
    fetchAnalytics();

    // Cleanup intervals on unmount
    return () => {
      clearInterval(healthInterval);
      clearInterval(monitoringInterval);
    };
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
    await fetchUniqueVisitors();
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
            onClick={fetchAnalytics}
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

      {/* Response Time Metrics */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          ⏱️ Response Time Metrics
        </h2>
        {metricsLoading ? (
          <p className="text-gray-400">Loading metrics...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-gray-300 text-sm font-medium mb-2">
                API Server
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {healthMetrics.apiServer?.responseTime || "N/A"}
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-gray-300 text-sm font-medium mb-2">Database</p>
              <p className="text-2xl font-bold text-green-400">
                {healthMetrics.database?.responseTime || "N/A"}
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-gray-300 text-sm font-medium mb-2">
                Auth Service
              </p>
              <p className="text-2xl font-bold text-purple-400">
                {healthMetrics.authService?.responseTime || "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          🗄️ Database Statistics
        </h2>
        {databaseStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm mb-3 font-medium">
                  Record Counts
                </p>
                <div className="space-y-4">
                  {/* Users Count */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Users</span>
                      <span className="text-blue-400 font-bold">
                        {databaseStats.recordCounts?.users || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(((databaseStats.recordCounts?.users || 0) / 100) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Words Count */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Words</span>
                      <span className="text-green-400 font-bold">
                        {databaseStats.recordCounts?.words || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${Math.min(((databaseStats.recordCounts?.words || 0) / 5000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm mb-3 font-medium">
                  Performance
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Query Time</span>
                      <span className="text-yellow-400 font-bold">
                        {databaseStats.performance?.queryTime}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseInt(databaseStats.performance?.queryTime || 0) >
                          100
                            ? "bg-red-500"
                            : parseInt(
                                  databaseStats.performance?.queryTime || 0,
                                ) > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min((parseInt(databaseStats.performance?.queryTime || 0) / 200) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs">
                      {parseInt(databaseStats.performance?.queryTime || 0) > 100
                        ? "⚠️ High latency"
                        : "✅ Good performance"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Loading database stats...</p>
        )}
      </div>

      {/* System Resource Usage */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          💻 System Resource Usage
        </h2>
        {systemStats ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 text-sm font-medium mb-3">
                Server Memory Usage (System-Level)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">
                    Usage: {systemStats.memory?.usagePercent}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(systemStats.memory?.usagePercent) > 80
                        ? "bg-red-500"
                        : parseFloat(systemStats.memory?.usagePercent) > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${parseFloat(systemStats.memory?.usagePercent)}%`,
                    }}
                  />
                </div>
                <p className="text-gray-400 text-xs">
                  {systemStats.memory?.used} / {systemStats.memory?.total}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 text-sm font-medium mb-3">
                {systemStats.vercel
                  ? "⚡ Vercel Serverless Metrics"
                  : "CPU Information"}
              </p>
              <div className="space-y-4">
                {systemStats.vercel ? (
                  // Vercel-specific metrics
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Runtime</p>
                        <p className="text-gray-300 font-mono text-sm">
                          {systemStats.vercel.runtime}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">
                          Memory Limit (Vercel)
                        </p>
                        <p className="text-gray-300 font-mono text-sm mb-2">
                          {systemStats.vercel.memoryLimit}
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (parseFloat(systemStats.memory?.used) / 512) *
                                100 >
                              80
                                ? "bg-red-500"
                                : (parseFloat(systemStats.memory?.used) / 512) *
                                      100 >
                                    60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${(parseFloat(systemStats.memory?.used) / 512) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          {systemStats.memory?.used} used
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">
                          Environment
                        </p>
                        <p className="text-green-400 text-sm font-medium">
                          {systemStats.vercel.environment_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Uptime</p>
                        <p className="text-blue-400 text-sm font-medium">
                          {systemStats.vercel.functionUptime}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                      <p className="text-blue-200 text-xs">
                        {systemStats.vercel.note}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Traditional server metrics
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">CPU Cores</p>
                        <p className="text-gray-300 font-mono text-sm">
                          {systemStats.cpu?.cores}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">CPU Model</p>
                        <p className="text-gray-300 font-mono text-sm">
                          {systemStats.cpu?.model}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">
                          Memory Used
                        </p>
                        <p className="text-blue-400 font-mono text-sm">
                          {systemStats.memory?.used}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">
                          Memory Total
                        </p>
                        <p className="text-blue-400 font-mono text-sm">
                          {systemStats.memory?.total}
                        </p>
                      </div>
                    </div>

                    {/* Load Average Visualization */}
                    <div className="space-y-3">
                      <p className="text-gray-300 font-medium text-sm">
                        Load Average (1/5/15 min)
                      </p>

                      {/* 1 Min */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">1 min</span>
                          <span className="font-mono text-gray-300">
                            {systemStats.cpu?.loadAverage?.["1min"]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(
                                systemStats.cpu?.loadAverage?.["1min"],
                              ) > 2
                                ? "bg-red-500"
                                : parseFloat(
                                      systemStats.cpu?.loadAverage?.["1min"],
                                    ) > 1
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(parseFloat(systemStats.cpu?.loadAverage?.["1min"]) * 33, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 5 Min */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">5 min</span>
                          <span className="font-mono text-gray-300">
                            {systemStats.cpu?.loadAverage?.["5min"]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(
                                systemStats.cpu?.loadAverage?.["5min"],
                              ) > 2
                                ? "bg-red-500"
                                : parseFloat(
                                      systemStats.cpu?.loadAverage?.["5min"],
                                    ) > 1
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(parseFloat(systemStats.cpu?.loadAverage?.["5min"]) * 33, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 15 Min */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">15 min</span>
                          <span className="font-mono text-gray-300">
                            {systemStats.cpu?.loadAverage?.["15min"]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(
                                systemStats.cpu?.loadAverage?.["15min"],
                              ) > 2
                                ? "bg-red-500"
                                : parseFloat(
                                      systemStats.cpu?.loadAverage?.["15min"],
                                    ) > 1
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(parseFloat(systemStats.cpu?.loadAverage?.["15min"]) * 33, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-gray-400 text-xs pt-2 border-t border-gray-700">
                        💡 Green = Healthy | Yellow = Moderate | Red = High load
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!systemStats.vercel && (
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-300">
                  Server Uptime:{" "}
                  <span className="text-purple-400 font-bold">
                    {systemStats.uptime}
                  </span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Loading system stats...</p>
        )}
      </div>

      {/* Rate Limiting Status */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          🔄 Rate Limiting Status
        </h2>
        {rateLimitStatus ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-300 font-medium">
                ✅ Rate Limiting Active
              </p>
            </div>

            {/* Global Rate Limit */}
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 text-sm font-medium mb-3">
                Global Limit
              </p>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">
                  {rateLimitStatus.global?.limit}
                </p>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>
                    {rateLimitStatus.global?.current} /{" "}
                    {rateLimitStatus.global?.limit?.split(" ")[0] || "1000"}{" "}
                    used
                  </span>
                  <span>Reset in {rateLimitStatus.global?.resetIn}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${
                        (rateLimitStatus.global?.current /
                          (rateLimitStatus.global?.limit?.split(" ")[0] ||
                            1000)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Per IP and Per User Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm font-medium mb-3">
                  Per IP Limit
                </p>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    {rateLimitStatus.perIP?.limit}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Active IPs</span>
                      <span className="text-blue-400 font-bold text-sm">
                        {rateLimitStatus.perIP?.activeTracking}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          (rateLimitStatus.perIP?.activeTracking || 0) > 50
                            ? "bg-red-500"
                            : (rateLimitStatus.perIP?.activeTracking || 0) > 20
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min((rateLimitStatus.perIP?.activeTracking || 0) * 2, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm font-medium mb-3">
                  Per User Limit
                </p>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    {rateLimitStatus.perUser?.limit}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">
                        Active Users
                      </span>
                      <span className="text-purple-400 font-bold text-sm">
                        {rateLimitStatus.perUser?.activeTracking}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          (rateLimitStatus.perUser?.activeTracking || 0) > 20
                            ? "bg-red-500"
                            : (rateLimitStatus.perUser?.activeTracking || 0) > 5
                              ? "bg-yellow-500"
                              : "bg-purple-500"
                        }`}
                        style={{
                          width: `${Math.min((rateLimitStatus.perUser?.activeTracking || 0) * 5, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Loading rate limit status...</p>
        )}
      </div>

      {/* Alert History */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">🚨 Alert History</h2>
        {alertHistory.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alertHistory.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  alert.severity === "high"
                    ? "bg-red-500/10 border-red-500/30"
                    : alert.severity === "medium"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 font-medium text-sm">
                      {alert.type}
                    </p>
                    <p className="text-gray-400 text-xs">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No alerts recorded</p>
        )}
      </div>

      {/* Error Logs */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          ❌ Recent Error Logs
        </h2>
        {errorLogs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errorLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-red-300 font-medium text-sm">
                      {log.service}
                    </p>
                    <p className="text-gray-400 text-xs font-mono">
                      {log.error}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No errors recorded</p>
        )}
      </div>

      {/* Activity Logs */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          📝 Recent Activity
        </h2>
        {activityLogs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activityLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-300 font-medium">{log.action}</p>
                    <p className="text-gray-400 text-xs">
                      {JSON.stringify(log.details).substring(0, 100)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No activity recorded</p>
        )}
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
