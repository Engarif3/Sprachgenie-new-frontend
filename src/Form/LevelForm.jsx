import React, { useState } from "react";
import axios from "../axios"; // Adjust the axios import if needed
import Container from "../utils/Container";

const LevelForm = () => {
  const [levelData, setLevelData] = useState({
    levelName: "", // Update to levelName
  });
  const [loading, setLoading] = useState(false); // Loading state

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLevelData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when starting the submission

    if (!levelData.levelName.trim()) {
      // Use levelName
      alert("Level name is required");
      setLoading(false); // Reset loading state if level name is empty
      return;
    }

    try {
      const response = await axios.post("/levels", levelData);
      console.log("Level added successfully:", response.data);
      alert("Level created successfully");
      setLevelData({ levelName: "" }); // Clear form after successful submission
    } catch (error) {
      console.error("Error adding level:", error);
      alert("Error creating level");
    } finally {
      setLoading(false); // Set loading to false after submission attempt
    }
  };

  return (
    <Container>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label
            htmlFor="levelName" // Update to levelName
            className="block  font-medium text-gray-700"
          >
            Level Name
          </label>
          <input
            type="text"
            id="levelName" // Update to levelName
            name="levelName" // Update to levelName
            value={levelData.levelName} // Update to levelName
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading} // Disable button while loading
          className="mt-4 w-full rounded-md bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? "Submitting..." : "Submit"}{" "}
          {/* Show loading text while submitting */}
        </button>
      </form>
    </Container>
  );
};

export default LevelForm;
