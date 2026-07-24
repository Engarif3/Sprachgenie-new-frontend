import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../axios";
import { useAuth } from "../services/auth.services";
import FilterDropdown from "../components/UI/FilterDropdown";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "BACKEND_ERROR", label: "Backend Error" },
  { value: "LOGIN_FAILURE", label: "Login Failure" },
  { value: "REGISTRATION_FAILURE", label: "Registration Failure" },
  { value: "FRONTEND_ERROR", label: "Frontend Error" },
  { value: "AI_SERVICE_ERROR", label: "AI Service Error" },
];

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case "BACKEND_ERROR":
      return "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200";
    case "LOGIN_FAILURE":
      return "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200";
    case "REGISTRATION_FAILURE":
      return "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
    case "FRONTEND_ERROR":
      return "border-violet-300/60 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200";
    case "AI_SERVICE_ERROR":
      return "border-teal-300/60 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200";
    default:
      return "border-slate-300/60 bg-slate-100 text-slate-700 dark:border-slate-600/30 dark:bg-slate-800/80 dark:text-slate-200";
  }
};

const getCategoryLabel = (category) =>
  CATEGORY_OPTIONS.find((option) => option.value === category)?.label ||
  category;

const ENVIRONMENT_OPTIONS = [
  { value: "", label: "All environments" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "PRODUCTION", label: "Production" },
];

const HAS_USER_OPTIONS = [
  { value: "", label: "All logs" },
  { value: "true", label: "Linked to a user" },
  { value: "false", label: "No user" },
];

const getEnvironmentBadgeClass = (environment) =>
  environment === "DEVELOPMENT"
    ? "border-fuchsia-300/60 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200"
    : "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200";

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildQueryParams = (filters, page) => {
  const params = { page, limit: 20 };

  if (filters.category) {
    params.category = filters.category;
  }

  if (filters.environment) {
    params.environment = filters.environment;
  }

  if (filters.hasUser) {
    params.hasUser = filters.hasUser;
  }

  if (filters.search.trim()) {
    params.search = filters.search.trim();
  }

  return params;
};

// A destructive bulk action only proceeds once the admin types "OK" —
// a plain confirm dialog is too easy to click through by habit for
// something as irreversible as deleting logs.
const confirmDestructiveAction = async ({ title, text }) => {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    input: "text",
    inputPlaceholder: 'Type "OK" to confirm',
    showCancelButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#e11d48",
    inputValidator: (value) => {
      if ((value || "").trim().toUpperCase() !== "OK") {
        return 'You must type "OK" to confirm this action.';
      }
      return undefined;
    },
  });

  return result.isConfirmed;
};

const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 365;

