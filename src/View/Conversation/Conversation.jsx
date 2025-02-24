import React, { useEffect, useState } from "react";
import axios from "axios";

// Define the colors for the speakers using hex values
const speakerColors = ["#FF0000", "#008000", "#0000FF", "#FFA500", "#000000"];

const Conversation = () => {
  const [conversationData, setConversationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversation data from the API
  useEffect(() => {
    axios
      .get("https://sprcahgenie-new-backend.vercel.app/api/v1/conversation/all")
      .then((response) => {
        // Check if the response contains valid data
        const conversations = response.data.data;

        if (Array.isArray(conversations) && conversations.length > 0) {
          setConversationData(conversations); // Set all conversations
        } else {
          setError("No conversations found.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load conversation data.");
        setLoading(false);
      });
  }, []);

  // Map to store the color for each speaker (to ensure consistency)
  const speakerColorMap = new Map();

  // Function to get or assign a color to the speaker
  const getSpeakerColor = (speaker) => {
    if (!speakerColorMap.has(speaker)) {
      // If the speaker doesn't have a color yet, assign one
      const colorIndex = speakerColorMap.size % speakerColors.length; // Cycle through colors
      speakerColorMap.set(speaker, speakerColors[colorIndex]);
    }
    return speakerColorMap.get(speaker);
  };

  // Render messages for each conversation
  const renderMessages = (messages) => {
    return messages.map((message, index) => {
      const personColor = getSpeakerColor(message.speaker); // Get or assign color for the speaker
      return (
        <div
          key={index}
          className={`text-lg my-4  px-2 border-b-2 border-dotted `}
        >
          <p>
            <span
              className="text-xl font-semibold"
              style={{ color: personColor }}
            >
              {message.speaker}:
            </span>{" "}
            <span className="ml-2">{message.message}</span>
          </p>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div
          className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-600 rounded-full"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        {conversationData.map((conversation, idx) => (
          <div key={idx}>
            {/* Display the topic at the top */}
            <div className="text-cyan-800 mb-4 text-center text-3xl font-bold font-custom5">
              <h2>{conversation.topic}</h2>
            </div>

            <div className="p-4 rounded-lg shadow-md">
              {renderMessages(conversation.text)}{" "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Conversation;
