import React, { useState, useEffect } from "react";
import Container from "../../utils/Container";
import { getUserInfo } from "../../services/auth.services";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";
import api from "../../axios";
import { useNavigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";

const UsersFavoriteCount = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userInfo = getUserInfo() || {};
  const navigate = useNavigate();

  const hasAccess =
    userInfo?.role === "admin" || userInfo?.role === "super_admin";

  useEffect(() => {
    if (!hasAccess) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const token = getFromLocalStorage(authKey);

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return; // Stop execution here
        }

        const response = await api.get(
          //   "http://localhost:5000/api/v1/users-favorite-count",
          "/users-favorite-count",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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

    fetchData();
  }, [hasAccess, navigate]);

  return (
    <>
      {hasAccess && (
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
      )}
    </>
  );
};

export default UsersFavoriteCount;
