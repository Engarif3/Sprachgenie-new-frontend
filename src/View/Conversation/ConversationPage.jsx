import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Container from "../../utils/Container";
import { FaUser } from "react-icons/fa";
import Loader from "../../utils/Loader";

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

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="min-h-screen flex justify-center items-center ">
        {loading ? (
          <Loader loading={loading} />
        ) : (
          <div className="mx-auto p-0 md:p-4 lg:p-4  mt-4 md:w-8/12 lg:w-8/12 ">
            <div className="text-cyan-800 mb-0 md:mb-4 lg:mb-4 text-center text-3xl font-bold font-custom5 ">
              <h2>{conversation.topic}</h2>
            </div>
            <div className="md:p-4 lg.p-4 rounded-lg shadow-md mb-12 bg-slate-700">
              {conversation.text.map((message, index) => (
                <div key={index} className="text-lg my-4 px-2 ">
                  <div className="flex flex-col md:flex-row lg.flex-row md:gap-4 lg:gap-4 ">
                    <span
                      className="text-xl font-semibold flex items-center gap-1 md:border lg.border bg-cyan-750 w-full md:w-1/12 lg:w-1/12 rounded-md p-1 "
                      style={{ color: getSpeakerColor(message.speaker) }}
                    >
                      <FaUser /> {message.speaker}:
                    </span>
                    <p className="text-start w-full p-1 border border-cyan-700 rounded-md px-2 font-thin text-white">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default ConversationPage;
