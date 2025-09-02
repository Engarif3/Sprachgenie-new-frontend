import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import aiApi from "../AI_axios";
import { ScaleLoader } from "react-spinners";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios";

const UserLimits = () => {
  const [users, setUsers] = useState([]);
  const [globalLimits, setGlobalLimits] = useState({
    dailyLimit: 10,
    monthlyLimit: 300,
    yearlyLimit: 3000,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // users per page

  const fetchUsers = async (pageNumber = 1) => {
    try {
      setLoading(true);

      // fetch global limits
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
      } catch {}
      setGlobalLimits(fetchedGlobalLimits);

      // fetch active users with pagination
      const token = getFromLocalStorage(authKey);
      const res = await api.get(
        `/user?role=BASIC_USER&status=ACTIVE&page=${pageNumber}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const usersData = res.data.data;
      const total = res.data.meta.total || usersData.length;
      setTotalPages(Math.ceil(total / limit));

      // fetch individual user limits
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
                limitRes.data.monthlyLimit ?? fetchedGlobalLimits.monthlyLimit,
              yearlyLimit:
                limitRes.data.yearlyLimit ?? fetchedGlobalLimits.yearlyLimit,
            };
          } catch {
            return {
              ...user,
              dailyLimit: fetchedGlobalLimits.dailyLimit,
              monthlyLimit: fetchedGlobalLimits.monthlyLimit,
              yearlyLimit: fetchedGlobalLimits.yearlyLimit,
            };
          }
        })
      );

      setUsers(usersWithLimits);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleResetToGlobal = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setUpdatingId(userId);
    try {
      await aiApi.post("/paragraphs/update-limit", {
        userId,
        ...globalLimits,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...globalLimits } : u))
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
      text: "This will reset ALL ACTIVE users' limits to the global values.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset all!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await aiApi.post("/paragraphs/reset-all-limits", {
            status: "ACTIVE",
          });
          fetchUsers(1); // refetch first page of active users
          Swal.fire(
            "Reset!",
            "All ACTIVE users' limits were reset to global.",
            "success"
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
      prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
    );
  };

  const handleUpdateLimits = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setUpdatingId(userId);
    try {
      await aiApi.post("/paragraphs/update-limit", {
        userId,
        dailyLimit: parseInt(user.dailyLimit),
        monthlyLimit: parseInt(user.monthlyLimit),
        yearlyLimit: parseInt(user.yearlyLimit),
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  if (!users.length)
    return <p className="text-center mt-4">No active users found.</p>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        User Limits (Active Users)
      </h2>

      <p className="text-white text-center my-2">
        <span className="text-lg font-bold rounded px-1">Global Limits:</span>
        <span className="bg-red-600 rounded px-1">
          Daily-{globalLimits.dailyLimit}
        </span>{" "}
        <span className="bg-green-600 rounded px-1">
          Monthly-{globalLimits.monthlyLimit}
        </span>{" "}
        <span className="bg-blue-600 rounded px-1">
          Yearly-{globalLimits.yearlyLimit}
        </span>
      </p>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleResetAllToGlobal}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Reset All to Global
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="p-2 text-center">ID</th>
              <th className="p-2 text-center">Name</th>
              <th className="p-2 text-center">Email</th>
              <th className="p-2 text-center">Daily Limit</th>
              <th className="p-2 text-center">Monthly Limit</th>
              <th className="p-2 text-center">Yearly Limit</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b odd:bg-white even:bg-gray-100"
              >
                <td className="p-2 text-center">{user.id}</td>
                <td className="p-2 text-center">{user.name}</td>
                <td className="p-2 text-center">{user.email}</td>

                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={user.dailyLimit}
                    onChange={(e) =>
                      handleLimitChange(user.id, "dailyLimit", e.target.value)
                    }
                    className="w-20 p-1 border rounded text-center"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={user.monthlyLimit}
                    onChange={(e) =>
                      handleLimitChange(user.id, "monthlyLimit", e.target.value)
                    }
                    className="w-20 p-1 border rounded text-center"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={user.yearlyLimit}
                    onChange={(e) =>
                      handleLimitChange(user.id, "yearlyLimit", e.target.value)
                    }
                    className="w-20 p-1 border rounded text-center"
                  />
                </td>

                <td className="p-2 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => handleUpdateLimits(user.id)}
                    disabled={updatingId === user.id}
                    className="bg-cyan-700 text-white px-3 py-1 rounded hover:bg-cyan-800"
                  >
                    {updatingId === user.id ? "Updating..." : "Update"}
                  </button>
                  <button
                    onClick={() => handleResetToGlobal(user.id)}
                    disabled={updatingId === user.id}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-white">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserLimits;
