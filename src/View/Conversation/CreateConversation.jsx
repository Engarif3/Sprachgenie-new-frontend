import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // Ensure SweetAlert2 is imported

const CreateConversation = () => {
  const [formData, setFormData] = useState({
    topic: "",
    levelId: 1, // Default level A1
    text: "", // JSON string for text
  });

  // Levels mapping
  const levels = [
    { value: 1, label: "A1" },
    { value: 2, label: "A2" },
    { value: 3, label: "B1" },
    { value: 4, label: "B2" },
    { value: 5, label: "C1" },
  ];

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle level change
  const handleLevelChange = (e) => {
    const selectedLevelId = parseInt(e.target.value); // Ensure it's an integer
    setFormData({ ...formData, levelId: selectedLevelId });
  };

  // Handle text change for JSON
  const handleTextChange = (e) => {
    setFormData({ ...formData, text: e.target.value });
  };

  // Create conversation
  const createConversation = async () => {
    try {
      // Ensure text is valid JSON
      let conversationText = [];
      try {
        conversationText = JSON.parse(formData.text); // Parse the text as JSON
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Invalid JSON format in the 'Text' field. Please check your input.",
          icon: "error",
          confirmButtonText: "Ok",
        });
        return;
      }

      const dataToSend = {
        topic: formData.topic,
        levelId: formData.levelId,
        text: conversationText,
      };

      const response = await axios.post(
        "https://sprcahgenie-new-backend.vercel.app/api/v1/conversation/create",
        dataToSend
      );

      if (response.data.success) {
        Swal.fire({
          title: "Success!",
          text: "Conversation created successfully.",
          icon: "success",
        });
        setFormData({
          topic: "",
          levelId: 1,
          text: "",
        });
      } else {
        throw new Error(
          response.data.message || "Failed to create conversation."
        );
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      Swal.fire({
        title: "Error!",
        text:
          error.response?.data?.message ||
          "An error occurred while creating the conversation.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Create Conversation</h2>
      <form className="space-y-3">
        {/* Topic */}
        <div>
          <label className="block font-semibold">Topic</label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            className="border p-2 w-full"
            placeholder="Enter conversation topic"
          />
        </div>

        {/* Level */}
        <div>
          <label className="block font-semibold">Level</label>
          <select
            name="levelId"
            value={formData.levelId}
            onChange={handleLevelChange}
            className="border p-2 w-full"
          >
            {levels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Messages as JSON */}
        <div>
          <label className="block font-semibold">Text (JSON format)</label>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleTextChange}
            className="border p-2 w-full"
            rows="6"
            placeholder='[{ "speaker": "Lena", "message": "Hallo..." }]'
          />
          <p className="text-sm text-gray-500 mt-2">
            Please enter the text as valid JSON. For example:
            <br />
            <code>[{`{"speaker": "Lena", "message": "Hallo..."}`}]</code>
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={createConversation}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Create Conversation
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConversation;
