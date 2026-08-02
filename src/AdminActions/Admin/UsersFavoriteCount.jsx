import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../services/auth.services";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";
import PageHeader from "../../components/UI/PageHeader";

const UsersFavoriteCount = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

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

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <PageHeader
            surface="dark"
            title="Users & Favorite Words Count"
            subtitle="How many words each user has saved to their favorites."
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <ScaleLoader color="oklch(0.5 0.134 242.749)" loading={loading} />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-center text-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/50">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-900/60 text-gray-200">
                  <th className="p-3 text-center font-semibold">Name</th>
                  <th className="p-3 text-center font-semibold">Email</th>
                  <th className="p-3 text-center font-semibold">
                    Favorite Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-700 odd:bg-gray-800/30 even:bg-gray-800/60"
                  >
                    <td className="p-3 text-center text-gray-200">
                      {user.name}
                    </td>
                    <td className="p-3 text-center text-gray-300">
                      {user.email}
                    </td>
                    <td className="p-3 text-center font-bold text-sky-400">
                      {user.favoriteCount}
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

export default UsersFavoriteCount;
