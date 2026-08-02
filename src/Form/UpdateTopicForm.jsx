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
  // The selected topic's level as of selection/last successful save — kept
  // separate from topicData.levelId (which tracks the live edit) so submit
  // can tell "the level is actually being changed" apart from "resubmitted
  // unchanged" without re-deriving it from `topics` at submit time.
  const [originalLevelId, setOriginalLevelId] = useState("");
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
      setOriginalLevelId("");
      return;
    }

    const selectedTopic = topics.find(
      (topic) => String(topic.id) === String(nextTopicId),
    );

    if (!selectedTopic) {
      setTopicData(EMPTY_TOPIC_FORM);
      setOriginalLevelId("");
      return;
    }

    const levelIdStr = selectedTopic.levelId
      ? String(selectedTopic.levelId)
      : "";

    setTopicData({ name: selectedTopic.name || "", levelId: levelIdStr });
    setOriginalLevelId(levelIdStr);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTopicData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const levelLabel = (levelIdStr) => {
    if (!levelIdStr) {
      return "Any Level";
    }
    const found = levels.find(
      (level) => String(level.id) === String(levelIdStr),
    );
    return found ? found.level : `Level #${levelIdStr}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedTopicId) {
      alert("Please select a topic to update");
      return;
    }

    const isLevelChanging = topicData.levelId !== originalLevelId;
    let password;

    if (isLevelChanging) {
      // Changing a topic's level is significant enough to re-verify the
      // caller's own password — same rationale as force-deleting a topic:
      // proves it's really them, independent of the session cookie. A
      // rename with no level change stays on the lighter "type ok" prompt.
      const passwordConfirmation = await Swal.fire({
        title: "Confirm level change?",
        html: `Changing <strong>${topicData.name || "this topic"}</strong>'s level from <strong>${levelLabel(originalLevelId)}</strong> to <strong>${levelLabel(topicData.levelId)}</strong>. Enter your password to confirm.`,
        icon: "warning",
        input: "password",
        inputPlaceholder: "Your password",
        inputAttributes: { autocomplete: "current-password" },
        inputValidator: (value) => (value ? null : "Password is required"),
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0284c7",
        cancelButtonColor: "#475569",
        background: "#1c1917",
        color: "#f5f5f4",
      });

      if (!passwordConfirmation.isConfirmed) {
        return;
      }

      password = passwordConfirmation.value;
    } else {
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
    }

    setLoading(true);

    try {
      await axios.put(`/topic/update/${selectedTopicId}`, {
        ...topicData,
        // Empty selection means "Any Level" — words from every level can be
        // filed under this topic, not just one. Always sending the key
        // (even as null) so the backend can tell "clear the level" apart
        // from "the field wasn't sent at all".
        levelId: topicData.levelId ? parseInt(topicData.levelId, 10) : null,
        ...(password ? { password } : {}),
      });

      await invalidateWordsCache();

      const refreshedTopics = await fetchOptions();

      const updatedTopic = refreshedTopics.find(
        (topic) => String(topic.id) === String(selectedTopicId),
      );

      if (updatedTopic) {
        const levelIdStr = updatedTopic.levelId
          ? String(updatedTopic.levelId)
          : "";
        setTopicData({ name: updatedTopic.name || "", levelId: levelIdStr });
        setOriginalLevelId(levelIdStr);
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

  const clearSelectionAndRefresh = async () => {
    await invalidateWordsCache();
    setSelectedTopicId("");
    setTopicData(EMPTY_TOPIC_FORM);
    await fetchOptions();
  };

  // SUPER_ADMIN escape hatch for the "still has words" block below: asks for
  // the caller's own password (re-verified server-side, independent of the
  // session cookie) and, if confirmed, force-deletes the topic — every word
  // on it gets reassigned to "Miscellaneous" first, never silently dropped.
  // Returns { attempted: false } if the admin backs out of the password
  // prompt, so the caller can tell "cancelled" apart from "failed".
  const promptForceDelete = async (topicId, topicLabel, wordCount) => {
    const passwordConfirmation = await Swal.fire({
      title: "Force delete topic?",
      html: `<strong>${topicLabel}</strong> still has ${wordCount} word${
        wordCount === 1 ? "" : "s"
      }. As SUPER_ADMIN you can delete it anyway — every word on it will be moved to <strong>&quot;Miscellaneous&quot;</strong>, not deleted. Enter your password to confirm.`,
      icon: "warning",
      input: "password",
      inputPlaceholder: "Your password",
      inputAttributes: { autocomplete: "current-password" },
      inputValidator: (value) => (value ? null : "Password is required"),
      showCancelButton: true,
      confirmButtonText: "Force Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!passwordConfirmation.isConfirmed) {
      return { attempted: false };
    }

    const response = await axios.post(`/topic/force-delete/${topicId}`, {
      password: passwordConfirmation.value,
    });

    return { attempted: true, message: response.data?.message };
  };

  const handleDelete = async () => {
    if (!selectedTopicId) {
      alert("Please select a topic to delete");
      return;
    }

    const topicLabel = topicData.name || "this topic";

    const confirmation = await Swal.fire({
      title: "Delete topic?",
      html: `Type <strong>ok</strong> to permanently delete <strong>${topicLabel}</strong>. This can't be undone.`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Type ok",
      inputAutoTrim: true,
      inputValidator: (value) =>
        value?.trim().toLowerCase() === "ok"
          ? null
          : 'Please type "ok" to continue.',
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setDeleting(true);

    try {
      await axios.delete(`/topic/delete/${selectedTopicId}`);

      await clearSelectionAndRefresh();

      await Swal.fire({
        icon: "success",
        title: "Topic deleted successfully",
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      const wordCount = error.response?.data?.data?.wordCount;

      // Blocked specifically because the topic still has words — offer the
      // SUPER_ADMIN the password-confirmed force-delete-and-reassign path
      // instead of just reporting failure.
      if (typeof wordCount === "number" && wordCount > 0) {
        try {
          const result = await promptForceDelete(
            selectedTopicId,
            topicLabel,
            wordCount,
          );

          if (!result.attempted) {
            return;
          }

          await clearSelectionAndRefresh();

          await Swal.fire({
            icon: "success",
            title: result.message || "Topic deleted successfully",
            timer: 2200,
            showConfirmButton: false,
            background: "#1c1917",
            color: "#f5f5f4",
          });
        } catch (forceDeleteError) {
          console.error("Error force-deleting topic:", forceDeleteError);
          await Swal.fire({
            icon: "error",
            title: "Delete failed",
            text:
              forceDeleteError.response?.data?.message ||
              "Error deleting topic",
            background: "#1c1917",
            color: "#f5f5f4",
          });
        }
        return;
      }

      console.error("Error deleting topic:", error);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.response?.data?.message || "Error deleting topic",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setDeleting(false);
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
        <p className="text-center text-sm text-slate-500 dark:text-gray-400 -mt-4 mb-6">
          {loadingOptions
            ? "Loading topics..."
            : `${topics.length} topic${topics.length === 1 ? "" : "s"} available`}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-md border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-transparent dark:bg-stone-800 dark:text-white dark:shadow-none"
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
              disabled={loadingOptions || loading || deleting}
              required
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
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
              disabled={!selectedTopicId || loading || deleting}
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="levelId" className="block font-medium">
              Select Level (optional)
            </label>
            <select
              id="levelId"
              name="levelId"
              value={topicData.levelId}
              onChange={handleChange}
              disabled={!selectedTopicId || loadingOptions || loading || deleting}
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            >
              <option value="">Any Level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.level}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Leave as "Any Level" to let words from any level be filed under
              this topic.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || deleting || !selectedTopicId}
            fullWidth
            className="mt-24"
          >
            {loading ? "Updating..." : "Update Topic"}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading || deleting || !selectedTopicId}
            fullWidth
            className="mt-4"
          >
            {deleting ? "Deleting..." : "Delete Topic"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default UpdateTopicForm;
