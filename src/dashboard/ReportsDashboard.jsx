import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../services/auth.services";
import { useReportCounts } from "../hooks/useReportCounts";
import api from "../axios";
import aiApi from "../AI_axios";
import PageHeader from "../components/UI/PageHeader";
import WordReports from "../AdminActions/SuperAdmin/WordReports";
import HowToSayReports from "../AdminActions/SuperAdmin/HowToSayReports";
import ReportsByUsers from "../AI/ReportsByUsers";
import ConjugationReportsPage from "../AI/ConjugationReportsPage";
import {
  IoFlagOutline,
  IoClipboardOutline,
  IoLanguageOutline,
  IoTrashOutline,
  IoWarningOutline,
} from "react-icons/io5";

// WordReports/HowToSayReports have no auth check of their own — they relied
// entirely on route-level protection (SUPER_ADMIN_ROLES in Routes.jsx) when
// each lived at its own URL. Now that they're mounted here instead, `roles`
// below is what keeps a plain admin from ever seeing (or mounting) those two
// tabs — mirrors the same `roles: ["super_admin"]` convention DashboardLayout
// already uses to filter its nav items.
const REPORT_TABS = [
  {
    key: "words",
    label: "Word Reports",
    icon: IoFlagOutline,
    Component: WordReports,
    roles: ["super_admin"],
    countKey: "words",
  },
  {
    key: "howToSay",
    label: "How to Say Reports",
    icon: IoFlagOutline,
    Component: HowToSayReports,
    roles: ["super_admin"],
    countKey: "howToSay",
  },
  {
    key: "paragraphs",
    label: "AI Paragraph Reports",
    icon: IoClipboardOutline,
    Component: ReportsByUsers,
    countKey: "paragraphs",
  },
  {
    key: "conjugations",
    label: "Conjugation Reports",
    icon: IoLanguageOutline,
    Component: ConjugationReportsPage,
    countKey: "conjugations",
  },
];

// Every "delete all" endpoint across both backends — run together so one
// button clears word, how-to-say, AI paragraph, and conjugation reports in a
// single confirmed action instead of four separate trips through each tab.
const deleteAllReportsEverywhere = () =>
  Promise.allSettled([
    api.delete("/word-reports/admin/all"),
    api.delete("/how-to-say-reports/admin/all"),
    aiApi.delete("/paragraphs/delete-all-reports"),
    aiApi.delete("/conjugations/delete-all-reports"),
  ]);

const ReportsDashboard = () => {
  const {
    isAdmin,
    isLoggedIn: userLoggedIn,
    userId,
    userRole: role,
  } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const { counts, total, refetchCounts } = useReportCounts();

  const visibleTabs = REPORT_TABS.filter(
    (tab) => !tab.roles || tab.roles.includes(role),
  );

  // Kept in the URL (?tab=...) instead of plain component state so a page
  // refresh lands back on the same tab instead of resetting to the first one.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = visibleTabs.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : visibleTabs[0]?.key;
  const setActiveTab = (key) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", key);
        return next;
      },
      { replace: true },
    );
  };

  // Each tab component fetches its own report list on mount and has no way
  // to know a sibling action (the delete-all button below) just wiped its
  // data — bumping this remounts the active tab so it refetches cleanly.
  const [refreshToken, setRefreshToken] = useState(0);

  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const closeDeleteAllConfirm = () => {
    setConfirmingDeleteAll(false);
    setConfirmText("");
  };

  const handleDeleteAllReports = async () => {
    if (confirmText.trim().toLowerCase() !== "ok") return;

    setDeletingAll(true);
    try {
      const results = await deleteAllReportsEverywhere();
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        toast.success("All reports deleted successfully!");
      } else if (failed.length < results.length) {
        toast.warning(
          `Deleted most reports, but ${failed.length} of ${results.length} report type(s) failed. Try again if needed.`,
        );
      } else {
        toast.error("Failed to delete reports. Please try again.");
      }

      await refetchCounts();
      setRefreshToken((prev) => prev + 1);
      closeDeleteAllConfirm();
    } finally {
      setDeletingAll(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const active =
    visibleTabs.find((tab) => tab.key === activeTab) || visibleTabs[0];
  const ActiveComponent = active?.Component;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title={total > 0 ? `Reports (${total})` : "Reports"}
            subtitle="Review reported words, phrases, AI paragraphs, and conjugations from one place."
          />

          {role === "super_admin" && (
            <button
              type="button"
              onClick={() => setConfirmingDeleteAll(true)}
              disabled={total === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-700/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <IoTrashOutline size={16} aria-hidden="true" />
              Delete All Reports
            </button>
          )}
        </div>

        <div className="mb-6 mt-6 flex flex-wrap justify-center gap-2">
          {visibleTabs.map((tab) => {
            const count = counts[tab.countKey] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active?.key === tab.key
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-500/50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <tab.icon size={14} aria-hidden="true" />
                  {tab.label}
                  {count > 0 ? ` (${count})` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {ActiveComponent && (
        <ActiveComponent key={`${active.key}-${refreshToken}`} />
      )}

      {confirmingDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-red-700 bg-gray-800 p-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-red-400">
              <IoWarningOutline aria-hidden="true" />
              Delete All Reports
            </h2>
            <p className="mb-6 text-sm text-gray-300">
              This permanently deletes every word, how-to-say, AI paragraph,
              and conjugation report across the whole app. This cannot be
              undone.
            </p>
            <label
              htmlFor="reports-delete-all-confirm"
              className="mb-2 block font-semibold text-white"
            >
              Type <span className="text-red-400">ok</span> to confirm
            </label>
            <input
              id="reports-delete-all-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ok"
              autoFocus
              className="mb-6 w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAllReports}
                disabled={
                  deletingAll || confirmText.trim().toLowerCase() !== "ok"
                }
                className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletingAll ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={closeDeleteAllConfirm}
                disabled={deletingAll}
                className="flex-1 rounded-lg bg-gray-700 px-6 py-3 font-semibold text-white transition hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
