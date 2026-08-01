import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axios";
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import { invalidateWordsCache } from "../utils/storage";
import Button from "../components/UI/Button";
import PageHeader from "../components/UI/PageHeader";

const EMPTY_TOPIC_FORM = {
  name: "",
  levelId: "",
};

const buildNoCacheRequestConfig = () => ({
  params: { _ts: Date.now() },
});

const UpdateTopicForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [topicData, setTopicData] = useState(EMPTY_TOPIC_FORM);
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const fetchOptions = async () => {
    setLoadingOptions(true);

    try {
      const [levelResponse, topicResponse] = await Promise.all([
        axios.get("/level/all", buildNoCacheRequestConfig()),
        axios.get("/topic/all", buildNoCacheRequestConfig()),
      ]);

      const nextLevels = levelResponse.data.data || [];
      const nextTopics = topicResponse.data.data || [];

      setLevels(nextLevels);
      setTopics(nextTopics);

      return nextTopics;
    } catch (error) {
      console.error("Failed to fetch topic options:", error);
      await Swal.fire({
        icon: "error",
        title: "Unable to load topics",
        text: "Please refresh and try again.",
        background: "#1c1917",
        color: "#f5f5f4",
      });
      return [];
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    void fetchOptions();
  }, []);

  const handleTopicSelection = (event) => {
    const nextTopicId = event.target.value;
    setSelectedTopicId(nextTopicId);

    if (!nextTopicId) {
      setTopicData(EMPTY_TOPIC_FORM);
      return;
    }

    const selectedTopic = topics.find(
      (topic) => String(topic.id) === String(nextTopicId),
    );

    if (!selectedTopic) {
      setTopicData(EMPTY_TOPIC_FORM);
      return;
    }

    setTopicData({
      name: selectedTopic.name || "",
      levelId: selectedTopic.levelId ? String(selectedTopic.levelId) : "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTopicData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedTopicId) {
      alert("Please select a topic to update");
      return;
    }

    const confirmation = await Swal.fire({
      title: "Update topic?",
      text: "Type ok to confirm this topic update.",
      input: "text",
      inputPlaceholder: "Type ok",
      inputAutoTrim: true,
      inputValidator: (value) =>
        value?.trim().toLowerCase() === "ok"
          ? null
          : 'Please type "ok" to continue.',
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      await axios.put(`/topic/update/${selectedTopicId}`, {
        ...topicData,
        levelId: parseInt(topicData.levelId, 10),
      });

      await invalidateWordsCache();

      const refreshedTopics = await fetchOptions();

      const updatedTopic = refreshedTopics.find(
        (topic) => String(topic.id) === String(selectedTopicId),
      );

      if (updatedTopic) {
        setTopicData({
          name: updatedTopic.name || "",
          levelId: updatedTopic.levelId ? String(updatedTopic.levelId) : "",
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Topic updated successfully",
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      console.error("Error updating topic:", error);
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.response?.data?.message || "Error updating topic",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <div className="min-h-screen ">
        <PageHeader
          title="Update Topic"
          align="center"
          className="mt-8 mb-6"
        />
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-stone-800 rounded-md text-white"
        >
          <div>
            <label htmlFor="selectedTopicId" className="block font-medium">
              Select Topic
            </label>
            <select
              id="selectedTopicId"
              name="selectedTopicId"
              value={selectedTopicId}
              onChange={handleTopicSelection}
              disabled={loadingOptions || loading}
              required
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
            >
              <option value="">
                {loadingOptions ? "Loading topics..." : "Select Topic"}
              </option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.level?.level ? `${topic.level.level} - ` : ""}
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block font-medium ">
              Topic Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={topicData.name}
              onChange={handleChange}
              required
              disabled={!selectedTopicId}
              className="mt-1 block w-full input-md rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 text-black"
            />
          </div>

          <div>
            <label htmlFor="levelId" className="block font-medium">
              Select Level
            </label>
            <select
              id="levelId"
              name="levelId"
              value={topicData.levelId}
              onChange={handleChange}
              required
              disabled={!selectedTopicId || loadingOptions}
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
            >
              <option value="">Select Level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.level}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading || !selectedTopicId}
            fullWidth
            className="mt-24"
          >
            {loading ? "Updating..." : "Update Topic"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default UpdateTopicForm;
