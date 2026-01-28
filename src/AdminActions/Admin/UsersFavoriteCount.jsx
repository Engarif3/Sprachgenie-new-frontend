import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Container from "../../utils/Container";
import { getUserInfo, isLoggedIn } from "../../services/auth.services";
import api from "../../axios";
import { useNavigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";

const UsersFavoriteCount = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchData = async () => {
    try {
      const response = await api.get("/users-favorite-count");

      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        setError("Invalid data format from server");
      }
    } catch (err) {
      console.error("Error fetching favorite counts:", err);
      setError("Error fetching favorite counts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-center text-white py-2 bg-cyan-700 rounded">
        Users & Favorite Words Count{" "}
        {/* <span className="text-md text-orange-300">({users.length})</span> */}
      </h2>

      {loading ? (
        <div className="flex justify-center py-4">
          <ScaleLoader color="oklch(0.5 0.134 242.749)" loading={loading} />
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="p-2 text-center">Name</th>
                <th className="p-2 text-center">Email</th>
                <th className="p-2 text-center">Favorite Count</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b odd:bg-white even:bg-gray-200"
                >
                  <td className="p-2 text-center text-slate-900">
                    {user.name}
                  </td>
                  <td className="p-2 text-center text-slate-900">
                    {user.email}
                  </td>
                  <td className="p-2 text-center font-bold text-blue-600">
                    {user.favoriteCount}
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

export default UsersFavoriteCount;
