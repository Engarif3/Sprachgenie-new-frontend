import React, { useState } from "react";
import axios from "axios"; // For AI service
import api from "../../axios"; // For backend (with cookies)

const GenerateStory = () => {
  const [formData, setFormData] = useState({
    prompt: "",
    levelId: "",
    title: "",
  });
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storyId, setStoryId] = useState(null);

  // Fetch levels on component mount
  React.useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await api.get(`/level/all`);
      if (response.data && response.data.data) {
        setLevels(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching levels:", err);
      setError("Failed to load language levels");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For now, just store the file locally in the state
    // In production, you would upload to Cloudinary or another service
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage({
          file,
          preview: event.target.result,
        });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to process image");
      setUploadingImage(false);
    }
  };

  const handleGenerateStory = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPreview(null);
    setUploadedImage(null);
    setStoryId(null);

    if (!formData.prompt || !formData.levelId) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // First, generate the story using the AI service
      const aiServiceUrl =
        import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:5000";

      // Get the level name
      const selectedLevel = levels.find(
        (l) => l.id === parseInt(formData.levelId),
      );
      const levelName = selectedLevel?.level || "A2";

      console.log("Sending to AI service:", {
        prompt: formData.prompt,
        level: levelName,
        aiServiceUrl,
      });

      const aiResponse = await axios.post(
        `${aiServiceUrl}/api/stories/generate`,
        {
          prompt: formData.prompt,
          level: levelName,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("AI service response:", aiResponse.data);

      if (!aiResponse.data || !aiResponse.data.data) {
        throw new Error("Failed to generate story content");
      }

      // Show preview - DON'T SAVE YET
      setPreview(aiResponse.data.data);
    } catch (err) {
      console.error("Full error details:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to generate story";

      console.error("Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      // Save as DRAFT (isPublished: false) - WITHOUT the image
      // We'll upload the image separately if provided
      const payloadToSend = {
        title: preview.title,
        description: preview.description,
        passageVocabulary: preview.passageVocabulary,
        vocabulary: preview.vocabulary,
        prompt: formData.prompt,
        levelId: parseInt(formData.levelId),
        image: null, // Don't send image data here
        isPublished: false, // DRAFT - not published yet
      };

      console.log("Saving draft story...", payloadToSend);

      const backendResponse = await api.post(`/stories/create`, payloadToSend);

      setStoryId(backendResponse.data.data.id);

      // If there's an image, upload it now
      if (uploadedImage?.file) {
        await handleUploadImage(backendResponse.data.data.id);
      } else {
        setSuccess(
          "Story saved as draft! You can publish it now or upload a photo first.",
        );
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to save story",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (id) => {
    if (!uploadedImage?.file) return;

    setUploadingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", uploadedImage.file);

      console.log("Uploading image for story:", id);

      const response = await api.post(
        `/stories/${id}/upload-image`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Image uploaded successfully:", response.data);
      setSuccess("Photo uploaded successfully! Now you can publish the story.");
      setUploadingImage(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to upload image",
      );
      setUploadingImage(false);
    }
  };

  const handlePublish = async () => {
    if (!storyId) return;

    setLoading(true);
    try {
      // Update publish status to true
      const response = await api.put(`/stories/${storyId}/publish`, {
        isPublished: true,
      });

      setSuccess("Story published successfully! ✅");
      setTimeout(() => {
        // Reset form
        setFormData({
          prompt: "",
          levelId: "",
          title: "",
        });
        setPreview(null);
        setUploadedImage(null);
        setStoryId(null);
        setSuccess("");
        // Optionally navigate away or stay here
      }, 2000);
    } catch (err) {
      console.error("Error publishing story:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to publish story",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPreview(null);
    setUploadedImage(null);
    setStoryId(null);
    setSuccess("");
    setError("");
    setFormData({
      ...formData,
      prompt: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-2">
            Generate German Story
          </h1>
          <p className="text-gray-400">
            Create AI-powered German language stories for different proficiency
            levels
          </p>
        </div>

        {/* Form */}
        {!preview && (
          <form
            onSubmit={handleGenerateStory}
            className="bg-gray-800/50 rounded-lg p-8 mb-8 border border-gray-700"
          >
            {/* Prompt Input */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Story Prompt *
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="Describe the story you want to generate (e.g., 'A day in the life of a German student' or 'A family day at the beach')"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                rows="4"
                required
              />
              <p className="text-gray-400 text-sm mt-1">
                Be specific and descriptive for better results
              </p>
            </div>

            {/* Level Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Language Level *
              </label>
              <select
                name="levelId"
                value={formData.levelId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                required
              >
                <option value="">Select a level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Generating Story...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate Story
                </>
              )}
            </button>
          </form>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="bg-gray-800/50 rounded-lg p-8 border border-green-700/50 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">
              Preview - Story Generated! 🎉
            </h2>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {preview.title}
              </h3>
              <p className="text-gray-400 text-sm">
                Level:{" "}
                {levels.find((l) => l.id === parseInt(formData.levelId))
                  ?.level || "A2"}
              </p>
            </div>

            {/* Story Description */}
            <div className="mb-6 bg-gray-700/50 p-6 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-3">Story</h4>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                {preview.description}
              </p>
            </div>

            {/* Passage Vocabulary */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">
                Vocabulary from Story
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {preview.passageVocabulary?.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-700/50 border border-gray-600 rounded"
                  >
                    <p className="text-orange-400 font-semibold">{item.word}</p>
                    <p className="text-gray-300 text-sm">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* General Vocabulary */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">
                Additional Vocabulary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {preview.vocabulary?.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-700/50 border border-gray-600 rounded"
                  >
                    <p className="text-blue-400 font-semibold">{item.word}</p>
                    <p className="text-gray-300 text-sm">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-6 bg-gray-700/50 p-6 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-4">
                📸 Upload Photo (Optional)
              </h4>
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage.preview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 disabled:opacity-50"
                  />
                  <p className="text-gray-400 text-sm">
                    Max 5MB. Formats: JPG, PNG, WebP
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
                {success}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {!storyId ? (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-300"
                  >
                    {loading ? "Saving..." : "💾 Save as Draft"}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-300"
                  >
                    ♻️ Regenerate
                  </button>
                </>
              ) : (
                <>
                  {uploadedImage?.preview && (
                    <button
                      onClick={() => handleUploadImage(storyId)}
                      disabled={loading || uploadingImage}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-300"
                    >
                      {uploadingImage
                        ? "Uploading..."
                        : "📤 Upload Photo to Cloud"}
                    </button>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-300"
                  >
                    {loading ? "Publishing..." : "✅ Publish Story"}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-300"
                  >
                    ↩️ Start Over
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateStory;
