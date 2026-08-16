import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import api from "../../axios";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import DateTime from "../../components/UI/DateTime";
import { formatTimeOnly } from "../../utils/formatDateTime";
import {
  IoCloudUploadOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoRemoveCircleOutline,
  IoRefreshOutline,
  IoTimeOutline,
} from "react-icons/io5";

const SERVICES = [
  { key: "backend", label: "Backend Database" },
  { key: "ai", label: "AI Database" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/30 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:placeholder-gray-500";

// Decimal (SI) units — 1000-based, not 1024-based — to match how Dropbox
// and Google Drive display file sizes in their own UIs. Using 1024 here
// while labeling the result "MB" (a common mix-up, e.g. Windows Explorer)
// made this dashboard show a smaller number for the exact same file than
// what you'd see on Dropbox/Drive directly, even though the byte count
// stored is identical — confirmed via Dropbox's API against the DB value.
const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / (1000 * 1000)).toFixed(1)} MB`;
};

const STATUS_BADGE = {
  SUCCESS: {
    icon: IoCheckmarkCircle,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "Success",
  },
  FAILED: {
    icon: IoCloseCircle,
    className: "text-red-600 dark:text-red-400",
    label: "Failed",
  },
  SKIPPED: {
    icon: IoRemoveCircleOutline,
    className: "text-amber-600 dark:text-amber-400",
    label: "Skipped",
  },
};

// Password re-confirmation for every mutating action here (settings
// changes, manual triggers) — a valid dashboard session alone isn't treated
// as sufficient for touching production backup config or kicking off a real
// backup run. Same Swal password-prompt pattern already used for level/topic
// changes elsewhere in the admin dashboard.
const confirmWithPassword = async ({ title, html, confirmButtonText }) => {
  const result = await Swal.fire({
    title,
    html,
    icon: "warning",
    input: "password",
    inputPlaceholder: "Your password",
    inputAttributes: { autocomplete: "current-password" },
    inputValidator: (value) => (value ? null : "Password is required"),
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#0284c7",
    cancelButtonColor: "#475569",
    background: "#1c1917",
    color: "#f5f5f4",
  });
  return result.isConfirmed ? result.value : null;
};

const pad2 = (n) => String(n).padStart(2, "0");

// Shows the absolute next-run date/time (matching the site's DateTime
// convention) until less than 24h remain, then switches to a live
// HH:MM:SS countdown that ticks every second.
const NextRunCountdown = ({ value }) => {
  const [now, setNow] = useState(() => Date.now());
  const target = value ? new Date(value).getTime() : null;
  const remainingMs = target !== null ? target - now : null;
  const isCountingDown =
    remainingMs !== null && remainingMs > 0 && remainingMs < 24 * 60 * 60 * 1000;

  // Always ticking (not just once isCountingDown is already true) — otherwise
  // this component never re-renders on its own while showing the "in X days"
  // form, so it can never notice the moment it crosses under 24h and should
  // switch to the live countdown. Ticks slowly until then to avoid needless
  // re-renders.
  useEffect(() => {
    const tickMs = isCountingDown ? 1000 : 60 * 1000;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [isCountingDown]);

  if (!value || target === null) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  if (remainingMs <= 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <IoTimeOutline size={11} aria-hidden="true" />
        Due now
      </span>
    );
  }

  if (isCountingDown) {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
        <IoTimeOutline size={11} aria-hidden="true" />
        in {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
      </span>
    );
  }

  const totalDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const timeLabel = formatTimeOnly(value);
  return (
    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-gray-300">
      {totalDays === 1
        ? `tomorrow at ${timeLabel}`
        : `in ${totalDays} days at ${timeLabel}`}
    </span>
  );
};

const ServiceSettingsCard = ({ serviceKey, label, onTriggered }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [form, setForm] = useState({
    dropboxIntervalDays: "",
    dropboxMaxBackups: "",
    driveIntervalDays: "",
    driveMaxBackups: "",
    historyRetentionDays: "",
    historyUnlimited: false,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/backup/settings/${serviceKey}`);
      const data = response.data?.data;
      setSettings(data);
      setForm({
        dropboxIntervalDays: String(data.dropboxIntervalDays),
        dropboxMaxBackups: String(data.dropboxMaxBackups),
        driveIntervalDays: String(data.driveIntervalDays),
        driveMaxBackups: String(data.driveMaxBackups),
        historyRetentionDays:
          data.historyRetentionDays === null
            ? ""
            : String(data.historyRetentionDays),
        historyUnlimited: data.historyRetentionDays === null,
      });
    } catch (err) {
      console.error(`Failed to fetch backup settings for ${serviceKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [serviceKey]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    const password = await confirmWithPassword({
      title: `Update ${label} backup settings?`,
      html: "Enter your password to confirm this change.",
      confirmButtonText: "Save",
    });
    if (!password) return;

    setSaving(true);
    try {
      await api.patch(`/backup/settings/${serviceKey}`, {
        password,
        dropboxIntervalDays: Number(form.dropboxIntervalDays),
        dropboxMaxBackups: Number(form.dropboxMaxBackups),
        driveIntervalDays: Number(form.driveIntervalDays),
        driveMaxBackups: Number(form.driveMaxBackups),
        historyRetentionDays: form.historyUnlimited
          ? null
          : Number(form.historyRetentionDays),
      });
      await fetchSettings();
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: `${label} backup settings saved`,
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err.response?.data?.message || "Failed to save settings",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerNow = async () => {
    const password = await confirmWithPassword({
      title: `Trigger a ${label} backup now?`,
      html: "This runs a real backup immediately, bypassing the configured interval. Enter your password to confirm.",
      confirmButtonText: "Trigger Backup",
    });
    if (!password) return;

    setTriggering(true);
    try {
      const response = await api.post(`/backup/trigger/${serviceKey}`, {
        password,
      });
      Swal.fire({
        icon: "success",
        title: "Backup triggered",
        text: response.data?.message,
        background: "#1c1917",
        color: "#f5f5f4",
      });
      onTriggered?.();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Trigger failed",
        text: err.response?.data?.message || "Failed to trigger backup",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setTriggering(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 md:p-8">
        <p className="text-slate-500 dark:text-gray-400">Loading {label}…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none md:p-8">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {label}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
            Dropbox interval (days)
          </label>
          <input
            type="number"
            min={1}
            value={form.dropboxIntervalDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, dropboxIntervalDays: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
            Keep last {form.dropboxMaxBackups || "N"} Dropbox backups
          </label>
          <input
            type="number"
            min={1}
            value={form.dropboxMaxBackups}
            onChange={(e) =>
              setForm((f) => ({ ...f, dropboxMaxBackups: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
            Google Drive interval (days)
          </label>
          <input
            type="number"
            min={1}
            value={form.driveIntervalDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, driveIntervalDays: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
            Keep last {form.driveMaxBackups || "N"} Google Drive backups
          </label>
          <input
            type="number"
            min={1}
            value={form.driveMaxBackups}
            onChange={(e) =>
              setForm((f) => ({ ...f, driveMaxBackups: e.target.value }))
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-900/40">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Next Dropbox
          </span>
          <NextRunCountdown value={settings.dropboxNextRunAt} />
        </div>
        <div className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-900/40">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Next Drive
          </span>
          <NextRunCountdown value={settings.driveNextRunAt} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
          History retention (days)
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="number"
            min={1}
            disabled={form.historyUnlimited}
            value={form.historyRetentionDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, historyRetentionDays: e.target.value }))
            }
            className={`${inputClass} mt-0 disabled:opacity-50`}
          />
          <label className="flex shrink-0 items-center gap-1.5 text-sm text-slate-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.historyUnlimited}
              onChange={(e) =>
                setForm((f) => ({ ...f, historyUnlimited: e.target.checked }))
              }
              className="h-4 w-4 accent-sky-500"
            />
            Unlimited
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleTriggerNow}
          disabled={triggering}
        >
          <span className="inline-flex items-center gap-1.5">
            <IoCloudUploadOutline size={16} aria-hidden="true" />
            {triggering ? "Triggering..." : "Trigger Backup Now"}
          </span>
        </Button>
      </div>
    </div>
  );
};

const BackupHistoryTable = ({ refreshKey }) => {
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    service: "",
    destination: "",
    status: "",
  });
  const fetchHistory = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (filters.service) params.service = filters.service;
        if (filters.destination) params.destination = filters.destination;
        if (filters.status) params.status = filters.status;

        const response = await api.get("/backup/history", { params });
        setHistory(response.data?.data || []);
        setMeta(response.data?.meta || { page: 1, limit: 20, total: 0 });
      } catch (err) {
        console.error("Failed to fetch backup history:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900/60 dark:text-white";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Backup History
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.service}
            onChange={(e) =>
              setFilters((f) => ({ ...f, service: e.target.value }))
            }
            className={selectClass}
          >
            <option value="">All services</option>
            <option value="backend">Backend</option>
            <option value="ai">AI</option>
          </select>
          <select
            value={filters.destination}
            onChange={(e) =>
              setFilters((f) => ({ ...f, destination: e.target.value }))
            }
            className={selectClass}
          >
            <option value="">All destinations</option>
            <option value="DROPBOX">Dropbox</option>
            <option value="DRIVE">Google Drive</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
          <button
            type="button"
            onClick={() => fetchHistory(meta.page)}
            title="Refresh"
            className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <IoRefreshOutline size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 dark:text-gray-400">Loading…</p>
      ) : history.length === 0 ? (
        <p className="text-slate-500 dark:text-gray-400">
          No backup history yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead>
              <tr className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((row) => {
                const badge = STATUS_BADGE[row.status] || STATUS_BADGE.SKIPPED;
                const BadgeIcon = badge.icon;
                return (
                  <tr
                    key={row.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-950/60"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-200">
                      <DateTime value={row.createdAt} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 capitalize text-slate-700 dark:text-slate-200">
                      {row.service}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 capitalize text-slate-700 dark:text-slate-200">
                      {row.destination.toLowerCase()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${badge.className}`}
                      >
                        <BadgeIcon size={14} aria-hidden="true" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-4 pr-8">
                      {row.fileName ? (
                        <span
                          title={row.fileName}
                          className="block max-w-[16rem] truncate text-xs text-slate-700 dark:text-slate-200"
                        >
                          {row.fileName}
                        </span>
                      ) : (
                        <span className="block text-center text-slate-400 dark:text-slate-500">
                          —
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 pl-6 font-medium text-sky-600 dark:text-sky-400">
                      {row.fileSizeBytes === null ||
                      row.fileSizeBytes === undefined ? (
                        <span className="block text-center text-slate-400 dark:text-slate-500">
                          —
                        </span>
                      ) : (
                        formatBytes(row.fileSizeBytes)
                      )}
                    </td>
                    <td className="max-w-md px-4 py-4">
                      {row.errorMessage ? (
                        <span
                          title={row.errorMessage}
                          className="block max-w-md truncate rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        >
                          {row.errorMessage}
                        </span>
                      ) : (
                        <span className="block text-center text-slate-400 dark:text-slate-500">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-gray-400">
            <span>
              Page {meta.page} of {totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => fetchHistory(meta.page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={meta.page >= totalPages}
                onClick={() => fetchHistory(meta.page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const BackupManagement = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <PageHeader
            title="Backup Management"
            subtitle="Configure how often each database backs up to Dropbox and Google Drive, how many backups to keep, and trigger an instant backup on demand."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <ServiceSettingsCard
              key={service.key}
              serviceKey={service.key}
              label={service.label}
              onTriggered={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>

        <div className="mt-6">
          <BackupHistoryTable refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;
