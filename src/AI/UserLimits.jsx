import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import aiApi from "../AI_axios";
import { ScaleLoader } from "react-spinners";
import api from "../axios";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import Button from "../components/UI/Button";

const UserLimits = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [users, setUsers] = useState([]);
  const [globalLimits, setGlobalLimits] = useState({
    dailyLimit: 10,
    monthlyLimit: 300,
    yearlyLimit: 3000,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showUserId, setShowUserId] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedGlobalLimits = {
          dailyLimit: 10,
          monthlyLimit: 300,
          yearlyLimit: 3000,
        };
        try {
          const res = await aiApi.get("/paragraphs/get-limit", {
            params: { userId: "GLOBAL" },
          });
          fetchedGlobalLimits = res.data;
        } catch {
          console.warn("Global limits not found, using defaults");
        }

        setGlobalLimits(fetchedGlobalLimits);

        // 2️⃣ Fetch users - exclude only pending users
        const userRes = await api.get("/user");
        const usersData = userRes.data.data.filter(
          (user) => user.status && user.status.toLowerCase() !== "pending",
        );

        // 3️⃣ Merge user limits with normalized fallback
        const usersWithLimits = await Promise.all(
          usersData.map(async (user) => {
            try {
              const limitRes = await aiApi.get("/paragraphs/get-limit", {
                params: { userId: user.id },
              });

              return {
                ...user,
                dailyLimit:
                  limitRes.data.dailyLimit ?? fetchedGlobalLimits.dailyLimit,
                monthlyLimit:
                  limitRes.data.monthlyLimit ??
                  fetchedGlobalLimits.monthlyLimit,
                yearlyLimit:
                  limitRes.data.yearlyLimit ?? fetchedGlobalLimits.yearlyLimit,
              };
            } catch {
              // fallback to global limits if user has no record
              return {
                ...user,
                dailyLimit: fetchedGlobalLimits.dailyLimit,
                monthlyLimit: fetchedGlobalLimits.monthlyLimit,
                yearlyLimit: fetchedGlobalLimits.yearlyLimit,
              };
            }
          }),
        );

        setUsers(usersWithLimits);
      } catch (err) {
        console.error("Error fetching users or limits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResetToGlobal = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setUpdatingId(userId);

    try {
      // Call backend to reset (you can design API to delete user’s limit record or update with global)
      await aiApi.post("/paragraphs/update-limit", {
        userId,
        dailyLimit: globalLimits.dailyLimit,
        monthlyLimit: globalLimits.monthlyLimit,
        yearlyLimit: globalLimits.yearlyLimit,
      });

      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...globalLimits } : u)),
      );

      Swal.fire({
        icon: "success",
        title: "Limits reset",
        text: `${user.name}'s limits were reset to global.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to reset limits", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetAllToGlobal = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will reset ALL users' limits to the global values.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reset all!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);

          // Call backend API to reset all
          await aiApi.post("/paragraphs/reset-all-limits");

          // Update state in frontend (all users → global limits)
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              dailyLimit: globalLimits.dailyLimit,
              monthlyLimit: globalLimits.monthlyLimit,
              yearlyLimit: globalLimits.yearlyLimit,
            })),
          );

          Swal.fire(
            "Reset!",
            "All users' limits were reset to global.",
            "success",
          );
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Failed to reset all limits", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleLimitChange = (userId, field, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u)),
    );
  };

  const handleUpdateLimits = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setUpdatingId(userId);

    try {
      await aiApi.post("/paragraphs/update-limit", {
        userId,
        dailyLimit: user.dailyLimit ? parseInt(user.dailyLimit) : undefined,
        monthlyLimit: user.monthlyLimit
          ? parseInt(user.monthlyLimit)
          : undefined,
        yearlyLimit: user.yearlyLimit ? parseInt(user.yearlyLimit) : undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Limits updated",
        text: `${user.name}'s limits were updated successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update limits", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!users.length)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <p className="text-center text-slate-700 dark:text-white">
          No users found.
        </p>
      </div>
    );

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const limitInputClass =
    "w-20 rounded-md border border-slate-300 bg-white p-1 text-center text-slate-900 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/30 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white";

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <PageHeader
            title="User Limits"
            subtitle="Per-user AI generation caps. Users without a personal override fall back to the global limits below."
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">
            Global Limits:
          </span>
          <span className="rounded bg-red-600/80 px-2 py-0.5 text-sm text-white">
            Daily-{globalLimits.dailyLimit}
          </span>
          <span className="rounded bg-green-600/80 px-2 py-0.5 text-sm text-white">
            Monthly-{globalLimits.monthlyLimit}
          </span>
          <span className="rounded bg-blue-600/80 px-2 py-0.5 text-sm text-white">
            Yearly-{globalLimits.yearlyLimit}
          </span>
        </div>

        <div className="mb-4 flex justify-between items-center gap-2">
          <Button variant="secondary" onClick={() => setShowUserId(!showUserId)}>
            {showUserId ? "🔒 Hide ID" : "👁️ Show ID"}
          </Button>
          <Button variant="danger" onClick={handleResetAllToGlobal}>
            Reset All to Global
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-700 dark:bg-gray-900/60 dark:text-gray-200">
                {showUserId && (
                  <th className="p-3 text-center font-semibold">ID</th>
                )}
                <th className="p-3 text-center font-semibold">Name</th>
                <th className="p-3 text-center font-semibold">Email</th>
                <th className="p-3 text-center font-semibold">
                  Daily Limit
                </th>
                <th className="p-3 text-center font-semibold">
                  Monthly Limit
                </th>
                <th className="p-3 text-center font-semibold">
                  Yearly Limit
                </th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-gray-700 dark:odd:bg-gray-800/30 dark:even:bg-gray-800/60"
                >
                  {showUserId && (
                    <td className="p-3 text-center text-slate-600 dark:text-gray-300">
                      {user.id}
                    </td>
                  )}
                  <td className="p-3 text-center text-slate-800 dark:text-gray-200">
                    {user.name}
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-gray-300">
                    {user.email}
                  </td>

                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={
                        user.dailyLimit != null && user.dailyLimit !== 0
                          ? user.dailyLimit
                          : globalLimits.dailyLimit
                      }
                      onChange={(e) =>
                        handleLimitChange(
                          user.id,
                          "dailyLimit",
                          e.target.value,
                        )
                      }
                      className={limitInputClass}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={
                        user.monthlyLimit != null && user.monthlyLimit !== 0
                          ? user.monthlyLimit
                          : globalLimits.monthlyLimit
                      }
                      onChange={(e) =>
                        handleLimitChange(
                          user.id,
                          "monthlyLimit",
                          e.target.value,
                        )
                      }
                      className={limitInputClass}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={
                        user.yearlyLimit != null && user.yearlyLimit !== 0
                          ? user.yearlyLimit
                          : globalLimits.yearlyLimit
                      }
                      onChange={(e) =>
                        handleLimitChange(
                          user.id,
                          "yearlyLimit",
                          e.target.value,
                        )
                      }
                      className={limitInputClass}
                    />
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateLimits(user.id)}
                        disabled={updatingId === user.id}
                      >
                        {updatingId === user.id ? "Updating..." : "Update"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetToGlobal(user.id)}
                        disabled={updatingId === user.id}
                      >
                        Reset
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserLimits;
