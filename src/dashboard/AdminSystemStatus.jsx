import React, { useEffect, useState } from "react";
import api from "../axios";

const DECLARED_SYSTEMS = {
  frontend: {
    label: "Frontend",
    provider: "Netlify",
    primary: "https://simplegerman.de",
    location: "Global edge network",
    secondary: "Public web app and CDN delivery",
    details: [
      "Hosting: Netlify",
      "Role: Browser frontend",
      "Surface: Public website",
    ],
  },
  backend: {
    label: "Backend API",
    provider: "Vercel",
    primary: "https://api.simplegerman.de/api/v1",
    location: "Vercel runtime region",
    secondary: "Serverless API runtime",
    details: [
      "Hosting: Vercel",
      "Role: API and auth",
      "Runtime: Node.js serverless functions",
    ],
  },
  database: {
    label: "Database / VPS",
    provider: "IONOS",
    primary: "212.227.139.14",
    location: "Berlin, Germany",
    secondary: "Ubuntu 24.04, Germany (Berlin)",
    details: [
      "Plan: vps 2 2 80",
      "CPU: 2 vCore",
      "RAM: 2 GB",
      "Disk: 80 GB NVMe SSD",
    ],
  },
};

const FRONTEND_BUILD_INFO = {
  version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0",
  builtAt:
    typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "Unavailable",
  context:
    typeof __NETLIFY_CONTEXT__ !== "undefined"
      ? __NETLIFY_CONTEXT__
      : "unknown",
  deployUrl:
    typeof __NETLIFY_DEPLOY_URL__ !== "undefined" ? __NETLIFY_DEPLOY_URL__ : "",
  branch: typeof __NETLIFY_BRANCH__ !== "undefined" ? __NETLIFY_BRANCH__ : "",
  commitRef:
    typeof __NETLIFY_COMMIT_REF__ !== "undefined" ? __NETLIFY_COMMIT_REF__ : "",
};

const getShortCommitRef = (value) => {
  if (!value) {
    return "N/A";
  }

  return value.slice(0, 7);
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim();

  return normalized !== "" && normalized !== "N/A" && normalized !== "unknown";
};

const hasMeaningfulFrontendVersion = (value) => {
  if (!hasMeaningfulValue(value)) {
    return false;
  }

  return String(value).trim() !== "0.0.0";
};

const getFrontendSystemInfo = () => {
  if (typeof window === "undefined") {
    return {
      provider: "Browser Frontend",
      environment: import.meta.env.DEV ? "development" : "production",
      origin: "Unknown",
      version: FRONTEND_BUILD_INFO.version,
      deployContext: FRONTEND_BUILD_INFO.context,
      deployUrl: FRONTEND_BUILD_INFO.deployUrl,
      branch: FRONTEND_BUILD_INFO.branch,
      commitRef: FRONTEND_BUILD_INFO.commitRef,
      builtAt: FRONTEND_BUILD_INFO.builtAt,
      note: "Frontend metrics are only available in the browser context.",
    };
  }

  const hostname = window.location.hostname;
  const isLocalEnvironment = /^(localhost|127\.0\.0\.1)$/i.test(hostname);

  return {
    provider: isLocalEnvironment ? "Local Vite Frontend" : "Browser Frontend",
    isLocalEnvironment,
    environment: import.meta.env.DEV ? "development" : "production",
    origin: window.location.origin,
    version: FRONTEND_BUILD_INFO.version,
    deployContext: FRONTEND_BUILD_INFO.context,
    deployUrl: FRONTEND_BUILD_INFO.deployUrl,
    branch: FRONTEND_BUILD_INFO.branch,
    commitRef: FRONTEND_BUILD_INFO.commitRef,
    builtAt: FRONTEND_BUILD_INFO.builtAt,
    note: isLocalEnvironment
      ? "You are viewing this dashboard from a local development frontend. Browser apps do not expose host CPU or RAM metrics."
      : "Frontend hosting runs in the browser context, so this dashboard shows origin and deployment context rather than host CPU or RAM.",
  };
};

const getBackendOrigin = () => {
  const baseUrl =
    import.meta.env.VITE_BACKEND_API_URL || api.defaults.baseURL || "";

  if (!baseUrl) {
    return "Unknown";
  }

  try {
    return new URL(baseUrl).origin;
  } catch (_error) {
    return baseUrl;
  }
};

const getHostFromUrl = (value) => {
  if (!value) {
    return "Unknown";
  }

  try {
    return new URL(value).host;
  } catch (_error) {
    return value;
  }
};

