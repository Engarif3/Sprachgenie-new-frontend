import React, { useState } from "react";
import axios from "../axios";
import Container from "../utils/Container";

const TopicForm = () => {
  const [topicData, setTopicData] = useState({
    name: "",
  });
  const [loading, setLoading] = useState(false); // Loading state

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTopicData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when starting the submission

    try {
      const response = await axios.post("/topics", topicData);
      console.log("Topic added successfully:", response.data);
      alert("Topic created successfully");
      setTopicData({ name: "" }); // Clear form after successful submission
    } catch (error) {
      console.error("Error adding topic:", error);
      alert("Error creating topic");
    } finally {
      setLoading(false); // Set loading to false after submission attempt
    }
  };

  return (
    <Container>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Topic Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={topicData.name}
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

export default TopicForm;
