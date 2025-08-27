// import { useState } from "react";

// import aiApi from "../AI_axios";
// import { getUserInfo } from "../services/auth.services";

// const UpdateLimits = () => {
//   const userInfo = getUserInfo();
//   const [userId, setUserId] = useState("");
//   const [dailyLimit, setDailyLimit] = useState("");
//   const [monthlyLimit, setMonthlyLimit] = useState("");
//   const [yearlyLimit, setYearlyLimit] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     try {
//       await aiApi.post("/paragraphs/update-limit", {
//         userId: userId || undefined, // keep as string for per-user limit
//         dailyLimit: dailyLimit ? parseInt(dailyLimit) : undefined,
//         monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : undefined,
//         yearlyLimit: yearlyLimit ? parseInt(yearlyLimit) : undefined,
//       });

//       setMessage("✅ Limits updated successfully!");
//     } catch (err) {
//       console.error(err);
//       setMessage("❌ Failed to update limits.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-lg mt-6">
//       <h2 className="text-xl font-semibold mb-4">Update User Limits</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* User ID (optional) */}
//         <div>
//           <label className="block text-sm font-medium">
//             User ID (optional)
//           </label>
//           <input
//             type="text"
//             value={userId}
//             onChange={(e) => setUserId(e.target.value)}
//             placeholder="Leave empty for global"
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Daily Limit */}
//         <div>
//           <label className="block text-sm font-medium">Daily Limit</label>
//           <input
//             type="number"
//             value={dailyLimit}
//             onChange={(e) => setDailyLimit(e.target.value)}
//             placeholder="e.g. 10"
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Monthly Limit */}
//         <div>
//           <label className="block text-sm font-medium">Monthly Limit</label>
//           <input
//             type="number"
//             value={monthlyLimit}
//             onChange={(e) => setMonthlyLimit(e.target.value)}
//             placeholder="e.g. 300"
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Yearly Limit */}
//         <div>
//           <label className="block text-sm font-medium">Yearly Limit</label>
//           <input
//             type="number"
//             value={yearlyLimit}
//             onChange={(e) => setYearlyLimit(e.target.value)}
//             placeholder="e.g. 3000"
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800"
//         >
//           {loading ? "Updating..." : "Update Limits"}
//         </button>
//       </form>

//       {message && <p className="mt-4 text-sm">{message}</p>}
//     </div>
//   );
// };

// export default UpdateLimits;

import { useState, useEffect } from "react";
import aiApi from "../AI_axios";
import { getUserInfo } from "../services/auth.services";

const UpdateLimits = () => {
  const userInfo = getUserInfo();
  const [userId, setUserId] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [yearlyLimit, setYearlyLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch current limits when component mounts or userId changes
  useEffect(() => {
    const fetchLimits = async () => {
      if (!userId) {
        // Fetch global limits
        try {
          const res = await aiApi.get("/paragraphs/get-limit", {
            params: { userId: "GLOBAL" },
          });
          const limits = res.data;
          setDailyLimit(limits.dailyLimit);
          setMonthlyLimit(limits.monthlyLimit);
          setYearlyLimit(limits.yearlyLimit);
        } catch (err) {
          console.error("Failed to fetch global limits", err);
        }
      } else {
        // Fetch per-user limits
        try {
          const res = await aiApi.get("/paragraphs/get-limit", {
            params: { userId },
          });
          const limits = res.data;
          setDailyLimit(limits.dailyLimit);
          setMonthlyLimit(limits.monthlyLimit);
          setYearlyLimit(limits.yearlyLimit);
        } catch (err) {
          console.error("Failed to fetch user limits", err);
          // Fallback: reset to empty if not found
          setDailyLimit("");
          setMonthlyLimit("");
          setYearlyLimit("");
        }
      }
    };

    fetchLimits();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await aiApi.post("/paragraphs/update-limit", {
        userId: userId || undefined,
        dailyLimit: dailyLimit ? parseInt(dailyLimit) : undefined,
        monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : undefined,
        yearlyLimit: yearlyLimit ? parseInt(yearlyLimit) : undefined,
      });

      setMessage("✅ Limits updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update limits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Update User Limits</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User ID */}
        <div>
          <label className="block text-sm font-medium">
            User ID (optional)
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Leave empty for global"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Daily Limit */}
        <div>
          <label className="block text-sm font-medium">Daily Limit</label>
          <input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Monthly Limit */}
        <div>
          <label className="block text-sm font-medium">Monthly Limit</label>
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Yearly Limit */}
        <div>
          <label className="block text-sm font-medium">Yearly Limit</label>
          <input
            type="number"
            value={yearlyLimit}
            onChange={(e) => setYearlyLimit(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

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

export default UpdateLimits;
