import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import Swal from "sweetalert2";
import aiApi from "../AI_axios";
import api from "../axios";
import { useAuth } from "../services/auth.services";

// Shows current burst/daily usage per client IP against the IP-based
// generation limiter (see IpRateLimits.jsx for editing the caps themselves).
// Unlike the per-user Usage page, IPs aren't a known/registered set — this
// only lists IPs the AI service has actually seen hit the limiter recently.
const IpUsage = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

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
          return { ...row, matchedUser };
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-white">
        IP Usage (AI Generation)
      </h2>
      <p className="text-white text-center text-sm mb-4 opacity-80">
        Only IPs seen making a generation request recently are listed —
        unlike per-user usage, IPs aren't pre-registered.
      </p>

      <div className="flex justify-end mb-4">
        <button
          onClick={fetchUsage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {!usage.length ? (
        <p className="text-center text-white">
          No IPs have hit the generation limiter recently.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-cyan-700 text-white">
                <th className="p-2 text-center">IP Address</th>
                <th className="p-2 text-center">Last Seen User</th>
                <th className="p-2 text-center">
                  Burst (1 min) <br /> Used / Limit
                </th>
                <th className="p-2 text-center">
                  Daily (24h) <br /> Used / Limit
                </th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u) => (
                <tr
                  key={u.ip}
                  className="border-b odd:bg-white even:bg-gray-100"
                >
                  <td className="p-2 text-center font-mono">{u.ip}</td>
                  <td className="p-2 text-center">
                    {u.matchedUser ? (
                      <>
                        <div>{u.matchedUser.name}</div>
                        <div className="text-xs text-gray-500">
                          {u.matchedUser.email}
                        </div>
                      </>
                    ) : u.userIdHint ? (
                      <span className="text-xs text-gray-500" title={u.userIdHint}>
                        Unknown ({u.userIdHint.slice(0, 12)}…)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Guest</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {u.burst.used} / {u.burst.limit}
                  </td>
                  <td className="p-2 text-center">
                    {u.daily.used} / {u.daily.limit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IpUsage;
