import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "../../utils/Container";
import { FaUser } from "react-icons/fa";
import Loader from "../../utils/Loader";
import api from "../../axios";

// Define colors for the speakers
const speakerColors = ["#FF0000", "#008000", "#0000FF", "#FFA500", "#000000"];

const ConversationPage = () => {
  const { id } = useParams(); // Get conversation ID from the URL
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/conversation/${id}`)
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
      <div className="min-h-screen py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader loading={loading} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
                  💬 Conversation
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                {conversation.topic}
              </h2>
            </div>

            {/* Chat Messages */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-gray-700/50 shadow-2xl mb-12">
              <div className="space-y-6">
                {conversation.text.map((message, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-4 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg group"
                  >
                    {/* Speaker Badge */}
                    <div className="flex items-center gap-2 md:min-w-[120px]">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${getSpeakerColor(
                            message.speaker
                          )}, ${getSpeakerColor(message.speaker)}dd)`,
                        }}
                      >
                        <FaUser className="text-white text-lg" />
                      </div>
                      <span
                        className="font-bold text-lg"
                        style={{ color: getSpeakerColor(message.speaker) }}
                      >
                        {message.speaker}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 group-hover:border-gray-600/50 transition-all duration-300">
                      <p className="text-white text-lg leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default ConversationPage;
