import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import aiApi from "../AI_axios";
import { useAuth } from "../services/auth.services";
import PageHeader from "../components/UI/PageHeader";
import Button from "../components/UI/Button";

// Controls the IP-based generation limiter (shared/rateLimiter.js on the AI
// service) — the shared, per-network cap that sits in front of every
// paragraph/conjugation generation call, independent of each user's own
// daily/monthly/yearly quota (see GlobalLimits/UserLimits). Everyone testing
// or generating from the same network shares this one counter.
const IpRateLimits = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [limits, setLimits] = useState({
    burstLimit: "",
    dailyLimit: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchIpLimits = async () => {
      try {
        const res = await aiApi.get("/rate-limit/config");
        setLimits(res.data);
      } catch (err) {
        console.error("Failed to fetch IP rate limit config", err);
      }
    };
    fetchIpLimits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await aiApi.post("/rate-limit/config", {
        burstLimit: parseInt(limits.burstLimit),
        dailyLimit: parseInt(limits.dailyLimit),
      });
      setMessage("✅ IP rate limits updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update IP rate limits.");
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
            title="IP Rate Limits"
            subtitle="Shared cap applied per client IP address across all AI generation (paragraphs and conjugations), regardless of which user account is signed in."
          />
        </div>

        <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="ip-burst-limit"
                className="block text-sm font-medium text-gray-300"
              >
                Burst Limit (requests per minute)
              </label>
              <input
                id="ip-burst-limit"
                type="number"
                value={limits.burstLimit}
                onChange={(e) =>
                  setLimits({ ...limits, burstLimit: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="ip-daily-limit"
                className="block text-sm font-medium text-gray-300"
              >
                Daily Limit (requests per 24h)
              </label>
              <input
                id="ip-daily-limit"
                type="number"
                value={limits.dailyLimit}
                onChange={(e) =>
                  setLimits({ ...limits, dailyLimit: e.target.value })
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

export default IpRateLimits;
