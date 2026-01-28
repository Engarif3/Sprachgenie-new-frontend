import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import aiApi from "../AI_axios";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

const GlobalLimits = () => {
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
  const [limits, setLimits] = useState({
    dailyLimit: "",
    monthlyLimit: "",
    yearlyLimit: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchGlobalLimits = async () => {
      try {
        const res = await aiApi.get("/paragraphs/get-limit", {
          params: { userId: "GLOBAL" },
        });
        setLimits(res.data);
      } catch (err) {
        console.error("Failed to fetch global limits", err);
      }
    };
    fetchGlobalLimits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await aiApi.post("/paragraphs/update-limit", {
        dailyLimit: parseInt(limits.dailyLimit),
        monthlyLimit: parseInt(limits.monthlyLimit),
        yearlyLimit: parseInt(limits.yearlyLimit),
      });
      setMessage("✅ Global limits updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update global limits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Global Limits</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">Daily Limit</label>
        <input
          type="number"
          value={limits.dailyLimit}
          onChange={(e) => setLimits({ ...limits, dailyLimit: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <label className="block text-sm font-medium">Monthly Limit</label>
        <input
          type="number"
          value={limits.monthlyLimit}
          onChange={(e) =>
            setLimits({ ...limits, monthlyLimit: e.target.value })
          }
          className="w-full border p-2 rounded"
        />
        <label className="block text-sm font-medium">Yearly Limit</label>
        <input
          type="number"
          value={limits.yearlyLimit}
          onChange={(e) =>
            setLimits({ ...limits, yearlyLimit: e.target.value })
          }
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800"
        >
          {loading ? "Updating..." : "Update Limits"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default GlobalLimits;
