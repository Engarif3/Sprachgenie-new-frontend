import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../axios";
import aiApi from "../../AI_axios";

const StoriesManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, draft
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [editVocabulary, setEditVocabulary] = useState([]);
  const [newVocabWord, setNewVocabWord] = useState("");
  const [newVocabMeaning, setNewVocabMeaning] = useState("");
  const [regenerateModal, setRegenerateModal] = useState(false);
  const [regenerateStoryId, setRegenerateStoryId] = useState(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [regenerateLevel, setRegenerateLevel] = useState("A2");
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  // Guards against re-opening the modal if the admin closes it manually —
  // only ever auto-opens once per ?edit= deep link.
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    fetchStories();
  }, []);

  // Deep link from the story detail page's "Edit this story" button
  // (?edit=<storyId>) — auto-opens that story's edit modal once the list
  // has loaded, instead of making the admin find it again.
  useEffect(() => {
    if (hasAutoOpenedRef.current || stories.length === 0) {
      return;
    }

    const editId = searchParams.get("edit");
    if (!editId) {
      return;
    }

    const targetStory = stories.find((story) => story.id === editId);
    if (targetStory) {
      openEditModal(targetStory);
    }

    hasAutoOpenedRef.current = true;
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories, searchParams]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      // Get all stories (both published and draft)
      const response = await api.get(`/stories/admin/all`);
      setStories(response.data.data || []);
    } catch (err) {
      console.error("Error fetching stories:", err);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (storyId) => {
    if (!window.confirm("Are you sure you want to publish this story?")) {
      return;
    }

    try {
      await api.put(`/stories/${storyId}/publish`, { isPublished: true });
      setSuccess("Story published successfully!");
      fetchStories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error publishing story:", err);
      setError("Failed to publish story");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUnpublish = async (storyId) => {
    if (!window.confirm("Are you sure you want to unpublish this story?")) {
      return;
    }

    try {
      await api.put(`/stories/${storyId}/publish`, { isPublished: false });
      setSuccess("Story unpublished successfully!");
      fetchStories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error unpublishing story:", err);
      setError("Failed to unpublish story");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (storyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this story? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/stories/${storyId}`);
      setSuccess("Story deleted successfully!");
      fetchStories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting story:", err);
      setError("Failed to delete story");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openEditModal = (story) => {
    setEditingStoryId(story.id);
    setEditTitle(story.title);
    setEditDescription(story.description);
    setEditImagePreview(story.image || null);
    setEditImage(null);
    setEditVocabulary(
      Array.isArray(story.vocabulary)
        ? story.vocabulary.map((item) => ({ ...item }))
        : [],
    );
    setNewVocabWord("");
    setNewVocabMeaning("");
  };

  const closeEditModal = () => {
    setEditingStoryId(null);
    setEditTitle("");
    setEditDescription("");
    setEditImage(null);
    setEditImagePreview(null);
    setEditVocabulary([]);
    setNewVocabWord("");
    setNewVocabMeaning("");
  };

  const handleVocabItemChange = (index, field, value) => {
    setEditVocabulary((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteVocabItem = (index) => {
    setEditVocabulary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVocabItem = () => {
    if (!newVocabWord.trim() || !newVocabMeaning.trim()) {
      setError("Enter both a word and a meaning to add vocabulary");
      return;
    }

    setEditVocabulary((prev) => [
      ...prev,
      { word: newVocabWord.trim(), meaning: newVocabMeaning.trim() },
    ]);
    setNewVocabWord("");
    setNewVocabMeaning("");
  };

  const handleSaveEdit = async () => {
    if (!editingStoryId || !editTitle.trim() || !editDescription.trim()) {
      setError("Title and description cannot be empty");
      return;
    }

    setEditLoading(true);
    setError(""); // Clear previous errors
    try {
      // First update the story details
      await api.put(`/stories/${editingStoryId}/update`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        vocabulary: editVocabulary,
      });

      // If there's a new image, upload it
      if (editImage) {
        await handleUploadEditImage(editingStoryId);
      }

      setSuccess("Story updated successfully!");
      closeEditModal();
      fetchStories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating story:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to update story";
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditImagePreview(event.target.result);
      setEditImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadEditImage = async (storyId) => {
    if (!editImage) return;

    setUploadingEditImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", editImage);

      console.log("Uploading image for story:", storyId);
      console.log("File details:", {
        name: editImage.name,
        size: editImage.size,
        type: editImage.type,
      });

      // Don't set Content-Type header - let axios/browser handle it automatically
      // This ensures the multipart/form-data boundary is set correctly
      const response = await api.post(
        `/stories/${storyId}/upload-image`,
        formDataToSend,
      );

      console.log("Image uploaded successfully:", response.data);
    } catch (err) {
      console.error("Error uploading image:", err);
      console.error("Full error response:", err.response?.data);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to upload image";
      throw new Error(errorMsg);
    } finally {
      setUploadingEditImage(false);
    }
  };

  const openRegenerateModal = (story) => {
    setRegenerateStoryId(story.id);
    setRegenerateLevel(story.level?.level || "A2");
    setRegeneratePrompt("");
    setRegenerateModal(true);
  };

  const closeRegenerateModal = () => {
    setRegenerateModal(false);
    setRegenerateStoryId(null);
    setRegeneratePrompt("");
  };

  const handleRegenerate = async () => {
    if (!regeneratePrompt.trim()) {
      setError("Please enter a prompt for regeneration");
      return;
    }

    setRegenerateLoading(true);
    try {
      // Call AI service to regenerate story
      const aiResponse = await aiApi.post("/stories/generate", {
        prompt: regeneratePrompt.trim(),
        level: regenerateLevel,
      });
      const data = aiResponse.data;

      if (data && data.data) {
        const generatedStory = data.data;

        // Update the story with new content INCLUDING vocabulary
        await api.put(`/stories/${regenerateStoryId}/update`, {
          title: generatedStory.title,
          description: generatedStory.description,
          vocabulary: generatedStory.vocabulary || [],
        });

        setSuccess("Story regenerated successfully!");
        closeRegenerateModal();
        fetchStories();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error regenerating story:", err);
      setError("Failed to regenerate story");
      setTimeout(() => setError(""), 3000);
    } finally {
      setRegenerateLoading(false);
    }
  };

  // Filter stories based on status and search term
  const filteredStories = stories.filter((story) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && story.isPublished) ||
      (filterStatus === "draft" && !story.isPublished);

    const matchesSearch =
      searchTerm === "" ||
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-2">
            Stories Management
          </h1>
          <p className="text-gray-400">
            View, edit, publish, and delete your German language stories
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div>
              <label
                htmlFor="stories-search"
                className="block text-white font-semibold mb-2"
              >
                Search Stories
              </label>
              <input
                id="stories-search"
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Filter Status */}
            <div>
              <label
                htmlFor="stories-filter-status"
                className="block text-white font-semibold mb-2"
              >
                Filter by Status
              </label>
              <select
                id="stories-filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">All Stories</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
            {success}
          </div>
        )}

        {/* Stories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No stories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500 transition-colors duration-300"
              >
                {/* Image */}
                {story.image && (
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-40 object-cover"
                  />
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {story.title}
                  </h3>

                  {/* Status Badge */}
                  <div className="mb-3">
                    {story.isPublished ? (
                      <span className="inline-block px-3 py-1 bg-green-600/30 border border-green-500 text-green-300 text-xs font-semibold rounded-full">
                        ✅ Published
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-yellow-600/30 border border-yellow-500 text-yellow-300 text-xs font-semibold rounded-full">
                        📝 Draft
                      </span>
                    )}
                  </div>

                  {/* Description Preview */}
                  <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                    {story.description}
                  </p>

                  {/* Metadata */}
                  <div className="text-xs text-gray-400 mb-4 space-y-1">
                    <p>
                      📚 Level:{" "}
                      <span className="text-orange-400">
                        {story.level?.level || "N/A"}
                      </span>
                    </p>
                    <p>
                      📅 Created:{" "}
                      {new Date(story.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openEditModal(story)}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openRegenerateModal(story)}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition"
                      title="Regenerate with new prompt"
                    >
                      🔄 Regenerate
                    </button>
                    {!story.isPublished ? (
                      <button
                        onClick={() => handlePublish(story.id)}
                        className="flex-1 min-w-[100px] px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(story.id)}
                        className="flex-1 min-w-[100px] px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(story.id)}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingStoryId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Edit Story</h2>

              {/* Title Input */}
              <div className="mb-6">
                <label
                  htmlFor="edit-story-title"
                  className="block text-white font-semibold mb-2"
                >
                  Title
                </label>
                <input
                  id="edit-story-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Story title..."
                />
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label
                  htmlFor="edit-story-description"
                  className="block text-white font-semibold mb-2"
                >
                  Description
                </label>
                <textarea
                  id="edit-story-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                  placeholder="Story description..."
                  rows="6"
                />
              </div>

              {/* Vocabulary Editor */}
              <div className="mb-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <h4 className="text-white font-semibold mb-3">
                  📖 Vocabulary
                </h4>

                {editVocabulary.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {editVocabulary.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={item.word}
                          onChange={(e) =>
                            handleVocabItemChange(index, "word", e.target.value)
                          }
                          placeholder="Word"
                          className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                        <input
                          type="text"
                          value={item.meaning}
                          onChange={(e) =>
                            handleVocabItemChange(
                              index,
                              "meaning",
                              e.target.value,
                            )
                          }
                          placeholder="Meaning"
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteVocabItem(index)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                          title="Delete this word"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new vocabulary item */}
                <div className="flex gap-2 items-start pt-2 border-t border-gray-600">
                  <input
                    type="text"
                    value={newVocabWord}
                    onChange={(e) => setNewVocabWord(e.target.value)}
                    placeholder="New word"
                    className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="text"
                    value={newVocabMeaning}
                    onChange={(e) => setNewVocabMeaning(e.target.value)}
                    placeholder="Meaning"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddVocabItem}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="mb-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <h4 className="text-white font-semibold mb-3">
                  📸 Story Image
                </h4>
                {editImagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageInputChange}
                        disabled={uploadingEditImage}
                        className="flex-1 text-sm text-gray-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditImagePreview(null);
                          setEditImage(null);
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageInputChange}
                    disabled={uploadingEditImage}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 disabled:opacity-50"
                  />
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || uploadingEditImage}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {editLoading
                    ? "Saving..."
                    : uploadingEditImage
                      ? "Uploading image..."
                      : "✅ Save Changes"}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={editLoading || uploadingEditImage}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regenerate Modal */}
        {regenerateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                🔄 Regenerate Story
              </h2>

              {/* Level Selection */}
              <div className="mb-6">
                <label
                  htmlFor="regenerate-story-level"
                  className="block text-white font-semibold mb-2"
                >
                  Language Level
                </label>
                <select
                  id="regenerate-story-level"
                  value={regenerateLevel}
                  onChange={(e) => setRegenerateLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                </select>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <label
                  htmlFor="regenerate-story-prompt"
                  className="block text-white font-semibold mb-2"
                >
                  New Prompt
                </label>
                <textarea
                  id="regenerate-story-prompt"
                  value={regeneratePrompt}
                  onChange={(e) => setRegeneratePrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  placeholder="Enter a new prompt or topic for story regeneration..."
                  rows="4"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerateLoading}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {regenerateLoading ? "Regenerating..." : "🔄 Regenerate"}
                </button>
                <button
                  onClick={closeRegenerateModal}
                  disabled={regenerateLoading}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesManagement;
