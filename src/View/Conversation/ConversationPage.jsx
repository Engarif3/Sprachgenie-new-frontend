import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Container from "../../utils/Container";
import { FaUser } from "react-icons/fa";

// Define colors for the speakers
const speakerColors = ["#FF0000", "#008000", "#0000FF", "#FFA500", "#000000"];

const ConversationPage = () => {
  const { id } = useParams(); // Get conversation ID from the URL
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(
        `https://sprcahgenie-new-backend.vercel.app/api/v1/conversation/${id}`
      )
      .then((response) => {
        if (response.data.data) {
          setConversation(response.data.data);
        } else {
          setError("Conversation not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load conversation data.");
        setLoading(false);
      });
  }, [id]);

  const speakerColorMap = new Map();
  const getSpeakerColor = (speaker) => {
    if (!speakerColorMap.has(speaker)) {
      const colorIndex = speakerColorMap.size % speakerColors.length;
      speakerColorMap.set(speaker, speakerColors[colorIndex]);
    }
    return speakerColorMap.get(speaker);
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
    <Container>
      <div className="max-w-4xl mx-auto p-0 md:p-4 lg:p-4 min-h-screen mt-4">
        <div className="text-cyan-800 mb-0 md:mb-4 lg:mb-4 text-center text-3xl font-bold font-custom5">
          <h2>{conversation.topic}</h2>
        </div>
        <div className="p-4 rounded-lg shadow-md mb-12">
          {conversation.text.map((message, index) => (
            <div
              key={index}
              className="text-lg my-4 px-2 border-b-2 border-dotted"
            >
              <p>
                <span
                  className="text-xl font-semibold flex items-center gap-1 border-slate-950"
                  style={{ color: getSpeakerColor(message.speaker) }}
                >
                  <FaUser /> {message.speaker}:
                </span>
                <span>{message.message}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default ConversationPage;
