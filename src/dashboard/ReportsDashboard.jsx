import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import WordReports from "../AdminActions/SuperAdmin/WordReports";
import HowToSayReports from "../AdminActions/SuperAdmin/HowToSayReports";
import ReportsByUsers from "../AI/ReportsByUsers";
import ConjugationReportsPage from "../AI/ConjugationReportsPage";

// WordReports/HowToSayReports have no auth check of their own — they relied
// entirely on route-level protection (SUPER_ADMIN_ROLES in Routes.jsx) when
// each lived at its own URL. Now that they're mounted here instead, `roles`
// below is what keeps a plain admin from ever seeing (or mounting) those two
// tabs — mirrors the same `roles: ["super_admin"]` convention DashboardLayout
// already uses to filter its nav items.
const REPORT_TABS = [
  { key: "words", label: "Word Reports", icon: "🚩", Component: WordReports, roles: ["super_admin"] },
  { key: "howToSay", label: "How to Say Reports", icon: "🚩", Component: HowToSayReports, roles: ["super_admin"] },
  { key: "paragraphs", label: "AI Paragraph Reports", icon: "📋", Component: ReportsByUsers },
  { key: "conjugations", label: "Conjugation Reports", icon: "🔤", Component: ConjugationReportsPage },
];

const ReportsDashboard = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId, userRole: role } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

  const visibleTabs = REPORT_TABS.filter(
    (tab) => !tab.roles || tab.roles.includes(role),
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.key);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const active =
    visibleTabs.find((tab) => tab.key === activeTab) || visibleTabs[0];
  const ActiveComponent = active?.Component;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Reports"
          subtitle="Review reported words, phrases, AI paragraphs, and conjugations from one place."
        />

        <div className="mb-6 mt-6 flex flex-wrap justify-center gap-2">
          {visibleTabs.map((tab) => (
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
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
};

export default ReportsDashboard;
