import React, { useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";
import Swal from "sweetalert2";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios";
import aiApi from "../AI_axios";
import Pagination from "../AdminActions/AdminPaginationForUsers";

const Usage = () => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      } catch {}

      // Fetch active users with pagination
      const userRes = await api.get(
        `/user?page=${page}&limit=${limit}&status=ACTIVE`
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
      <div className="flex justify-center items-center h-64">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!usageData.length)
    return (
      <p className="text-center mt-4 text-white">No active users found.</p>
    );

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-white">
        Active Users Limits Usage
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="p-2 text-center">User ID</th>
              <th className="p-2 text-center">Name</th>
              <th className="p-2 text-center">Email</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">
                Daily <br /> Used / Limit
              </th>
              <th className="p-2 text-center">
                Monthly <br /> Used / Limit
              </th>
              <th className="p-2 text-center">
                Yearly <br /> Used / Limit
              </th>
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
                <td className="p-2 text-center">{u.status}</td>
                <td className="p-2 text-center">
                  {u.daily.used} / {u.daily.limit}
                </td>
                <td className="p-2 text-center">
                  {u.monthly.used} / {u.monthly.limit}
                </td>
                <td className="p-2 text-center">
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
  );
};

export default Usage;
