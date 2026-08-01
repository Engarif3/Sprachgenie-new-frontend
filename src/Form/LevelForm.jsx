import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../axios"; // Adjust the axios import if needed
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import Button from "../components/UI/Button";

const LevelForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
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
      const response = await axios.post("/level/create", levelData);
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

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
          />
        </div>

        <Button type="submit" disabled={loading} fullWidth className="mt-4">
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Container>
  );
};

export default LevelForm;
