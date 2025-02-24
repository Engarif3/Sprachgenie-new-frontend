import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Container from "../../utils/Container";

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
    <Container>
      <div className="max-w-5xl mx-auto p-4 mb-4 min-h-screen">
        <h2 className="text-3xl font-bold my-5 md:my-8 lg:my-8 text-center ">
          Conversation Topics
        </h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8  ">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-gradient-to-r from-sky-800 via-blue-500 to-cyan-500 p-4 rounded shadow  transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500 text-white will-change-transform"
                onClick={() => navigate(`/conversation/${conversation.id}`)}
              >
                <h3 className="text-lg font-semibold">{conversation.topic}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ConversationTitleList;
