import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ConversationTitleList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://sprcahgenie-new-backend.vercel.app/api/v1/conversation/all"
      );
      setConversations(response.data.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 mb-4 min-h-screen">
      <h2 className="text-2xl font-bold my-5 md:my-8 lg:my-8 text-center ">
        Conversation Topics
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8  ">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-gray-100 p-4 rounded shadow cursor-pointer hover:bg-gray-200 "
              onClick={() => navigate(`/conversation/${conversation.id}`)}
            >
              <h3 className="text-lg font-semibold">{conversation.topic}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationTitleList;