const getReadableVercelRegion = (value) => {
  if (!value) {
    return "Vercel region unavailable";
  }

  const normalized = String(value).trim().toLowerCase();
  const knownRegions = {
    fra1: "Frankfurt, Germany",
    cdg1: "Paris, France",
    dub1: "Dublin, Ireland",
    iad1: "Washington, DC, USA",
    cle1: "Cleveland, USA",
    pdx1: "Portland, USA",
    sfo1: "San Francisco, USA",
    gru1: "Sao Paulo, Brazil",
    hnd1: "Tokyo, Japan",
    sin1: "Singapore",
    syd1: "Sydney, Australia",
  };

  if (knownRegions[normalized]) {
    return `${knownRegions[normalized]} (${normalized})`;
  }

  return value;
};

const parseUsagePercent = (value) => {
  const parsed = Number(String(value || "").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const getUsageTextClass = (value) => {
  const percent = parseUsagePercent(value);

  if (percent === null) {
    return "text-gray-200";
  }

  if (percent >= 85) {
    return "text-rose-300";
  }

  if (percent >= 65) {
    return "text-amber-300";
  }

  return "text-emerald-300";
};

const getUsageSeverity = (value) => {
  const percent = parseUsagePercent(value);

  if (percent === null) {
    return "unknown";
  }

  if (percent >= 85) {
    return "critical";
  }

  if (percent >= 65) {
    return "warning";
  }

  return "healthy";
};

const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case "critical":
      return "bg-rose-500/20 text-rose-200 border border-rose-500/30";
    case "warning":
      return "bg-amber-500/20 text-amber-200 border border-amber-500/30";
    case "healthy":
      return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";
    default:
      return "bg-gray-500/20 text-gray-200 border border-gray-500/30";
  }
};

const getSeverityLabel = (severity) => {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "healthy":
      return "Healthy";
    default:
      return "Unknown";
  }
};

const parseMegabytes = (value) => {
  const matched = String(value || "").match(/([\d.]+)\s*MB/i);
  return matched ? Number(matched[1]) : null;
};

const parseSizeToMb = (value) => {
  const matched = String(value || "").match(
    /([\d.]+)\s*(K|KB|M|MB|G|GB|T|TB)/i,
  );

  if (!matched) {
    return null;
  }

  const numericValue = Number(matched[1]);
  const unit = matched[2].toUpperCase();

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  switch (unit) {
    case "K":
    case "KB":
      return numericValue / 1024;
    case "M":
    case "MB":
      return numericValue;
    case "G":
    case "GB":
      return numericValue * 1024;
    case "T":
    case "TB":
      return numericValue * 1024 * 1024;
    default:
      return null;
  }
};

const formatSizeFromMb = (value) => {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} TB`;
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(2)} GB`;
  }

  return `${value.toFixed(2)} MB`;
};

const clampPercent = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
};

const getResponseSeverity = (value) => {
  const responseTime = Number(String(value || "").replace("ms", ""));

  if (!Number.isFinite(responseTime)) {
    return "unknown";
  }

  if (responseTime >= 1000) {
    return "critical";
  }

  if (responseTime >= 350) {
    return "warning";
  }

  return "healthy";
};

