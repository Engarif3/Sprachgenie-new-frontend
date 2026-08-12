//for admin
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2"; // Ensure SweetAlert2 is imported
import { useAuth } from "../../services/auth.services";
import { ScaleLoader } from "react-spinners";
import api from "../../axios"; // Use configured axios instance
import CategoryMultiSelect from "../../components/UI/CategoryMultiSelect";

const ConversationsList = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [editingConversation, setEditingConversation] = useState(null);
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  // Guards against re-opening the modal if the admin closes it manually —
  // only ever auto-opens once per ?edit= deep link.
  const hasAutoOpenedRef = useRef(false);
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
      setFetchError("");
      const response = await api.get("/conversation/all");
      setConversations(response.data.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setFetchError("Failed to load conversations. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all conversation categories (for the edit modal's Category select)
  const fetchCategories = async () => {
    try {
      const response = await api.get("/conversation-category/all");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching conversation categories:", error);
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
      categoryIds: (conversation.categories || []).map((c) => c.id),
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

  // Handle category selection (multi-select)
  const handleCategoryIdsChange = (nextCategoryIds) => {
    setFormData({ ...formData, categoryIds: nextCategoryIds });
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
        categoryIds: formData.categoryIds,
      };

      // Log the updated data after parsing
      console.log("Updated Data after parsing:", updatedData);

      await api.put(
        `/conversation/update/${editingConversation.id}`,
        updatedData,
      );
      // Re-fetch rather than splicing the local state: the response only
      // has scalar fields, but the list row displays the nested `category`
      // relation, which a simple `{ ...conv, ...updatedData }` merge can't
      // refresh.
      await fetchConversations();
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
    fetchCategories();
  }, []);

  // Deep link from the conversation detail page's Edit button
  // (?edit=<conversationId>) — auto-opens that conversation's edit modal
  // once the list has loaded, instead of making the admin find it again.
  useEffect(() => {
    if (hasAutoOpenedRef.current || conversations.length === 0) {
      return;
    }

    const editId = searchParams.get("edit");
    if (!editId) {
      return;
    }

    const targetConversation = conversations.find(
      (conversation) => String(conversation.id) === editId,
    );

    if (targetConversation) {
      openEditModal(targetConversation);
    }

    hasAutoOpenedRef.current = true;
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen bg-slate-50 dark:bg-transparent">
      <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white my-5 md:my-8 lg:my-8 text-center">
        Conversation Topics
      </h2>
      {fetchError && (
        <p className="text-center text-red-700 bg-red-50 border border-red-300 dark:text-red-400 dark:bg-red-900/30 dark:border-red-500/40 rounded-lg py-3 px-4 my-4">
          {fetchError}
        </p>
      )}
      {loading ? (
        <p className="flex justify-center items-center  ">
          <span>
            <ScaleLoader
              color="#36d7b7"
              loading={loading}
              // cssOverride={override}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </span>
        </p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/60 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {conversation.topic}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {conversation.categories?.length > 0 ? (
                    conversation.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      >
                        {category.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      Uncategorized
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex flex-shrink-0 gap-2 self-start sm:self-center">
                  <button
                    onClick={() => openEditModal(conversation)}
                    className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              Edit Conversation
            </h2>
            <form className="space-y-4">
              {/* Topic */}
              <div>
                <label
                  htmlFor="edit-conversation-topic"
                  className="block font-semibold text-slate-800 dark:text-white"
                >
                  Topic
                </label>
                <input
                  id="edit-conversation-topic"
                  type="text"
                  name="topic"
                  value={formData.topic || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Level */}
              <div>
                <label
                  htmlFor="edit-conversation-level"
                  className="block font-semibold text-slate-800 dark:text-white"
                >
                  Level
                </label>
                <select
                  id="edit-conversation-level"
                  name="levelId"
                  value={formData.levelId || ""}
                  onChange={handleLevelChange}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="edit-conversation-category"
                  className="block font-semibold text-slate-800 dark:text-white"
                >
                  Categories
                </label>
                <div className="mt-1">
                  <CategoryMultiSelect
                    id="edit-conversation-category"
                    categories={categories}
                    selectedIds={formData.categoryIds || []}
                    onChange={handleCategoryIdsChange}
                    placeholder="Uncategorized (optional)"
                  />
                </div>
              </div>

              {/* Text Messages as JSON */}
              <div>
                <label
                  htmlFor="edit-conversation-text"
                  className="block font-semibold text-slate-800 dark:text-white"
                >
                  Text (JSON format)
                </label>
                <textarea
                  id="edit-conversation-text"
                  name="text"
                  value={formData.text || ""}
                  onChange={handleTextChange}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  rows="6"
                />
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                  Please enter the text as valid JSON. For example:
                  <br />
                  <code>[{`{"speaker": "Lena", "message": "Hallo..."}`}]</code>
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-full bg-slate-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateConversation}
                  className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
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
