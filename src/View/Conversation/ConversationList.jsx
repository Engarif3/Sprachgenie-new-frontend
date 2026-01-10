//for admin
import { useEffect, useState } from "react";
import Swal from "sweetalert2"; // Ensure SweetAlert2 is imported
import { getUserInfo } from "../../services/auth.services";
import { ScaleLoader } from "react-spinners";
import api from "../../axios"; // Use configured axios instance

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingConversation, setEditingConversation] = useState(null);
  const [formData, setFormData] = useState({});
  const userInfo = getUserInfo() || {};
  // Levels mapping
  const levels = [
    { value: 1, label: "A1" },
    { value: 2, label: "A2" },
    { value: 3, label: "B1" },
    { value: 4, label: "B2" },
    { value: 5, label: "C1" },
  ];

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conversation/all");
      setConversations(response.data.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a conversation
  const deleteConversation = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/conversation/delete/${id}`, {
          data: {}, // Some servers expect empty data for DELETE
        });

        // Check for server's success criteria
        if (response.data.success) {
          setConversations(conversations.filter((c) => c.id !== id));
          Swal.fire("Deleted!", "Conversation removed.", "success");
        } else {
          throw new Error(response.data.message || "Deletion failed");
        }
      } catch (error) {
        console.error("Delete error details:", {
          errorCode: error.code,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Deletion failed unexpectedly",
          icon: "error",
        });

        fetchConversations(); // Refresh list to confirm actual state
      }
    }
  };
  // Open update modal with all conversation data
  const openEditModal = (conversation) => {
    setEditingConversation(conversation);
    setFormData({
      ...conversation,
      text: JSON.stringify(conversation.text, null, 2), // Convert `text` array to JSON string
    });
  };

  // Close update modal
  const closeEditModal = () => {
    setEditingConversation(null);
    setFormData({});
  };

  // Handle input change in modal
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle text change for JSON
  const handleTextChange = (e) => {
    const updatedText = e.target.value;
    setFormData({ ...formData, text: updatedText });
  };

  // Handle level change
  const handleLevelChange = (e) => {
    const selectedLevelId = parseInt(e.target.value); // Ensure it's an integer
    setFormData({ ...formData, levelId: selectedLevelId });
  };

  // Update conversation
  const updateConversation = async () => {
    try {
      // Log the current value of formData to debug
      console.log("FormData before submitting:", formData);

      // Ensure `text` is properly formatted as JSON
      let updatedText = [];
      try {
        updatedText = JSON.parse(formData.text); // Parse the text as JSON
      } catch (error) {
        console.error("Invalid JSON in text field:", error);
        Swal.fire({
          title: "Error!",
          text: "Invalid JSON format in the 'Text' field. Please check your input.",
          icon: "error",
          confirmButtonText: "Ok",
        });
        return;
      }

      const updatedData = {
        topic: formData.topic,
        text: updatedText,
        levelId: formData.levelId,
      };

      // Log the updated data after parsing
      console.log("Updated Data after parsing:", updatedData);

      await api.put(
        `/conversation/update/${editingConversation.id}`,
        updatedData
      );
      setConversations(
        conversations.map((conv) =>
          conv.id === editingConversation.id
            ? { ...conv, ...updatedData }
            : conv
        )
      );
      closeEditModal();
      Swal.fire({
        title: "Success!",
        text: "Conversation updated successfully.",
        icon: "success",
        confirmButtonText: "Ok",
      });
    } catch (error) {
      console.error("Error updating conversation:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating the conversation.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen">
      <h2 className="text-3xl font-bold font-mono text-white my-5 md:my-8 lg:my-8 text-center">
        Conversation Topics
      </h2>
      {loading ? (
        <p className="flex justify-center items-center  ">
          <span>
            <ScaleLoader
              color="oklch(0.5 0.134 242.749)"
              loading={loading}
              // cssOverride={override}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </span>
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded shadow"
            >
              <span>{conversation.topic}</span>
              {(userInfo.role === "super_admin" ||
                userInfo.role === "admin") && (
                <div className="space-x-2">
                  <button
                    onClick={() => openEditModal(conversation)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Update Modal */}
      {editingConversation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-[500px]">
            <h2 className="text-lg font-bold mb-4">Edit Conversation</h2>
            <form className="space-y-3">
              {/* Topic */}
              <div>
                <label className="block font-semibold">Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic || ""}
                  onChange={handleInputChange}
                  className="border p-2 w-full"
                />
              </div>

              {/* Level */}
              <div>
                <label className="block font-semibold">Level</label>
                <select
                  name="levelId"
                  value={formData.levelId || ""}
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
                <label className="block font-semibold">
                  Text (JSON format)
                </label>
                <textarea
                  name="text"
                  value={formData.text || ""}
                  onChange={handleTextChange}
                  className="border p-2 w-full"
                  rows="6"
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
                  onClick={closeEditModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateConversation}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