const formatMetricTimestamp = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const MetricProgressCard = ({
  label,
  percent,
  used,
  free,
  total,
  accentClass,
  barClass,
  subtitle,
}) => {
  const safePercent = clampPercent(percent);

  return (
    <div className="min-h-[170px] rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <p className={`text-base font-semibold ${accentClass}`}>
          {Number.isFinite(percent) ? `${safePercent.toFixed(2)}%` : "N/A"}
        </p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-800/90">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-400">
        <div>
          <p>Used</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {used || "N/A"}
          </p>
        </div>
        <div>
          <p>Free</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {free || "N/A"}
          </p>
        </div>
        <div>
          <p>Total</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {total || "N/A"}
          </p>
        </div>
      </div>

      {subtitle ? (
        <p className="mt-3 text-xs leading-5 text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
};

const getOverallSystemSeverity = (metrics) => {
  if (!metrics) {
    return "unknown";
  }

  const severities = [
    getUsageSeverity(metrics.cpu?.usagePercent),
    getUsageSeverity(metrics.memory?.usagePercent),
    getUsageSeverity(metrics.disk?.usagePercent),
    getUsageSeverity(metrics.postgres?.usagePercent),
  ];

  if (severities.includes("critical")) {
    return "critical";
  }

  if (severities.includes("warning")) {
    return "warning";
  }

  if (severities.includes("healthy")) {
    return "healthy";
  }

  return "unknown";
};

const HEALTH_ENDPOINTS = [
  { name: "API Server", url: `${import.meta.env.VITE_BACKEND_API_URL}/health` },
  {
    name: "Database",
    url: `${import.meta.env.VITE_BACKEND_API_URL}/db-health`,
  },
  {
    name: "Auth Check",
    url: `${import.meta.env.VITE_BACKEND_API_URL}/auth-health`,
  },
];

const AdminSystemStatus = () => {
  const frontendSystemInfo = getFrontendSystemInfo();
  const backendOrigin = getBackendOrigin();
  const observedBackendHost = getHostFromUrl(backendOrigin);
  const declaredBackendHost = getHostFromUrl(DECLARED_SYSTEMS.backend.primary);
  const isObservedBackendProduction =
    observedBackendHost === declaredBackendHost;
  const hasFrontendDeployContext = hasMeaningfulValue(
    frontendSystemInfo.deployContext,
  );
  const hasFrontendVersion = hasMeaningfulFrontendVersion(
    frontendSystemInfo.version,
  );
  const hasFrontendCommitRef = hasMeaningfulValue(frontendSystemInfo.commitRef);
  const hasFrontendDeployUrl = hasMeaningfulValue(frontendSystemInfo.deployUrl);
  const hasFrontendBranch = hasMeaningfulValue(frontendSystemInfo.branch);
  const [health, setHealth] = useState({});
  const [healthTimestamp, setHealthTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);

  // New monitoring states
  const [healthMetrics, setHealthMetrics] = useState({});
  const [databaseStats, setDatabaseStats] = useState(null);
  const [infrastructureStatus, setInfrastructureStatus] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isInfrastructureCheckModalOpen, setIsInfrastructureCheckModalOpen] =
    useState(false);
  const [expandedSystems, setExpandedSystems] = useState({
    frontend: false,
    backend: false,
    database: false,
  });

  const frontendResponseSeverity = getResponseSeverity(
    infrastructureStatus?.frontend?.responseTime,
  );
  const backendRuntime = infrastructureStatus?.backend?.runtime;
  const backendHeapUsedMb = parseMegabytes(
    backendRuntime?.processMemory?.heapUsed,
  );
  const backendHeapTotalMb = parseMegabytes(
    backendRuntime?.processMemory?.heapTotal,
  );
  const backendRssMb = parseMegabytes(backendRuntime?.processMemory?.rss);
  const backendHeapPressurePercent =
    backendHeapUsedMb !== null &&
    backendHeapTotalMb !== null &&
    backendHeapTotalMb > 0
      ? clampPercent((backendHeapUsedMb / backendHeapTotalMb) * 100)
      : null;
  const backendResponseSeverity = getResponseSeverity(
    infrastructureStatus?.backend?.responseTime,
  );
  const vpsMetrics = infrastructureStatus?.databaseServer?.vpsMetrics;
  const vpsMetricsData = vpsMetrics?.metrics;
  const vpsOverallSeverity = getOverallSystemSeverity(vpsMetricsData);
  const backendLocation = getReadableVercelRegion(backendRuntime?.region);
  const backendHeapFreeMb =
    backendHeapUsedMb !== null &&
    backendHeapTotalMb !== null &&
    backendHeapTotalMb >= backendHeapUsedMb
      ? backendHeapTotalMb - backendHeapUsedMb
      : null;
  const vpsMemoryUsedMb = parseSizeToMb(vpsMetricsData?.memory?.used);
  const vpsMemoryTotalMb = parseSizeToMb(vpsMetricsData?.memory?.total);
  const vpsMemoryFreeMb =
    vpsMemoryUsedMb !== null &&
    vpsMemoryTotalMb !== null &&
    vpsMemoryTotalMb >= vpsMemoryUsedMb
      ? vpsMemoryTotalMb - vpsMemoryUsedMb
      : null;
  const vpsDiskUsedMb = parseSizeToMb(vpsMetricsData?.disk?.used);
  const vpsDiskTotalMb = parseSizeToMb(vpsMetricsData?.disk?.total);
  const vpsDiskFreeMb =
    parseSizeToMb(vpsMetricsData?.disk?.available) ??
    (vpsDiskUsedMb !== null &&
    vpsDiskTotalMb !== null &&
    vpsDiskTotalMb >= vpsDiskUsedMb
      ? vpsDiskTotalMb - vpsDiskUsedMb
      : null);
  const postgresActiveConnections = Number(
    vpsMetricsData?.postgres?.activeConnections,
  );
  const postgresMaxConnections = Number(
    vpsMetricsData?.postgres?.maxConnections,
  );
  const postgresFreeConnections =
    Number.isFinite(postgresActiveConnections) &&
    Number.isFinite(postgresMaxConnections)
      ? Math.max(0, postgresMaxConnections - postgresActiveConnections)
      : null;

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

  const fetchInfrastructureStatus = async () => {
    return fetchProtectedResource(
      "/infrastructure-status",
      (data) => setInfrastructureStatus(data || null),
      "Failed to fetch infrastructure status:",
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
          fetchInfrastructureStatus(),
          fetchHealthMetrics(),
          fetchDatabaseStats(),
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

    // Cleanup intervals on unmount
    return () => {
      clearInterval(healthInterval);
      clearInterval(monitoringInterval);
    };
  }, []);

  const toggleSystemDetails = (systemKey) => {
    setExpandedSystems((currentSystems) => ({
      ...currentSystems,
      [systemKey]: !currentSystems[systemKey],
    }));
  };

  return (
    <div className="space-y-6 py-8">
      <div className="max-w-6xl mx-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Admin Monitoring
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              System Status Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Review production system health, database status, rate limits,
              alerts, and operational activity from a single monitoring page.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-gray-300">
            Last health refresh: {formatMetricTimestamp(healthTimestamp)}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Response Time Metrics */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
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
                <p className="text-gray-300 text-sm font-medium mb-2">
                  Latest DB Ping
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {healthMetrics.database?.responseTime || "N/A"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Simple database ping using a lightweight check
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Checked:{" "}
                  {formatMetricTimestamp(healthMetrics.database?.lastCheck)}
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-gray-300 text-sm font-medium mb-2">
                  Auth Check
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {healthMetrics.authService?.responseTime || "N/A"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Measures a user lookup used by the auth flow
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Live Production Systems Status */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">
              🚦 Live Production Systems Status
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Start here for the current production picture across frontend,
              backend, and database or VPS infrastructure.
            </p>
          </div>

          {!infrastructureStatus ? (
            <p className="text-gray-400">Loading production system status...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      Frontend
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {infrastructureStatus.frontend?.provider || "Unknown"}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      infrastructureStatus.frontend?.status === "UP"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {infrastructureStatus.frontend?.status || "Unknown"}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Public URL
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {infrastructureStatus.frontend?.publicUrl || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Response
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${getUsageTextClass(
                          frontendResponseSeverity === "critical"
                            ? "100%"
                            : frontendResponseSeverity === "warning"
                              ? "70%"
                              : "20%",
                        )}`}
                      >
                        {infrastructureStatus.frontend?.responseTime || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {getSeverityLabel(frontendResponseSeverity)} latency
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Location
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {DECLARED_SYSTEMS.frontend.location}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Edge delivery near the visitor
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Build
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {hasFrontendVersion
                          ? `v${frontendSystemInfo.version}`
                          : "Production build"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {hasFrontendCommitRef
                          ? `${getShortCommitRef(frontendSystemInfo.commitRef)} commit`
                          : "Metadata unavailable locally"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleSystemDetails("frontend")}
                      className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                    >
                      {expandedSystems.frontend ? "Show less" : "Show more"}
                    </button>
                  </div>

                  {expandedSystems.frontend ? (
                    <>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                              Netlify Delivery
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-white">
                              {infrastructureStatus.frontend?.provider ||
                                "Netlify"}
                            </h4>
                            <p className="mt-1 text-xs leading-6 text-gray-400">
                              Production site delivery for{" "}
                              {DECLARED_SYSTEMS.frontend.primary}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-gray-500">
                              Last checked{" "}
                              {formatMetricTimestamp(
                                infrastructureStatus.frontend?.checkedAt,
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getSeverityBadgeClass(
                                frontendResponseSeverity,
                              )}`}
                            >
                              Edge {getSeverityLabel(frontendResponseSeverity)}
                            </span>
                            {frontendSystemInfo.isLocalEnvironment ? (
                              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-gray-200">
                                Dashboard opened locally
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-gray-400">Response</p>
                            <p
                              className={`mt-1 text-base font-semibold ${getUsageTextClass(
                                frontendResponseSeverity === "critical"
                                  ? "100%"
                                  : frontendResponseSeverity === "warning"
                                    ? "70%"
                                    : "20%",
                              )}`}
                            >
                              {infrastructureStatus.frontend?.responseTime ||
                                "N/A"}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">
                              {getSeverityLabel(frontendResponseSeverity)}{" "}
                              latency
                            </p>
                          </div>
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-gray-400">Location</p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {DECLARED_SYSTEMS.frontend.location}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">
                              {hasFrontendDeployContext
                                ? `${frontendSystemInfo.deployContext} deploy`
                                : "Served from Netlify edge nodes"}
                            </p>
                          </div>
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-gray-400">Primary Domain</p>
                            <p className="mt-1 text-base font-semibold text-white break-all">
                              {DECLARED_SYSTEMS.frontend.primary}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">
                              Netlify production hostname
                            </p>
                          </div>
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-gray-400">Build Version</p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {hasFrontendVersion
                                ? `v${frontendSystemInfo.version}`
                                : "Production build"}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">
                              {hasFrontendCommitRef
                                ? `${getShortCommitRef(frontendSystemInfo.commitRef)} commit`
                                : "Build metadata unavailable in local dev"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-md border border-white/10 bg-black/20 p-3 text-gray-200">
                            <p>
                              Public URL:{" "}
                              <span className="font-mono text-white break-all">
                                {infrastructureStatus.frontend?.publicUrl ||
                                  "N/A"}
                              </span>
                            </p>
                            <p className="mt-2">
                              Provider:{" "}
                              <span className="text-white">
                                {infrastructureStatus.frontend?.provider ||
                                  "N/A"}
                              </span>
                            </p>
                            {frontendSystemInfo.isLocalEnvironment ? (
                              <p className="mt-2 text-gray-400">
                                This dashboard is open from localhost, but the
                                monitored frontend target remains the production
                                site above.
                              </p>
                            ) : null}
                          </div>
                          {hasFrontendDeployUrl ||
                          hasFrontendBranch ||
                          hasFrontendVersion ? (
                            <div className="rounded-md border border-white/10 bg-black/20 p-3 text-gray-200">
                              {hasFrontendDeployUrl ? (
                                <p>
                                  Deploy URL:{" "}
                                  <span className="font-mono text-white break-all">
                                    {frontendSystemInfo.deployUrl}
                                  </span>
                                </p>
                              ) : null}
                              {hasFrontendBranch ? (
                                <p
                                  className={
                                    hasFrontendDeployUrl ? "mt-2" : undefined
                                  }
                                >
                                  Branch:{" "}
                                  <span className="text-white">
                                    {frontendSystemInfo.branch}
                                  </span>
                                </p>
                              ) : null}
                              {hasFrontendVersion ? (
                                <p
                                  className={
                                    hasFrontendDeployUrl || hasFrontendBranch
                                      ? "mt-2"
                                      : undefined
                                  }
                                >
                                  Built:{" "}
                                  <span className="text-white">
                                    {formatMetricTimestamp(
                                      frontendSystemInfo.builtAt,
                                    )}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="rounded-md border border-white/10 bg-black/20 p-3 text-gray-300">
                            <p className="leading-6">
                              Netlify exposes site availability and delivery
                              performance, but browser-hosted frontends do not
                              expose host machine CPU, disk, memory, or process
                              lists.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs leading-6 text-gray-400">
                        {infrastructureStatus.frontend?.note}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                      Backend API
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {infrastructureStatus.backend?.provider || "Unknown"}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      infrastructureStatus.backend?.status === "UP"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {infrastructureStatus.backend?.status || "Unknown"}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        API URL
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {infrastructureStatus.backend?.publicUrl || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Response
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${getUsageTextClass(
                          backendResponseSeverity === "critical"
                            ? "100%"
                            : backendResponseSeverity === "warning"
                              ? "70%"
                              : "20%",
                        )}`}
                      >
                        {infrastructureStatus.backend?.responseTime || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {getSeverityLabel(backendResponseSeverity)} latency
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Memory
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {backendRuntime?.processMemory?.rss || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        RSS memory observed
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Location
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {backendLocation}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Node {backendRuntime?.nodeVersion || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleSystemDetails("backend")}
                      className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/20"
                    >
                      {expandedSystems.backend ? "Show less" : "Show more"}
                    </button>
                  </div>

                  {expandedSystems.backend && backendRuntime ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                            Function Runtime
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-white">
                            {backendRuntime.provider || "Backend Runtime"}
                          </h4>
                          <p className="mt-1 text-xs leading-6 text-gray-400">
                            {backendRuntime.runtimeType || "Runtime"} in{" "}
                            {backendRuntime.environment || "unknown"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-gray-200">
                            {backendLocation}
                          </span>
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-[11px] font-semibold text-blue-100">
                            Node {backendRuntime.nodeVersion || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-md border border-white/10 bg-black/20 p-3">
                          <p className="text-gray-400">Response</p>
                          <p
                            className={`mt-1 text-base font-semibold ${getUsageTextClass(
                              backendResponseSeverity === "critical"
                                ? "100%"
                                : backendResponseSeverity === "warning"
                                  ? "70%"
                                  : "20%",
                            )}`}
                          >
                            {infrastructureStatus.backend?.responseTime ||
                              "N/A"}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            {getSeverityLabel(backendResponseSeverity)} latency
                          </p>
                        </div>
                        <MetricProgressCard
                          label="Heap Memory"
                          percent={backendHeapPressurePercent}
                          used={backendRuntime.processMemory?.heapUsed}
                          free={
                            backendHeapFreeMb !== null
                              ? formatSizeFromMb(backendHeapFreeMb)
                              : "N/A"
                          }
                          total={backendRuntime.processMemory?.heapTotal}
                          accentClass={getUsageTextClass(
                            backendHeapPressurePercent !== null
                              ? `${backendHeapPressurePercent.toFixed(2)}%`
                              : null,
                          )}
                          barClass={
                            backendHeapPressurePercent !== null &&
                            backendHeapPressurePercent >= 85
                              ? "bg-rose-400"
                              : backendHeapPressurePercent !== null &&
                                  backendHeapPressurePercent >= 65
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }
                          subtitle="Used / free / total heap inside the current function instance"
                        />
                        <div className="rounded-md border border-white/10 bg-black/20 p-3">
                          <p className="text-gray-400">RSS Memory</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {backendRuntime.processMemory?.rss || "N/A"}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            Resident process memory
                          </p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-black/20 p-3">
                          <p className="text-gray-400">Location</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {backendLocation}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            {backendRuntime.functionUptime ||
                              "Current function instance"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                        <div className="rounded-md border border-white/10 bg-black/20 p-3 text-gray-200">
                          <p>
                            Deployment:{" "}
                            <span className="font-mono text-white break-all">
                              {backendRuntime.deploymentUrl || "N/A"}
                            </span>
                          </p>
                          <p className="mt-2">
                            Platform:{" "}
                            <span className="text-white">
                              {backendRuntime.platform || "N/A"} /{" "}
                              {backendRuntime.arch || "N/A"}
                            </span>
                          </p>
                          <p className="mt-2">
                            Service memory:{" "}
                            <span className="text-white">
                              {backendRssMb !== null
                                ? `${backendRssMb.toFixed(2)} MB observed`
                                : "N/A"}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-black/20 p-3 text-gray-300">
                          <p className="leading-6">{backendRuntime.note}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {expandedSystems.backend ? (
                    <p className="text-xs leading-6 text-gray-400">
                      {infrastructureStatus.backend?.note}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Database / VPS
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {infrastructureStatus.databaseServer?.provider ||
                        "Unknown"}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      infrastructureStatus.databaseServer?.databaseStatus ===
                      "UP"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {infrastructureStatus.databaseServer?.databaseStatus ||
                      "Unknown"}
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Host
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {infrastructureStatus.databaseServer?.host || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {DECLARED_SYSTEMS.database.location} • Infrastructure
                        check{" "}
                        {infrastructureStatus.databaseServer
                          ?.databaseResponseTime || "N/A"}{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setIsInfrastructureCheckModalOpen(true)
                          }
                          className="ml-1 inline-flex rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
                        >
                          More
                        </button>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Checked:{" "}
                        {formatMetricTimestamp(
                          infrastructureStatus.databaseServer?.checkedAt,
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        CPU
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${getUsageTextClass(vpsMetricsData?.cpu?.usagePercent)}`}
                      >
                        {vpsMetricsData?.cpu?.usagePercent || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Host usage</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        RAM
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${getUsageTextClass(vpsMetricsData?.memory?.usagePercent)}`}
                      >
                        {vpsMetricsData?.memory?.usagePercent || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {vpsMetricsData?.memory?.used || "N/A"}
                        {vpsMetricsData?.memory?.total
                          ? ` / ${vpsMetricsData.memory.total}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        DB Pressure
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${getUsageTextClass(vpsMetricsData?.postgres?.usagePercent)}`}
                      >
                        {vpsMetricsData?.postgres?.usagePercent || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {vpsMetricsData?.postgres?.activeConnections || "N/A"} /{" "}
                        {vpsMetricsData?.postgres?.maxConnections || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleSystemDetails("database")}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20"
                    >
                      {expandedSystems.database ? "Show less" : "Show more"}
                    </button>
                  </div>

                  {expandedSystems.database &&
                  vpsMetrics?.configured &&
                  vpsMetricsData ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                            IONOS Host Overview
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-white">
                            {vpsMetricsData.server?.hostname || "IONOS VPS"}
                          </h4>
                          <p className="mt-1 text-xs leading-6 text-gray-400">
                            Last updated{" "}
                            {formatMetricTimestamp(vpsMetrics?.checkedAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getSeverityBadgeClass(
                              vpsOverallSeverity,
                            )}`}
                          >
                            {getSeverityLabel(vpsOverallSeverity)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-gray-200">
                            Endpoint {vpsMetrics.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] md:grid-cols-2 xl:grid-cols-2">
                        <MetricProgressCard
                          label="CPU"
                          percent={parseUsagePercent(
                            vpsMetricsData.cpu?.usagePercent,
                          )}
                          used={vpsMetricsData.cpu?.usagePercent || "N/A"}
                          free={
                            parseUsagePercent(
                              vpsMetricsData.cpu?.usagePercent,
                            ) !== null
                              ? `${(100 - parseUsagePercent(vpsMetricsData.cpu?.usagePercent)).toFixed(2)}%`
                              : "N/A"
                          }
                          total="100%"
                          accentClass={getUsageTextClass(
                            vpsMetricsData.cpu?.usagePercent,
                          )}
                          barClass={
                            getUsageSeverity(
                              vpsMetricsData.cpu?.usagePercent,
                            ) === "critical"
                              ? "bg-rose-400"
                              : getUsageSeverity(
                                    vpsMetricsData.cpu?.usagePercent,
                                  ) === "warning"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }
                          subtitle="Instant host CPU snapshot. On an idle VPS this can stay near 0%."
                        />

                        <MetricProgressCard
                          label="RAM"
                          percent={parseUsagePercent(
                            vpsMetricsData.memory?.usagePercent,
                          )}
                          used={vpsMetricsData.memory?.used || "N/A"}
                          free={
                            vpsMemoryFreeMb !== null
                              ? formatSizeFromMb(vpsMemoryFreeMb)
                              : "N/A"
                          }
                          total={vpsMetricsData.memory?.total || "N/A"}
                          accentClass={getUsageTextClass(
                            vpsMetricsData.memory?.usagePercent,
                          )}
                          barClass={
                            getUsageSeverity(
                              vpsMetricsData.memory?.usagePercent,
                            ) === "critical"
                              ? "bg-rose-400"
                              : getUsageSeverity(
                                    vpsMetricsData.memory?.usagePercent,
                                  ) === "warning"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }
                          subtitle="Host memory usage"
                        />

                        <MetricProgressCard
                          label="Disk"
                          percent={parseUsagePercent(
                            vpsMetricsData.disk?.usagePercent,
                          )}
                          used={vpsMetricsData.disk?.used || "N/A"}
                          free={
                            vpsDiskFreeMb !== null
                              ? formatSizeFromMb(vpsDiskFreeMb)
                              : "N/A"
                          }
                          total={vpsMetricsData.disk?.total || "N/A"}
                          accentClass={getUsageTextClass(
                            vpsMetricsData.disk?.usagePercent,
                          )}
                          barClass={
                            getUsageSeverity(
                              vpsMetricsData.disk?.usagePercent,
                            ) === "critical"
                              ? "bg-rose-400"
                              : getUsageSeverity(
                                    vpsMetricsData.disk?.usagePercent,
                                  ) === "warning"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }
                          subtitle="Server storage usage"
                        />

                        <MetricProgressCard
                          label="DB Connections"
                          percent={parseUsagePercent(
                            vpsMetricsData.postgres?.usagePercent,
                          )}
                          used={
                            Number.isFinite(postgresActiveConnections)
                              ? String(postgresActiveConnections)
                              : "N/A"
                          }
                          free={
                            postgresFreeConnections !== null
                              ? String(postgresFreeConnections)
                              : "N/A"
                          }
                          total={
                            Number.isFinite(postgresMaxConnections)
                              ? String(postgresMaxConnections)
                              : "N/A"
                          }
                          accentClass={getUsageTextClass(
                            vpsMetricsData.postgres?.usagePercent,
                          )}
                          barClass={
                            getUsageSeverity(
                              vpsMetricsData.postgres?.usagePercent,
                            ) === "critical"
                              ? "bg-rose-400"
                              : getUsageSeverity(
                                    vpsMetricsData.postgres?.usagePercent,
                                  ) === "warning"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }
                          subtitle="Active / free / max PostgreSQL connections"
                        />
                      </div>
                    </div>
                  ) : null}
                  {expandedSystems.database &&
                  infrastructureStatus.databaseServer?.vpsMetrics
                    ?.configured ? (
                    <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-black/10 p-3 text-xs text-emerald-100">
                      <p>
                        VPS metrics endpoint:{" "}
                        {infrastructureStatus.databaseServer.vpsMetrics.status}
                      </p>
                      <p>
                        Response time:{" "}
                        {infrastructureStatus.databaseServer.vpsMetrics
                          .responseTime || "N/A"}
                      </p>

                      {infrastructureStatus.databaseServer.vpsMetrics
                        .metrics ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <p className="text-gray-400">CPU</p>
                              <p
                                className={`mt-1 text-sm font-semibold ${getUsageTextClass(
                                  infrastructureStatus.databaseServer.vpsMetrics
                                    .metrics?.cpu?.usagePercent,
                                )}`}
                              >
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.cpu?.usagePercent || "N/A"}
                              </p>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <p className="text-gray-400">RAM</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.memory?.used || "N/A"}
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.memory?.total
                                  ? ` / ${
                                      infrastructureStatus.databaseServer
                                        .vpsMetrics.metrics.memory.total
                                    }`
                                  : ""}
                              </p>
                              <p className="mt-1 text-[10px] text-gray-400">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.memory?.usagePercent || "N/A"}
                              </p>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <p className="text-gray-400">Disk</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.disk?.used || "N/A"}
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.disk?.total
                                  ? ` / ${
                                      infrastructureStatus.databaseServer
                                        .vpsMetrics.metrics.disk.total
                                    }`
                                  : ""}
                              </p>
                              <p className="mt-1 text-[10px] text-gray-400">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.disk?.usagePercent || "N/A"}
                              </p>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <p className="text-gray-400">Processes</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.processes?.count || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-gray-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Network Usage
                              </p>
                              <div className="mt-2 space-y-1">
                                <p>
                                  Interface:{" "}
                                  <span className="font-mono text-white">
                                    {infrastructureStatus.databaseServer
                                      .vpsMetrics.metrics?.network?.interface ||
                                      "N/A"}
                                  </span>
                                </p>
                                <p>
                                  RX / TX:{" "}
                                  <span className="text-white">
                                    {infrastructureStatus.databaseServer
                                      .vpsMetrics.metrics?.network?.received ||
                                      "N/A"}
                                    {" / "}
                                    {infrastructureStatus.databaseServer
                                      .vpsMetrics.metrics?.network
                                      ?.transmitted || "N/A"}
                                  </span>
                                </p>
                                <p>
                                  Rate:{" "}
                                  <span className="text-white">
                                    {infrastructureStatus.databaseServer
                                      .vpsMetrics.metrics?.network
                                      ?.receiveRate || "N/A"}
                                    {" / "}
                                    {infrastructureStatus.databaseServer
                                      .vpsMetrics.metrics?.network
                                      ?.transmitRate || "N/A"}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-gray-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                PostgreSQL Usage
                              </p>
                              <div className="mt-2 space-y-1">
                                {infrastructureStatus.databaseServer.vpsMetrics
                                  .metrics?.postgres?.available ? (
                                  <>
                                    <p>
                                      Database:{" "}
                                      <span className="font-mono text-white">
                                        {infrastructureStatus.databaseServer
                                          .vpsMetrics.metrics.postgres
                                          .databaseName || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      Size:{" "}
                                      <span className="text-white">
                                        {infrastructureStatus.databaseServer
                                          .vpsMetrics.metrics.postgres
                                          .databaseSize || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      Connections:{" "}
                                      <span className="text-white">
                                        {infrastructureStatus.databaseServer
                                          .vpsMetrics.metrics.postgres
                                          .activeConnections || "N/A"}
                                        {" / "}
                                        {infrastructureStatus.databaseServer
                                          .vpsMetrics.metrics.postgres
                                          .maxConnections || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      Usage:{" "}
                                      <span
                                        className={getUsageTextClass(
                                          infrastructureStatus.databaseServer
                                            .vpsMetrics.metrics.postgres
                                            .usagePercent,
                                        )}
                                      >
                                        {infrastructureStatus.databaseServer
                                          .vpsMetrics.metrics.postgres
                                          .usagePercent || "N/A"}
                                      </span>
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-gray-400">
                                    PostgreSQL metrics unavailable
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-300">
                          Detailed VPS metrics are not available yet.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Database Statistics */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            🗄️ Database Layer Metrics
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            These metrics come from the backend querying the configured
            database. They represent database connectivity and query
            performance, not the full VPS host resource panel.
          </p>
          {databaseStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-gray-400 text-sm mb-3 font-medium">
                    Record Counts
                  </p>
                  <div className="space-y-4">
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
                        <span className="text-gray-300 text-sm">
                          Sample Query Time
                        </span>
                        <span className="text-yellow-400 font-bold">
                          {databaseStats.performance?.queryTime}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseInt(
                              databaseStats.performance?.queryTime || 0,
                            ) > 100
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
                        {parseInt(databaseStats.performance?.queryTime || 0) >
                        100
                          ? "⚠️ Slower sample query"
                          : "✅ Good sample query performance"}
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

        {/* Rate Limiting Status */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
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
                        <span className="text-gray-400 text-xs">
                          Active IPs
                        </span>
                        <span className="text-blue-400 font-bold text-sm">
                          {rateLimitStatus.perIP?.activeTracking}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            (rateLimitStatus.perIP?.activeTracking || 0) > 50
                              ? "bg-red-500"
                              : (rateLimitStatus.perIP?.activeTracking || 0) >
                                  20
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
                              : (rateLimitStatus.perUser?.activeTracking || 0) >
                                  5
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
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            🚨 Alert History
          </h2>
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
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
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
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto mt-6">
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
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔒 SSL Certificate Status
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            UptimeRobot monitors your SSL certificate validity and will alert
            you before expiry.
          </p>
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-300 font-medium">
              ✅ SSL is monitored by UptimeRobot
            </p>
          </div>
        </div>
      </div>

      {isInfrastructureCheckModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setIsInfrastructureCheckModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-gray-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Infrastructure check{" "}
                  {infrastructureStatus.databaseServer?.databaseResponseTime ||
                    "N/A"}{" "}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Infrastructure check
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInfrastructureCheckModalOpen(false)}
                className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-300">
              <p>
                Infrastructure check = database response time measured during
                the full system status check.
              </p>
              <p>
                Full system = frontend, backend API, database, and VPS server
                checked together in one status request.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminSystemStatus;
