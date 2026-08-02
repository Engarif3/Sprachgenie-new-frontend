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
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <PageHeader
            title="Users & Favorite Words Count"
            subtitle="How many words each user has saved to their favorites."
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <ScaleLoader color="oklch(0.5 0.134 242.749)" loading={loading} />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-center text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-gray-900/60 dark:text-gray-200">
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
                    className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-gray-700 dark:odd:bg-gray-800/30 dark:even:bg-gray-800/60"
                  >
                    <td className="p-3 text-center text-slate-800 dark:text-gray-200">
                      {user.name}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="p-3 text-center font-bold text-sky-600 dark:text-sky-400">
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
