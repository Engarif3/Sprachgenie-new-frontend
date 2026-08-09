import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../services/auth.services";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";
import PageHeader from "../../components/UI/PageHeader";

const TABS = [
  { key: "words", label: "Words", endpoint: "/users-favorite-count" },
  {
    key: "conversations",
    label: "Conversations",
    endpoint: "/favorite-conversations/users-count",
  },
  { key: "stories", label: "Stories", endpoint: "/favorite-stories/users-count" },
  {
    key: "howToSay",
    label: "How To Say It",
    endpoint: "/favorite-how-to-say/users-count",
  },
];

const UsersFavoriteCount = () => {
  // Kept in the URL (?tab=...) instead of plain component state so a page
  // refresh lands back on the same tab instead of resetting to "words".
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : "words";
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
  // Keyed by tab key — fetched lazily, once per tab, and cached here so
  // switching tabs back and forth doesn't refetch.
  const [dataByTab, setDataByTab] = useState({});
  const [loadingTab, setLoadingTab] = useState(null);
  const [errorByTab, setErrorByTab] = useState({});
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

  useEffect(() => {
    if (!canAccess || dataByTab[activeTab]) return;

    const tab = TABS.find((t) => t.key === activeTab);
    setLoadingTab(activeTab);

    api
      .get(tab.endpoint)
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          setDataByTab((prev) => ({ ...prev, [activeTab]: response.data.data }));
        } else {
          setErrorByTab((prev) => ({
            ...prev,
            [activeTab]: "Invalid data format from server",
          }));
        }
      })
      .catch((err) => {
        console.error(`Error fetching favorite ${activeTab} counts:`, err);
        setErrorByTab((prev) => ({
          ...prev,
          [activeTab]: `Error fetching favorite ${activeTab} counts`,
        }));
      })
      .finally(() => setLoadingTab(null));
  }, [activeTab, canAccess, dataByTab]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const users = dataByTab[activeTab] || [];
  const error = errorByTab[activeTab];
  const isLoading = loadingTab === activeTab;

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <PageHeader
            title="Users & Favorites Count"
            subtitle="How many words, conversations, stories, and How To Say It phrases each user has saved to their favorites."
          />
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
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
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <ScaleLoader color="oklch(0.5 0.134 242.749)" loading={isLoading} />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-center text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-gray-400">
            No users have favorited any {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-gray-900/60 dark:text-gray-200">
                  <th className="p-3 text-center font-semibold">Name</th>
                  <th className="p-3 text-center font-semibold">Email</th>
                  <th className="p-3 text-center font-semibold">
                    Favorite Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-gray-700 dark:odd:bg-gray-800/30 dark:even:bg-gray-800/60"
                  >
                    <td className="p-3 text-left text-slate-800 dark:text-gray-200">
                      {user.name}
                    </td>
                    <td className="p-3 text-left text-slate-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="p-3 text-center font-bold text-sky-600 dark:text-sky-400">
                      {user.favoriteCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersFavoriteCount;
