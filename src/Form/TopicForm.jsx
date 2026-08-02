// import React, { useState } from "react";
// import axios from "../axios";
// import Container from "../utils/Container";

// const TopicForm = () => {
//   const [topicData, setTopicData] = useState({
//     name: "",
//   });
//   const [loading, setLoading] = useState(false); // Loading state

//   // Handle form field changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setTopicData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   // Handle form submission
//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setLoading(true); // Set loading to true when starting the submission

//     try {
//       const response = await axios.post("/topic/create", topicData);
//       console.log("Topic added successfully:", response.data);
//       alert("Topic created successfully");
//       setTopicData({ name: "" }); // Clear form after successful submission
//     } catch (error) {
//       console.error("Error adding topic:", error);
//       alert("Error creating topic");
//     } finally {
//       setLoading(false); // Set loading to false after submission attempt
//     }
//   };

//   return (
//     <Container>
//       <form onSubmit={handleSubmit} className="space-y-4 p-4">
//         <div>
//           <label
//             htmlFor="name"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Topic Name
//           </label>
//           <input
//             type="text"
//             id="name"
//             name="name"
//             value={topicData.name}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={loading} // Disable button while loading
//           className="mt-4 w-full rounded-md bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           {loading ? "Submitting..." : "Submit"}{" "}
//           {/* Show loading text while submitting */}
//         </button>
//       </form>
//     </Container>
//   );
// };

// export default TopicForm;

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../axios";
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import { invalidateWordsCache } from "../utils/storage";
import Button from "../components/UI/Button";
import PageHeader from "../components/UI/PageHeader";

const TopicForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [topicData, setTopicData] = useState({
    name: "",
    levelId: "",
  });
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get("/level/all");
        setLevels(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch levels:", error);
        alert("Unable to load levels");
      }
    };

    fetchLevels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTopicData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await axios.post("/topic/create", {
        ...topicData,
        // Empty selection means "Any Level" — words from every level can be
        // filed under this topic, not just one.
        levelId: topicData.levelId ? parseInt(topicData.levelId, 10) : null,
      });
      await invalidateWordsCache();
      alert("Topic created successfully");
      setTopicData({ name: "", levelId: "" });
    } catch (error) {
      console.error("Error creating topic:", error);
      alert(error.response?.data?.message || "Error creating topic");
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <div className="min-h-screen ">
        <PageHeader
          title="Create a Topic"
          align="center"
          className="mt-8 mb-6"
        />
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-stone-800 rounded-md text-white "
        >
          <div>
            <label htmlFor="name" className="block  font-medium ">
              Topic Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={topicData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="levelId" className="block  font-medium ">
              Select Level (optional)
            </label>
            <select
              id="levelId"
              name="levelId"
              value={topicData.levelId}
              onChange={handleChange}
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
            >
              <option value="">Any Level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.level}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Leave as "Any Level" to let words from any level be filed under
              this topic.
            </p>
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-24">
            {loading ? "Creating..." : "Create Topic"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default TopicForm;
