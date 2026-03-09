import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../axios";
import { getUserInfo } from "../services/auth.services";

const buildQueryParams = (filters, page) => {
  const params = {
    page,
    limit: 20,
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      params[key] = value.trim();
    }
  });

  return params;
};

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatLocation = (record) => {
  const parts = [record.city, record.region, record.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
};

const AdminRegistrationMetadataPage = () => {
  const userInfo = getUserInfo() || {};
  const role = userInfo?.role;
  const canAccess = role === "admin" || role === "super_admin";

  const [filters, setFilters] = useState({
    searchTerm: "",
    email: "",
    countryCode: "",
    deviceType: "",
    source: "",
  });
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordLoading, setSelectedRecordLoading] = useState(false);

  const fetchRecords = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/user/registration-metadata", {
        params: buildQueryParams(nextFilters, page),
      });

      setRecords(response.data?.data || []);
      setMeta(
        response.data?.meta || {
          page,
          limit: 20,
          total: 0,
        },
      );
    } catch (requestError) {
      console.error("Failed to load registration metadata:", requestError);
      setError("Unable to load registration metadata right now.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    fetchRecords(1, filters);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await fetchRecords(1, filters);
  };

  const handleResetFilters = async () => {
    const nextFilters = {
      searchTerm: "",
      email: "",
      countryCode: "",
      deviceType: "",
      source: "",
    };

    setFilters(nextFilters);
    await fetchRecords(1, nextFilters);
  };

  const handleInspectRecord = async (userId) => {
    setSelectedRecordLoading(true);

    try {
      const response = await api.get(`/user/registration-metadata/${userId}`);
      setSelectedRecord(response.data?.data || null);
    } catch (requestError) {
      console.error(
        "Failed to load registration metadata detail:",
        requestError,
      );
      Swal.fire({
        icon: "error",
        title: "Unable to load details",
        text: "Please try again in a moment.",
      });
    } finally {
      setSelectedRecordLoading(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const totalPages = Math.max(
    Math.ceil((meta.total || 0) / (meta.limit || 20)),
    1,
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Security Monitoring
              </p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                Registration Metadata
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                Review signup device, browser, IP, and approximate location
                signals collected for abuse prevention and account security.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Records
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {meta.total || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  IP Visibility
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {role === "super_admin" ? "Full IP view" : "Masked IP view"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Limited by role for safer access.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            This data is intended for fraud prevention, abuse investigation, and
            operational security. Avoid exporting or sharing it outside
            authorized admin workflows.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
          <form
            className="grid gap-4 lg:grid-cols-6"
            onSubmit={handleApplyFilters}
          >
            <label className="lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search
              </span>
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Email, browser, city, country"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </span>
              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="user@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Country
              </span>
              <input
                type="text"
                name="countryCode"
                value={filters.countryCode}
                onChange={handleFilterChange}
                placeholder="DE"
                maxLength={2}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Device
              </span>
              <select
                name="deviceType"
                value={filters.deviceType}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              >
                <option value="">All devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="bot">Bot</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Source
              </span>
              <input
                type="text"
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                placeholder="header, fallback"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <div className="flex items-end gap-3 lg:col-span-6">
              <button
                type="submit"
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(21rem,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-6">
            {loading ? (
              <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
                Loading registration metadata...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : records.length === 0 ? (
              <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
                No registration metadata matched the current filters.
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Registered</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-950/60"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {record.email}
                            </p>
                            <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                              {record.userId}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {formatLocation(record)}
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900 dark:text-white">
                                {record.deviceType || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {record.browser || "Unknown browser"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {record.ipAddress || "Unknown"}
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {record.source || "Unknown"}
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {formatDate(record.createdAt)}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleInspectRecord(record.userId)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:hidden">
                  {records.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {record.email}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatLocation(record)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInspectRecord(record.userId)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Inspect
                        </button>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Device:
                          </span>{" "}
                          {record.deviceType || "Unknown"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Browser:
                          </span>{" "}
                          {record.browser || "Unknown"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            IP:
                          </span>{" "}
                          <span className="font-mono text-xs">
                            {record.ipAddress || "Unknown"}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Registered:
                          </span>{" "}
                          {formatDate(record.createdAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page {meta.page || 1} of {totalPages}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={(meta.page || 1) <= 1 || loading}
                      onClick={() =>
                        fetchRecords((meta.page || 1) - 1, filters)
                      }
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={(meta.page || 1) >= totalPages || loading}
                      onClick={() =>
                        fetchRecords((meta.page || 1) + 1, filters)
                      }
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Inspection Details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Select a row to inspect the stored signup metadata for that
              account.
            </p>

            {selectedRecordLoading ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                Loading details...
              </div>
            ) : selectedRecord ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Account
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedRecord.email}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {selectedRecord.userId}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      IP Address
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-900 dark:text-white">
                      {selectedRecord.ipAddress || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Source
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {selectedRecord.source || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Browser
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {selectedRecord.browser || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Operating System
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {selectedRecord.operatingSystem || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Device Type
                    </p>
                    <p className="mt-2 text-sm capitalize text-slate-900 dark:text-white">
                      {selectedRecord.deviceType || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Registered At
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {formatDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Approximate Location
                  </p>
                  <p className="mt-2 text-sm text-slate-900 dark:text-white">
                    {formatLocation(selectedRecord)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedRecord.timezone || "Unknown timezone"}
                  </p>
                  {(selectedRecord.latitude || selectedRecord.longitude) && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {selectedRecord.latitude || "?"},{" "}
                      {selectedRecord.longitude || "?"}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    User Agent
                  </p>
                  <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-300">
                    {selectedRecord.userAgent || "Unknown"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                No record selected yet. Use Inspect on any entry to review its
                full metadata snapshot.
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
};

export default AdminRegistrationMetadataPage;
