import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import aiApi from "../AI_axios"; // AI backend for limits
import { ScaleLoader } from "react-spinners";
import { getFromLocalStorage } from "../utils/local-storage";
import { authKey } from "../constants/authkey";
import api from "../axios"; // main user backend

const UserLimits = () => {
  const [users, setUsers] = useState([]);
  const [globalLimits, setGlobalLimits] = useState({
    dailyLimit: 10,
    monthlyLimit: 300,
    yearlyLimit: 3000,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         // 1️⃣ Fetch global limits
  //         let fetchedGlobalLimits = {
  //           dailyLimit: 10,
  //           monthlyLimit: 300,
  //           yearlyLimit: 3000,
  //         };
  //         try {
  //           const res = await aiApi.get("/paragraphs/get-limit", {
  //             params: { userId: "GLOBAL" },
  //           });
  //           fetchedGlobalLimits = res.data;
  //         } catch {}

  //         setGlobalLimits(fetchedGlobalLimits);

  //         // 2️⃣ Fetch users
  //         const freshToken = getFromLocalStorage(authKey);
  //         const userRes = await api.get("/user", {
  //           headers: { Authorization: `Bearer ${freshToken}` },
  //         });
  //         const usersData = userRes.data.data;

  //         // 3️⃣ Map users and apply global limits fallback
  //         const usersWithLimits = await Promise.all(
  //           usersData.map(async (user) => {
  //             try {
  //               const limitRes = await aiApi.get("/paragraphs/get-limit", {
  //                 params: { userId: user.id },
  //               });
  //               return { ...user, ...limitRes.data };
  //             } catch {
  //               // fallback to fetched global limits
  //               return {
  //                 ...user,
  //                 dailyLimit: fetchedGlobalLimits.dailyLimit,
  //                 monthlyLimit: fetchedGlobalLimits.monthlyLimit,
  //                 yearlyLimit: fetchedGlobalLimits.yearlyLimit,
  //               };
  //             }
  //           })
  //         );

  //         setUsers(usersWithLimits);
  //       } catch (err) {
  //         console.error("Error fetching users or limits:", err);
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     fetchData();
  //   }, []); // no dependency on globalLimits

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Fetch global limits
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

        // 2️⃣ Fetch users
        const freshToken = getFromLocalStorage(authKey);
        const userRes = await api.get("/user", {
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        const usersData = userRes.data.data;

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
          })
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

                <td className="p-2 text-center">
                  <button
                    onClick={() => handleUpdateLimits(user.id)}
                    disabled={updatingId === user.id}
                    className="bg-cyan-700 text-white px-3 py-1 rounded hover:bg-cyan-800"
                  >
                    {updatingId === user.id ? "Updating..." : "Update"}
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
