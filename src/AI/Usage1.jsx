import React, { useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";
import Swal from "sweetalert2";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios";
import aiApi from "../AI_axios";

const Usage = () => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
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
      } catch {}

      // Fetch users
      const freshToken = getFromLocalStorage(authKey);
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      const users = userRes.data.data;

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
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!usageData.length)
    return <p className="text-center mt-4 text-white">No usage data found.</p>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-white">
        User Limits Usage
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="p-2 text-center">User ID</th>
              <th className="p-2 text-center">Name</th>
              <th className="p-2 text-center">Email</th>
              <th className="p-2 text-center">Daily Used / Left</th>
              <th className="p-2 text-center">Monthly Used / Left</th>
              <th className="p-2 text-center">Yearly Used / Left</th>
            </tr>
          </thead>
          <tbody>
            {usageData.map((u) => (
              <tr
                key={u.userId}
                className="border-b odd:bg-white even:bg-gray-100"
              >
                <td className="p-2 text-center">{u.userId}</td>
                <td className="p-2 text-center">{u.name}</td>
                <td className="p-2 text-center">{u.email}</td>
                <td className="p-2 text-center">
                  {u.daily.used} / {Math.max(u.daily.limit - u.daily.used, 0)}
                </td>
                <td className="p-2 text-center">
                  {u.monthly.used} /{" "}
                  {Math.max(u.monthly.limit - u.monthly.used, 0)}
                </td>
                <td className="p-2 text-center">
                  {u.yearly.used} /{" "}
                  {Math.max(u.yearly.limit - u.yearly.used, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usage;