const ErrorLogsPage = () => {
  const { userRole: role } = useAuth();
  const canAccess = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  const [filters, setFilters] = useState({
    category: "",
    environment: "",
    hasUser: "",
    search: "",
  });
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [retentionInput, setRetentionInput] = useState("");

  const fetchRecords = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError("");
    // A prior selection almost never still makes sense against a new page
    // or filter set (some selected rows may no longer even be visible).
    setSelectedIds(new Set());

    try {
      const response = await api.get("/error-logs", {
        params: buildQueryParams(nextFilters, page),
      });

      setRecords(response.data?.data || []);
      setMeta(response.data?.meta || { page, limit: 20, total: 0 });
    } catch (requestError) {
      console.error("Failed to load error logs:", requestError);
      setError("Unable to load error logs right now.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);

    try {
      const response = await api.get("/error-logs/settings");
      const data = response.data?.data;
      setSettings(data);
      setRetentionInput(String(data?.retentionDays ?? ""));
    } catch (requestError) {
      console.error("Failed to load error log settings:", requestError);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    fetchRecords(1, filters);

    if (isSuperAdmin) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await fetchRecords(1, filters);
  };

  const handleResetFilters = async () => {
    const nextFilters = { category: "", environment: "", hasUser: "", search: "" };
    setFilters(nextFilters);
    await fetchRecords(1, nextFilters);
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allOnPageSelected =
    records.length > 0 && records.every((record) => selectedIds.has(record.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        records.forEach((record) => next.delete(record.id));
      } else {
        records.forEach((record) => next.add(record.id));
      }
      return next;
    });
  };

  const BULK_DELETE_LABELS = {
    all: "ALL error logs",
    development: "all logs tagged Development",
    users: "all logs linked to a user account",
    selected: `${selectedIds.size} selected log(s)`,
  };

  const performBulkDelete = async (scope) => {
    const ids = scope === "selected" ? [...selectedIds] : undefined;

    if (scope === "selected" && ids.length === 0) {
      return;
    }

    const confirmed = await confirmDestructiveAction({
      title: "Delete error logs?",
      text: `This will permanently delete ${BULK_DELETE_LABELS[scope]}. This cannot be undone.`,
    });

    if (!confirmed) {
      return;
    }

    setBulkDeleting(true);

    try {
      const response = await api.post("/error-logs/bulk-delete", {
        scope,
        ids,
      });

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `${response.data?.data?.deletedCount ?? 0} log(s) removed.`,
        timer: 1800,
        showConfirmButton: false,
      });

      await fetchRecords(1, filters);
    } catch (requestError) {
      console.error("Bulk delete failed:", requestError);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          requestError.response?.data?.message ||
          "Please try again in a moment.",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleAutoDelete = async () => {
    if (!settings) return;
    setSavingSettings(true);

    try {
      const response = await api.patch("/error-logs/settings", {
        autoDeleteEnabled: !settings.autoDeleteEnabled,
      });
      setSettings(response.data?.data);
    } catch (requestError) {
      console.error("Failed to update error log settings:", requestError);
      Swal.fire({
        icon: "error",
        title: "Unable to update setting",
        text:
          requestError.response?.data?.message ||
          "Please try again in a moment.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveRetention = async (event) => {
    event.preventDefault();
    const retentionDays = Number(retentionInput);

    if (
      !Number.isInteger(retentionDays) ||
      retentionDays < MIN_RETENTION_DAYS ||
      retentionDays > MAX_RETENTION_DAYS
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid retention window",
        text: `Enter a whole number between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS} days.`,
      });
      return;
    }

    setSavingSettings(true);

    try {
      const response = await api.patch("/error-logs/settings", {
        retentionDays,
      });
      setSettings(response.data?.data);
      Swal.fire({
        icon: "success",
        title: "Retention window updated",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (requestError) {
      console.error("Failed to update error log settings:", requestError);
      Swal.fire({
        icon: "error",
        title: "Unable to update setting",
        text:
          requestError.response?.data?.message ||
          "Please try again in a moment.",
      });
    } finally {
      setSavingSettings(false);
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
              <p className="mb-3 inline-flex rounded-full border border-rose-300/60 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                Error Monitoring
              </p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                Error Logs
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Backend crashes, failed logins, failed registrations, and
                frontend errors reported from the app.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-1 lg:w-[16rem]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Total Logged
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {meta.total || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isSuperAdmin && (
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Retention Settings
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Controls the daily cleanup job — logs older than the window
              below are deleted automatically when enabled.
            </p>

            {settingsLoading ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Loading settings...
              </p>
            ) : settings ? (
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleAutoDelete}
                    disabled={savingSettings}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      settings.autoDeleteEnabled
                        ? "bg-emerald-500"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.autoDeleteEnabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Auto-delete{" "}
                    {settings.autoDeleteEnabled ? "enabled" : "disabled"}
                  </span>
                </div>

                <form
                  className="flex items-center gap-3"
                  onSubmit={handleSaveRetention}
                >
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Retention (days)
                  </label>
                  <input
                    type="number"
                    min={MIN_RETENTION_DAYS}
                    max={MAX_RETENTION_DAYS}
                    value={retentionInput}
                    onChange={(event) => setRetentionInput(event.target.value)}
                    className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>
              </div>
            ) : (
              <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">
                Unable to load retention settings.
              </p>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
          <form
            className="grid gap-4 lg:grid-cols-12"
            onSubmit={handleApplyFilters}
          >
            <label className="lg:col-span-4">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search
              </span>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Message, email, path, IP"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <div className="lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Category
              </span>
              <FilterDropdown
                id="error-logs-category"
                ariaLabel="Filter by category"
                placeholder={CATEGORY_OPTIONS[0].label}
                displayLabel={getCategoryLabel(filters.category)}
                selectedValue={filters.category}
                onSelect={(value) =>
                  setFilters((prev) => ({ ...prev, category: value }))
                }
                items={CATEGORY_OPTIONS.slice(1)}
              />
            </div>

            <div className="lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Environment
              </span>
              <FilterDropdown
                id="error-logs-environment"
                ariaLabel="Filter by environment"
                placeholder={ENVIRONMENT_OPTIONS[0].label}
                displayLabel={
                  ENVIRONMENT_OPTIONS.find(
                    (option) => option.value === filters.environment,
                  )?.label || ENVIRONMENT_OPTIONS[0].label
                }
                selectedValue={filters.environment}
                onSelect={(value) =>
                  setFilters((prev) => ({ ...prev, environment: value }))
                }
                items={ENVIRONMENT_OPTIONS.slice(1)}
              />
            </div>

            <div className="lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                User
              </span>
              <FilterDropdown
                id="error-logs-has-user"
                ariaLabel="Filter by user link"
                placeholder={HAS_USER_OPTIONS[0].label}
                displayLabel={
                  HAS_USER_OPTIONS.find(
                    (option) => option.value === filters.hasUser,
                  )?.label || HAS_USER_OPTIONS[0].label
                }
                selectedValue={filters.hasUser}
                onSelect={(value) =>
                  setFilters((prev) => ({ ...prev, hasUser: value }))
                }
                items={HAS_USER_OPTIONS.slice(1)}
              />
            </div>

            <div className="flex items-end gap-3 lg:col-span-2">
              <button
                type="submit"
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Apply
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

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-6">
          {loading ? (
            <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading error logs...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No error logs matched the current filters.
            </div>
          ) : (
            <>
              {isSuperAdmin && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/5">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                    Bulk delete
                  </span>
                  <button
                    type="button"
                    disabled={selectedIds.size === 0 || bulkDeleting}
                    onClick={() => performBulkDelete("selected")}
                    className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete Selected ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    disabled={bulkDeleting}
                    onClick={() => performBulkDelete("development")}
                    className="rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Delete All Development Logs
                  </button>
                  <button
                    type="button"
                    disabled={bulkDeleting}
                    onClick={() => performBulkDelete("users")}
                    className="rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Delete All Logs Linked to Users
                  </button>
                  <button
                    type="button"
                    disabled={bulkDeleting}
                    onClick={() => performBulkDelete("all")}
                    className="rounded-xl bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete ALL Logs
                  </button>
                </div>
              )}

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {isSuperAdmin && (
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAllOnPage}
                            aria-label="Select all logs on this page"
                            className="h-4 w-4 rounded border-slate-300 accent-rose-600"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Env</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Path</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="sticky right-0 border-l border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950/60"
                      >
                        {isSuperAdmin && (
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(record.id)}
                              onChange={() => toggleSelected(record.id)}
                              aria-label={`Select log ${record.id}`}
                              className="h-4 w-4 rounded border-slate-300 accent-rose-600"
                            />
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getCategoryBadgeClass(record.category)}`}
                          >
                            {getCategoryLabel(record.category)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getEnvironmentBadgeClass(record.environment)}`}
                          >
                            {record.environment === "DEVELOPMENT" ? "Dev" : "Prod"}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-4 text-slate-700 dark:text-slate-200">
                          {record.message}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                          {record.email || "—"}
                        </td>
                        <td className="max-w-[16rem] truncate px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {record.path || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {record.ipAddress || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="sticky right-0 border-l border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
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
                      <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(record.id)}
                            onChange={() => toggleSelected(record.id)}
                            aria-label={`Select log ${record.id}`}
                            className="h-4 w-4 rounded border-slate-300 accent-rose-600"
                          />
                        )}
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getCategoryBadgeClass(record.category)}`}
                        >
                          {getCategoryLabel(record.category)}
                        </span>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getEnvironmentBadgeClass(record.environment)}`}
                        >
                          {record.environment === "DEVELOPMENT" ? "Dev" : "Prod"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Inspect
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                      {record.message}
                    </p>
                    <div className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {record.email && <p>Email: {record.email}</p>}
                      {record.path && <p>Path: {record.path}</p>}
                      <p>{formatDate(record.createdAt)}</p>
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
                    onClick={() => fetchRecords((meta.page || 1) - 1, filters)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={(meta.page || 1) >= totalPages || loading}
                    onClick={() => fetchRecords((meta.page || 1) + 1, filters)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getCategoryBadgeClass(selectedRecord.category)}`}
                    >
                      {getCategoryLabel(selectedRecord.category)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${getEnvironmentBadgeClass(selectedRecord.environment)}`}
                    >
                      {selectedRecord.environment === "DEVELOPMENT"
                        ? "Development"
                        : "Production"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {selectedRecord.message}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close error details"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[calc(90vh-6rem)] overflow-y-auto px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Time
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {formatDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Status Code
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {selectedRecord.statusCode || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Method / Path
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-900 dark:text-white">
                      {[selectedRecord.method, selectedRecord.path]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Email
                    </p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-white">
                      {selectedRecord.email || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      IP Address
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-900 dark:text-white">
                      {selectedRecord.ipAddress || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      User Agent
                    </p>
                    <p className="mt-2 break-all text-xs text-slate-700 dark:text-slate-300">
                      {selectedRecord.userAgent || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    User Account
                  </p>
                  {selectedRecord.user ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <p className="text-sm text-slate-900 dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">
                          Name:{" "}
                        </span>
                        {selectedRecord.user.name || "—"}
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">
                          Role:{" "}
                        </span>
                        {selectedRecord.user.role}
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">
                          Status:{" "}
                        </span>
                        {selectedRecord.user.status}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {selectedRecord.email
                        ? "No matching user account found for this email (may have been deleted since)."
                        : "This log has no associated user."}
                    </p>
                  )}
                </div>

                {selectedRecord.stack && (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Stack Trace
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-3 text-xs text-slate-200">
                      {selectedRecord.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorLogsPage;
