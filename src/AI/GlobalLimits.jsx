import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import aiApi from "../AI_axios";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import Button from "../components/UI/Button";

const GlobalLimits = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
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

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-white placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <PageHeader
            surface="dark"
            title="Global Limits"
            subtitle="Default daily/monthly/yearly AI generation caps applied to every user who doesn't have a personal override (see User Limits)."
          />
        </div>

        <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="global-daily-limit"
                className="block text-sm font-medium text-gray-300"
              >
                Daily Limit
              </label>
              <input
                id="global-daily-limit"
                type="number"
                value={limits.dailyLimit}
                onChange={(e) =>
                  setLimits({ ...limits, dailyLimit: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="global-monthly-limit"
                className="block text-sm font-medium text-gray-300"
              >
                Monthly Limit
              </label>
              <input
                id="global-monthly-limit"
                type="number"
                value={limits.monthlyLimit}
                onChange={(e) =>
                  setLimits({ ...limits, monthlyLimit: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="global-yearly-limit"
                className="block text-sm font-medium text-gray-300"
              >
                Yearly Limit
              </label>
              <input
                id="global-yearly-limit"
                type="number"
                value={limits.yearlyLimit}
                onChange={(e) =>
                  setLimits({ ...limits, yearlyLimit: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <Button type="submit" surface="dark" disabled={loading}>
              {loading ? "Updating..." : "Update Limits"}
            </Button>
          </form>
          {message && <p className="text-sm text-gray-300">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default GlobalLimits;
