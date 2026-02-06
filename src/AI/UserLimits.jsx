import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import aiApi from "../AI_axios";
import { ScaleLoader } from "react-spinners";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

const UserLimits = () => {
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

  // Security check: Only allow admin/super_admin users
  if (
    !userLoggedIn ||
    !userInfo.id ||
    (userInfo.role !== "admin" && userInfo.role !== "super_admin")
  ) {
    return <Navigate to="/" replace />;
  }
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
      <div className="flex justify-center items-center h-64">
        <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      </div>
    );
  }

  if (!users.length) return <p className="text-center mt-4">No users found.</p>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold  text-center text-white mb-12">
        User Limits
      </h2>
      <p className="text-white text-center my-2">
        <span className="text-lg font-bold  rounded px-1">Global Limits:</span>{" "}
        <span className=" bg-red-600 rounded px-1">
          Daily-
          {globalLimits.dailyLimit}
        </span>{" "}
        <span className=" bg-green-600 rounded px-1">
          Monthly-
          {globalLimits.monthlyLimit}
        </span>{" "}
        <span className=" bg-blue-600 rounded px-1">
          {" "}
          Yearly-{globalLimits.yearlyLimit}
        </span>
      </p>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowUserId(!showUserId)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showUserId ? "🔒 Hide ID" : "👁️ Show ID"}
          </button>
          <button
            onClick={handleResetAllToGlobal}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reset All to Global
          </button>
        </div>

        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-cyan-700 text-white">
              {showUserId && <th className="p-2 text-center">ID</th>}
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
                {showUserId && <td className="p-2 text-center">{user.id}</td>}
                <td className="p-2 text-center">{user.name}</td>
                <td className="p-2 text-center">{user.email}</td>

                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={
                      user.dailyLimit != null && user.dailyLimit !== 0
                        ? user.dailyLimit
                        : globalLimits.dailyLimit
                    }
                    onChange={(e) =>
                      handleLimitChange(user.id, "dailyLimit", e.target.value)
                    }
                    className="w-20 p-1 border rounded text-center"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={
                      user.monthlyLimit != null && user.monthlyLimit !== 0
                        ? user.monthlyLimit
                        : globalLimits.monthlyLimit
                    }
                    onChange={(e) =>
                      handleLimitChange(user.id, "monthlyLimit", e.target.value)
                    }
                    className="w-20 p-1 border rounded text-center"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={
                      user.yearlyLimit != null && user.yearlyLimit !== 0
                        ? user.yearlyLimit
                        : globalLimits.yearlyLimit
                    }
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
    </div>
  );
};

export default UserLimits;
