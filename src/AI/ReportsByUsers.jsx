// import { useEffect, useState } from "react";
// import aiApi from "../AI_axios";

// const ReportsByUsers = () => {
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const fetchReports = async () => {
//     try {
//       setLoading(true);
//       const response = await aiApi.get("/paragraphs/get-reports");
//       setReports(response.data || []);
//     } catch (err) {
//       console.error("Error fetching reports:", err);
//       setError("Failed to load reports");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReports();
//   }, []);

//   if (loading) return <p>Loading reports...</p>;
//   if (error) return <p className="text-red-600">{error}</p>;
//   if (reports.length === 0) return <p>No reports found.</p>;

//   return (
//     <div className="overflow-x-auto mt-4 bg-white">
//       <table className="table-auto w-full border border-gray-300 rounded-lg">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="px-4 py-2 border">Word</th>
//             <th className="px-4 py-2 border">Total Reports</th>
//             <th className="px-4 py-2 border">Reported by</th>
//             <th className="px-4 py-2 border">Message</th>
//           </tr>
//         </thead>
//         <tbody>
//           {reports.map((r, index) => (
//             <tr key={index} className="hover:bg-gray-50">
//               <td className="px-4 py-2 border">
//                 <p className="truncate max-w-xs">{r.paragraph?.word}</p>
//               </td>
//               <td className="px-4 py-2 border">{r.reportCount}</td>
//               <td className="px-4 py-2 border">{r.paragraph.userId}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ReportsByUsers;
import { useEffect, useState } from "react";
import aiApi from "../AI_axios";

const ReportsByUsers = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await aiApi.get("/paragraphs/get-reports");
      setReports(response.data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <p>Loading reports...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (reports.length === 0) return <p>No reports found.</p>;

  return (
    <div className="overflow-x-auto mt-4 bg-white">
      <table className="table-auto w-full border border-gray-300 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Word</th>
            <th className="px-4 py-2 border">Total Reports</th>
            <th className="px-4 py-2 border">Reported by</th>
            <th className="px-4 py-2 border">Message</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, index) => (
            <tr key={index} className="hover:bg-gray-50 align-top">
              <td className="px-4 py-2 border">{r.word}</td>
              <td className="px-4 py-2 border">{r.reportCount}</td>
              <td className="px-4 py-2 border">
                {r.reports.map((rep, i) => (
                  <div key={i}>{rep.userId}</div>
                ))}
              </td>
              <td className="px-4 py-2 border">
                {r.reports.map((rep, i) => (
                  <div key={i}>{rep.message}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsByUsers;
