import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../axios";

const VisitorsInfoPage = () => {
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: { daily: 0, weekly: 0, monthly: 0, yearly: 0, total: 0 },
    last30Days: {},
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const visitorSummary = analytics?.summary || {};
  const visitorTrendEntries = Object.entries(analytics?.last30Days || {})
    .sort(([leftDate], [rightDate]) => new Date(leftDate) - new Date(rightDate))
    .slice(-14);
  const visitorTrendMax = Math.max(
    1,
    ...visitorTrendEntries.map(([, count]) => Number(count) || 0),
  );

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

  useEffect(() => {
    fetchUniqueVisitors();
    fetchAnalytics();
  }, []);

  const handleRefreshVisitors = async () => {
    setVisitorsLoading(true);
    setAnalyticsLoading(true);
    await Promise.allSettled([fetchUniqueVisitors(), fetchAnalytics()]);
  };

  return (
    <div className="space-y-6 py-8">
      <div className="max-w-6xl mx-auto rounded-2xl border border-violet-500/20 bg-gray-900 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300">
              Visitor Analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              Visitors Info Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Review visitor volume, short-term traffic movement, and jump into
              the full visitor location dashboard from here.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshVisitors}
            className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20"
          >
            Refresh visitor data
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-white">
            👥 Visitors Overview
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Start here for visitor totals and recent activity before opening the
            detailed location breakdown.
          </p>
        </div>

        {visitorsLoading || analyticsLoading ? (
          <p className="mt-4 text-gray-400">Loading visitor analytics...</p>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Unique Visitors
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {uniqueVisitors || 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Daily
                </p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">
                  {visitorSummary.daily || 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Weekly
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-300">
                  {visitorSummary.weekly || 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Monthly
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-300">
                  {visitorSummary.monthly || 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Total
                </p>
                <p className="mt-2 text-2xl font-bold text-violet-300">
                  {visitorSummary.total || 0}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Last 14 Days Visitor Trend
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Short-term traffic pattern from the saved daily analytics
                    dataset.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-gray-200">
                  {visitorTrendEntries.length} days loaded
                </span>
              </div>

              {visitorTrendEntries.length > 0 ? (
                <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-14">
                  {visitorTrendEntries.map(([date, count]) => {
                    const normalizedCount = Number(count) || 0;
                    const heightPercent =
                      (normalizedCount / visitorTrendMax) * 100;

                    return (
                      <div
                        key={date}
                        className="flex flex-col items-center justify-end gap-2"
                      >
                        <span className="h-5 text-xs font-semibold text-white">
                          {normalizedCount > 0 ? normalizedCount : ""}
                        </span>
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-violet-600 to-cyan-400 transition-all"
                          style={{
                            minHeight: "10px",
                            height: `${Math.max(heightPercent, 8)}px`,
                          }}
                          title={`${new Date(date).toLocaleDateString()}: ${normalizedCount} visitors`}
                        />
                        <p className="text-center text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  No recent visitor trend data available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 max-w-6xl mx-auto">
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
    </div>
  );
};

export default VisitorsInfoPage;
