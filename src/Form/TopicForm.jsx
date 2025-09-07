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
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
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

import React, { useEffect, useState } from "react";
import axios from "../axios";
import Container from "../utils/Container";

const TopicForm = () => {
  const [topicData, setTopicData] = useState({
    name: "",
    levelId: "", // add levelId field
  });
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all levels on mount
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get("/level/all"); // Update this endpoint if needed
        setLevels(response.data.data);
      } catch (error) {
        console.error("Failed to fetch levels:", error);
        alert("Unable to load levels");
      }
    };

    fetchLevels();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTopicData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Submit the form
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/topic/create", {
        ...topicData,
        levelId: parseInt(topicData.levelId), // cast to number
      });
      alert("Topic created successfully");
      setTopicData({ name: "", levelId: "" });
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("Error creating topic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="min-h-screen ">
       <h2 className="text-white text-3xl font-semibold mt-8 mb-6 text-center" >Create a Topic</h2>
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
              className="mt-1 block w-full input-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="levelId" className="block  font-medium ">
              Select Level
            </label>
            <select
              id="levelId"
              name="levelId"
              value={topicData.levelId}
              onChange={handleChange}
              required
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <option value="">Select Level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.level}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-24 w-full rounded-md bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 "
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </Container>
  );
};

export default TopicForm;
