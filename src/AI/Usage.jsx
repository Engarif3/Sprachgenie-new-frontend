import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import Swal from "sweetalert2";
import api from "../axios";
import aiApi from "../AI_axios";
import Pagination from "../AdminActions/AdminPaginationForUsers";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import Button from "../components/UI/Button";
import { IoLockClosedOutline, IoEyeOutline } from "react-icons/io5";

const Usage = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserId, setShowUserId] = useState(false);
  const limit = 50;

  const fetchUsage = async (page = 1) => {
    try {
      setLoading(true);

      // Fetch global limits
      let globalLimits = {
        dailyLimit: 10,
        monthlyLimit: 300,
        yearlyLimit: 3000,
      };
      try {
        const resGlobal = await aiApi.get("/paragraphs/get-limit", {
          params: { userId: "GLOBAL" },
        });
        globalLimits = resGlobal.data;
      } catch (error) {
        console.warn("Failed to load global AI limits, using defaults.", error);
      }

      // Fetch active users with pagination
      const userRes = await api.get(
        `/user?page=${page}&limit=${limit}&status=ACTIVE`,
      );
      const users = userRes.data.data || [];
      const total = userRes.data.meta?.total || users.length;
      setTotalPages(Math.ceil(total / limit));

      // Fetch usage
      const usageRes = await aiApi.get("/paragraphs/get-usage");
      const usageRaw = usageRes.data;

      // Merge usage with user info and apply global limits
      const merged = users.map((user) => {
        const usage = usageRaw.find((u) => u.userId === user.id) || {};
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          status: user.status || "N/A",
          daily: {
            used: usage.daily?.used ?? 0,
            limit: usage.daily?.limit ?? globalLimits.dailyLimit,
          },
          monthly: {
            used: usage.monthly?.used ?? 0,
            limit: usage.monthly?.limit ?? globalLimits.monthlyLimit,
          },
          yearly: {
            used: usage.yearly?.used ?? 0,
            limit: usage.yearly?.limit ?? globalLimits.yearlyLimit,
          },
        };
      });

      setUsageData(merged);
    } catch (err) {
      console.error("Failed to fetch usage:", err);
      Swal.fire("Error", "Failed to fetch usage data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage(page);
  }, [page]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <ScaleLoader color="oklch(0.5 0.134 242.749)" loading={loading} size={150} />
      </div>
    );
  }

  if (!usageData.length)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <p className="text-center text-slate-700 dark:text-white">
          No active users found.
        </p>
      </div>
    );

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            title="Active Users Limits Usage"
            subtitle="AI generation usage against each user's daily/monthly/yearly cap."
          />
          <Button variant="secondary" onClick={() => setShowUserId(!showUserId)}>
            <span className="inline-flex items-center gap-1.5">
              {showUserId ? (
                <IoLockClosedOutline size={14} aria-hidden="true" />
              ) : (
                <IoEyeOutline size={14} aria-hidden="true" />
              )}
              {showUserId ? "Hide ID" : "Show ID"}
            </span>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-700 dark:bg-gray-900/60 dark:text-gray-200">
                {showUserId && (
                  <th className="p-3 text-center font-semibold">User ID</th>
                )}
                <th className="p-3 text-center font-semibold">Name</th>
                <th className="p-3 text-center font-semibold">Email</th>
                <th className="p-3 text-center font-semibold">Status</th>
                <th className="p-3 text-center font-semibold">
                  Daily <br /> Used / Limit
                </th>
                <th className="p-3 text-center font-semibold">
                  Monthly <br /> Used / Limit
                </th>
                <th className="p-3 text-center font-semibold">
                  Yearly <br /> Used / Limit
                </th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((u) => (
                <tr
                  key={u.userId}
                  className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-gray-700 dark:odd:bg-gray-800/30 dark:even:bg-gray-800/60"
                >
                  {showUserId && (
                    <td className="p-3 text-center text-slate-600 dark:text-gray-300">
                      {u.userId}
                    </td>
                  )}
                  <td className="p-3 text-left text-slate-800 dark:text-gray-200">
                    {u.name}
                  </td>
                  <td className="p-3 text-left text-slate-600 dark:text-gray-300">
                    {u.email}
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-gray-300">
                    {u.status}
                  </td>
                  <td className="p-3 text-center text-slate-800 dark:text-gray-200">
                    {u.daily.used} / {u.daily.limit}
                  </td>
                  <td className="p-3 text-center text-slate-800 dark:text-gray-200">
                    {u.monthly.used} / {u.monthly.limit}
                  </td>
                  <td className="p-3 text-center text-slate-800 dark:text-gray-200">
                    {u.yearly.used} / {u.yearly.limit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Usage;
