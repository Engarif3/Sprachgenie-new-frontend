import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../axios";
import PageHeader from "../../components/UI/PageHeader";
import CategoryMultiSelect from "../../components/UI/CategoryMultiSelect";
import Button from "../../components/UI/Button";
import { IoSpeedometerOutline, IoTrophyOutline } from "react-icons/io5";

// "Unknown" is a housekeeping fallback for miscategorized words, not a real
// CEFR difficulty — never offered as a selectable level here, regardless of
// whether it currently holds any words. The backend enforces the same rule
// independently (see difficultySettings.service.ts) — this is just so it's
// never shown as an option in the first place.
const EXCLUDED_LEVEL_NAMES = ["Unknown"];

const TABS = [
  {
    key: "quiz",
    label: "Quiz",
    icon: IoSpeedometerOutline,
    description:
      "Levels behind the Easy / Difficult / Mixed buttons on the Quiz page.",
  },
  {
    key: "challenge",
    label: "Daily Challenge",
    icon: IoTrophyOutline,
    description:
      "Levels behind the Easy / Intermediate / Difficult tiers on the Daily Challenge page.",
  },
];

// One panel per feature (Quiz, Daily Challenge) — each has its own fixed
// set of difficulty tiers (from the backend) and its own independent Save,
// per the requirement that the two be configurable separately. Rendered one
// at a time (behind the tabs below), keyed by feature so switching tabs
// remounts it with fresh state instead of carrying over stale tiers.
const FeatureSection = ({ description, feature, levels }) => {
  // A failed initial fetch leaves this [] (not null) — loading still flips
  // to false in that case, and the render below unconditionally maps over
  // it, so a non-array default here would crash the page instead of just
  // showing the error banner.
  const [tiers, setTiers] = useState([]); // [{ tier, label, levelIds }]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/difficulty-settings/${feature}`);
      setTiers(response.data?.data?.tiers || []);
    } catch (err) {
      console.error(`Error fetching ${feature} difficulty settings:`, err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTierLevelIds = (tierKey, levelIds) => {
    setTiers((prev) =>
      prev.map((t) => (t.tier === tierKey ? { ...t, levelIds } : t)),
    );
  };

  const handleSave = async () => {
    const emptyTier = tiers.find((t) => t.levelIds.length === 0);
    if (emptyTier) {
      setError(`"${emptyTier.label}" needs at least one level selected`);
      setTimeout(() => setError(""), 4000);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        tiers: Object.fromEntries(tiers.map((t) => [t.tier, t.levelIds])),
      };
      const response = await api.patch(
        `/difficulty-settings/${feature}`,
        payload,
      );
      setTiers(response.data?.data?.tiers || tiers);
      setSuccess("Saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(`Error saving ${feature} difficulty settings:`, err);
      setError(err.response?.data?.message || "Failed to save settings");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
      <p className="text-sm text-slate-500 dark:text-gray-400">{description}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200">
          {success}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500 dark:text-gray-400">
          Loading settings...
        </p>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {tiers.map((t) => (
              <div
                key={t.tier}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-32 shrink-0 font-semibold text-slate-800 dark:text-white">
                  {t.label}
                </span>
                <div className="flex-1">
                  <CategoryMultiSelect
                    categories={levels}
                    selectedIds={t.levelIds}
                    onChange={(ids) => setTierLevelIds(t.tier, ids)}
                    placeholder="Select levels"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </>
      )}
    </div>
  );
};

const DifficultySettings = () => {
  const [levels, setLevels] = useState([]);
  const [levelsError, setLevelsError] = useState("");

  // Kept in the URL (?tab=...) instead of plain component state so a page
  // refresh lands back on the same tab instead of resetting to Quiz.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : TABS[0].key;
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

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await api.get("/level/all");
        const raw = response.data?.data || [];
        setLevels(
          raw
            .filter((lvl) => !EXCLUDED_LEVEL_NAMES.includes(lvl.level))
            .map((lvl) => ({ id: lvl.id, name: lvl.level })),
        );
      } catch (err) {
        console.error("Error fetching levels:", err);
        setLevelsError("Failed to load available levels");
      }
    };

    fetchLevels();
  }, []);

  const active = TABS.find((tab) => tab.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Difficulty Settings"
          subtitle="Choose which levels count as Easy, Difficult, etc. for Quiz and Daily Challenge — independently, and with as many levels per tier as you like."
        />

        {levelsError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {levelsError}
          </div>
        )}

        {levels.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-500/50"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <tab.icon size={14} aria-hidden="true" />
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            <FeatureSection
              key={active.key}
              description={active.description}
              feature={active.key}
              levels={levels}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DifficultySettings;
