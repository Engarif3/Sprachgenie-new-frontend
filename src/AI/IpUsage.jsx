import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import Swal from "sweetalert2";
import aiApi from "../AI_axios";
import api from "../axios";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import Button from "../components/UI/Button";

// Shows current burst/daily usage per client IP against the IP-based
// generation limiter (see IpRateLimits.jsx for editing the caps themselves).
// Unlike the per-user Usage page, IPs aren't a known/registered set — this
// only lists IPs the AI service has actually seen hit the limiter recently.
const IpUsage = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingIp, setResettingIp] = useState(null);
  const [resettingAll, setResettingAll] = useState(false);
  const [savingOverrideIp, setSavingOverrideIp] = useState(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const [usageRes, usersRes] = await Promise.all([
        aiApi.get("/rate-limit/usage"),
        // Best-effort only — the userIdHint on each row comes straight from
        // the client's request body, unverified, so it may not match any
        // real account (or may be stale/spoofed). Never used for anything
        // security-sensitive, just a display label.
        api.get("/user").catch(() => null),
      ]);

      const usersById = new Map(
        (usersRes?.data?.data || []).map((u) => [u.id, u]),
      );

      setUsage(
        usageRes.data.map((row) => {
          const matchedUser = row.userIdHint
            ? usersById.get(row.userIdHint)
            : null;
          return {
            ...row,
            matchedUser,
            pendingBurstLimit: row.override?.burstLimit ?? "",
            pendingDailyLimit: row.override?.dailyLimit ?? "",
          };
        }),
      );
    } catch (err) {
      console.error("Failed to fetch IP usage:", err);
      Swal.fire("Error", "Failed to fetch IP usage data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Every mutating action here (reset, save/clear a custom limit) requires
  // typing "OK" rather than just clicking a confirm button — a plain
  // click-through confirm is too easy to hit by accident on a page full of
  // per-row action buttons.
  const confirmWithTypedOk = async (title, text) => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      input: "text",
      inputPlaceholder: 'Type "OK" to confirm',
      showCancelButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      inputValidator: (value) => {
        if ((value || "").trim().toUpperCase() !== "OK") {
          return 'You must type "OK" to confirm';
        }
      },
    });
    return result.isConfirmed;
  };

  const handleResetIp = async (ip) => {
    const confirmed = await confirmWithTypedOk(
      `Reset usage for ${ip}?`,
      "This clears its burst + daily usage back to 0.",
    );
    if (!confirmed) return;

    setResettingIp(ip);
    try {
      await aiApi.post("/rate-limit/reset", { ip });
      setUsage((prev) =>
        prev.map((row) =>
          row.ip === ip
            ? {
                ...row,
                burst: { ...row.burst, used: 0 },
                daily: { ...row.daily, used: 0 },
              }
            : row,
        ),
      );
      Swal.fire({
        icon: "success",
        title: "Reset",
        text: `${ip}'s usage was reset.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to reset IP usage", "error");
    } finally {
      setResettingIp(null);
    }
  };

  const handleOverrideFieldChange = (ip, field, value) => {
    setUsage((prev) =>
      prev.map((row) => (row.ip === ip ? { ...row, [field]: value } : row)),
    );
  };

  const handleSaveOverride = async (ip) => {
    const row = usage.find((r) => r.ip === ip);
    if (!row) return;

    const confirmed = await confirmWithTypedOk(
      `Set custom limit for ${ip}?`,
      `Burst: ${row.pendingBurstLimit || "global default"}, Daily: ${row.pendingDailyLimit || "global default"}.`,
    );
    if (!confirmed) return;

    setSavingOverrideIp(ip);
    try {
      await aiApi.post("/rate-limit/override", {
        ip,
        burstLimit: row.pendingBurstLimit || null,
        dailyLimit: row.pendingDailyLimit || null,
      });
      await fetchUsage();
      Swal.fire({
        icon: "success",
        title: "Saved",
        text: `Custom limit saved for ${ip}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save custom limit", "error");
    } finally {
      setSavingOverrideIp(null);
    }
  };

  const handleClearOverride = async (ip) => {
    const confirmed = await confirmWithTypedOk(
      `Clear custom limit for ${ip}?`,
      "It will revert to the global default burst/daily limit.",
    );
    if (!confirmed) return;

    setSavingOverrideIp(ip);
    try {
      await aiApi.delete("/rate-limit/override", { data: { ip } });
      await fetchUsage();
      Swal.fire({
        icon: "success",
        title: "Cleared",
        text: `${ip} reverted to the global default limit.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to clear custom limit", "error");
    } finally {
      setSavingOverrideIp(null);
    }
  };

  const handleResetAll = async () => {
    const confirmed = await confirmWithTypedOk(
      "Reset all IPs?",
      "This clears burst + daily usage for every IP currently tracked.",
    );
    if (!confirmed) return;

    setResettingAll(true);
    try {
      const res = await aiApi.post("/rate-limit/reset-all");
      setUsage((prev) =>
        prev.map((row) => ({
          ...row,
          burst: { ...row.burst, used: 0 },
          daily: { ...row.daily, used: 0 },
        })),
      );
      Swal.fire(
        "Reset!",
        `${res.data.count} IP(s) had their usage reset.`,
        "success",
      );
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to reset all IP usage", "error");
    } finally {
      setResettingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const overrideInputClass =
    "w-16 rounded-md border border-gray-600 bg-gray-900/60 p-1 text-center text-sm text-white placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            surface="dark"
            title="IP Usage (AI Generation)"
            subtitle="Only IPs seen making a generation request recently are listed — unlike per-user usage, IPs aren't pre-registered."
          />
          <div className="flex gap-2">
            <Button surface="dark" variant="secondary" onClick={fetchUsage}>
              🔄 Refresh
            </Button>
            <Button
              surface="dark"
              variant="danger"
              onClick={handleResetAll}
              disabled={resettingAll || !usage.length}
            >
              {resettingAll ? "Resetting..." : "🗑️ Reset All"}
            </Button>
          </div>
        </div>

        {!usage.length ? (
          <p className="text-center text-white">
            No IPs have hit the generation limiter recently.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/50">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-900/60 text-gray-200">
                  <th className="p-3 text-center font-semibold">
                    IP Address
                  </th>
                  <th className="p-3 text-center font-semibold">
                    Last Seen User
                  </th>
                  <th className="p-3 text-center font-semibold">
                    Burst (1 min) <br /> Used / Limit
                  </th>
                  <th className="p-3 text-center font-semibold">
                    Daily (24h) <br /> Used / Limit
                  </th>
                  <th className="p-3 text-center font-semibold">
                    Custom Limit
                  </th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr
                    key={u.ip}
                    className="border-t border-gray-700 odd:bg-gray-800/30 even:bg-gray-800/60"
                  >
                    <td className="p-3 text-center align-middle font-mono text-gray-200">
                      {u.ip}
                    </td>
                    <td className="p-3 text-center align-middle text-gray-200">
                      {u.matchedUser ? (
                        <>
                          <div>{u.matchedUser.name}</div>
                          <div className="text-xs text-gray-400">
                            {u.matchedUser.email}
                          </div>
                        </>
                      ) : u.userIdHint ? (
                        <span
                          className="text-xs text-gray-400"
                          title={u.userIdHint}
                        >
                          Unknown ({u.userIdHint.slice(0, 12)}…)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Guest</span>
                      )}
                    </td>
                    <td className="p-3 text-center align-middle text-gray-200">
                      {u.burst.used} / {u.burst.limit}
                    </td>
                    <td className="p-3 text-center align-middle text-gray-200">
                      {u.daily.used} / {u.daily.limit}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="flex flex-row justify-center gap-1">
                        <input
                          type="number"
                          placeholder="Burst"
                          value={u.pendingBurstLimit}
                          onChange={(e) =>
                            handleOverrideFieldChange(
                              u.ip,
                              "pendingBurstLimit",
                              e.target.value,
                            )
                          }
                          className={overrideInputClass}
                        />
                        <input
                          type="number"
                          placeholder="Daily"
                          value={u.pendingDailyLimit}
                          onChange={(e) =>
                            handleOverrideFieldChange(
                              u.ip,
                              "pendingDailyLimit",
                              e.target.value,
                            )
                          }
                          className={overrideInputClass}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="mx-auto flex max-w-[180px] flex-row flex-wrap justify-center gap-1">
                        <button
                          onClick={() => handleSaveOverride(u.ip)}
                          disabled={savingOverrideIp === u.ip}
                          className="whitespace-nowrap rounded px-2 py-1 text-xs text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
                        >
                          {savingOverrideIp === u.ip ? "Saving..." : "Save"}
                        </button>
                        {u.override && (
                          <button
                            onClick={() => handleClearOverride(u.ip)}
                            disabled={savingOverrideIp === u.ip}
                            className="whitespace-nowrap rounded px-2 py-1 text-xs text-white bg-gray-600 hover:bg-gray-500 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          onClick={() => handleResetIp(u.ip)}
                          disabled={resettingIp === u.ip || resettingAll}
                          className="whitespace-nowrap rounded px-2 py-1 text-xs text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        >
                          {resettingIp === u.ip ? "Resetting..." : "Reset"}
                        </button>
                      </div>
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

export default IpUsage;
