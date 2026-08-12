import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Image,
} from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { formatDateOnly } from "../../utils/formatDateTime";
import { useAuth } from "../../services/auth.services";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../Words/Modals/FavoriteButton";
import FavoritesBar from "../../components/Favorites/FavoritesBar";
import FavoritesDeleteAllModal from "../../components/Favorites/FavoritesDeleteAllModal";

// Color identity per CEFR level, consistent with the badge/chip style used
// elsewhere in the app (Leaderboard, ChallengeSession, ConversationTitleList).
const LEVEL_BADGES = {
  A1: "bg-black text-sky-400",
  A2: "bg-black text-teal-400",
  B1: "bg-black text-orange-400",
  B2: "bg-black text-pink-500",
  C1: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  C2: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STORIES_PER_PAGE = 9;

const formatPublishedDate = (dateValue) => {
  if (!dateValue) return null;
  return formatDateOnly(dateValue);
};

const StoryTitleList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, isAdmin } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  // In-page admin create/edit — same pattern as the conversations and
  // "How to Say It" pages, so an admin never has to leave this page to
  // manage stories. Manual create (no AI) is fully supported by the
  // backend: POST /stories/create only requires prompt+levelId+title+
  // description, the AI generation flow is just an optional convenience
  // layer that happens to funnel into this same endpoint.
  const [levels, setLevels] = useState([]);
  const [modalMode, setModalMode] = useState(null); // null | "create" | "edit"
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLevelId, setFormLevelId] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formVocabulary, setFormVocabulary] = useState([]);
  const [newVocabWord, setNewVocabWord] = useState("");
  const [newVocabMeaning, setNewVocabMeaning] = useState("");
  const [formImageFile, setFormImageFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    favoriteIds,
    loadingIds: loadingFavorites,
    toggleFavorite,
    deleteAllFavorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = useFavorites("stories", "storyId", "story");

  // Admins see drafts too (via the admin-only /stories/admin/all endpoint);
  // everyone else only ever sees published stories.
  const fetchStories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        isAdmin ? "/stories/admin/all" : "/stories/all",
      );
      setStories(response.data?.data || []);
    } catch (requestError) {
      console.error("Failed to load stories:", requestError);
      setError("Unable to load stories right now.");
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    api
      .get("/level/all")
      .then((response) => setLevels(response.data?.data || []))
      .catch((error) => console.error("Error fetching levels:", error));
  }, [isAdmin]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingStoryId(null);
    setFormTitle("");
    setFormDescription("");
    setFormLevelId("");
    setFormIsPublished(true);
    setFormVocabulary([]);
    setNewVocabWord("");
    setNewVocabMeaning("");
    setFormImageFile(null);
    setFormImagePreview(null);
  };

  const openEditModal = (story) => {
    setModalMode("edit");
    setEditingStoryId(story.id);
    setFormTitle(story.title);
    setFormDescription(story.description);
    setFormLevelId(story.levelId != null ? String(story.levelId) : "");
    setFormIsPublished(story.isPublished);
    setFormVocabulary(
      Array.isArray(story.vocabulary)
        ? story.vocabulary.map((item) => ({ ...item }))
        : [],
    );
    setNewVocabWord("");
    setNewVocabMeaning("");
    setFormImageFile(null);
    setFormImagePreview(story.image || null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingStoryId(null);
    setFormTitle("");
    setFormDescription("");
    setFormLevelId("");
    setFormVocabulary([]);
    setNewVocabWord("");
    setNewVocabMeaning("");
    setFormImageFile(null);
    setFormImagePreview(null);
  };

  const handleAddVocabItem = () => {
    if (!newVocabWord.trim() || !newVocabMeaning.trim()) return;
    setFormVocabulary((prev) => [
      ...prev,
      { word: newVocabWord.trim(), meaning: newVocabMeaning.trim() },
    ]);
    setNewVocabWord("");
    setNewVocabMeaning("");
  };

  const handleVocabItemChange = (index, field, value) => {
    setFormVocabulary((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteVocabItem = (index) => {
    setFormVocabulary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageInputChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setFormImagePreview(loadEvent.target.result);
      setFormImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStory = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Title and description are required",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }
    if (!formLevelId) {
      Swal.fire({ icon: "warning", title: "Please select a level", timer: 1800, showConfirmButton: false });
      return;
    }

    setSaving(true);
    try {
      let storyId = editingStoryId;

      if (modalMode === "create") {
        const response = await api.post("/stories/create", {
          prompt: formTitle.trim(),
          levelId: Number(formLevelId),
          title: formTitle.trim(),
          description: formDescription.trim(),
          vocabulary: formVocabulary,
          isPublished: formIsPublished,
          image: null,
        });
        storyId = response.data?.data?.id;
      } else {
        await api.put(`/stories/${editingStoryId}/update`, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          vocabulary: formVocabulary,
          levelId: Number(formLevelId),
        });
        if (formIsPublished !== undefined) {
          const existing = stories.find((s) => s.id === editingStoryId);
          if (existing && existing.isPublished !== formIsPublished) {
            await api.put(`/stories/${editingStoryId}/publish`, {
              isPublished: formIsPublished,
            });
          }
        }
      }

      if (formImageFile && storyId) {
        const formData = new FormData();
        formData.append("image", formImageFile);
        await api.post(`/stories/${storyId}/upload-image`, formData);
      }

      closeModal();
      await fetchStories();
      Swal.fire({
        icon: "success",
        title: modalMode === "create" ? "Story created!" : "Story updated!",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error saving story:", error);
      Swal.fire({
        icon: "error",
        title: "Could not save",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStory = async (story) => {
    const result = await Swal.fire({
      title: "Delete this story?",
      html: `Delete <strong>"${story.title}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingId(story.id);
    try {
      await api.delete(`/stories/${story.id}`);
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (error) {
      console.error("Error deleting story:", error);
      Swal.fire({
        icon: "error",
        title: "Could not delete",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Only the levels that actually have at least one story get a tab, in
  // standard CEFR order (any unexpected level string is appended, sorted).
  const availableLevels = useMemo(() => {
    const present = new Set(
      stories.map((story) => story.level?.level).filter(Boolean),
    );
    const known = CEFR_ORDER.filter((level) => present.has(level));
    const unknown = [...present]
      .filter((level) => !CEFR_ORDER.includes(level))
      .sort();
    return [...known, ...unknown];
  }, [stories]);

  const requestedLevel = searchParams.get("level") || "";
  const activeLevel = availableLevels.includes(requestedLevel)
    ? requestedLevel
    : "";

  const filteredStories = stories
    .filter((story) => !activeLevel || story.level?.level === activeLevel)
    .filter((story) => !showFavoritesOnly || favoriteIds.includes(story.id));

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStories.length / STORIES_PER_PAGE),
  );
  const requestedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Math.min(Math.max(requestedPage || 1, 1), totalPages);
  const paginatedStories = filteredStories.slice(
    (currentPage - 1) * STORIES_PER_PAGE,
    currentPage * STORIES_PER_PAGE,
  );

  const handleSelectLevel = (level) => {
    setSearchParams(level ? { level } : {});
  };

  const handleGoToPage = (page) => {
    const params = {};
    if (activeLevel) params.level = activeLevel;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
  };

  const tabClass = (isActive) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
        : isLight
          ? "border border-slate-200 bg-white text-slate-600 hover:border-orange-300"
          : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
    }`;

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-6xl p-4 pb-12">
        {/* Header */}
        <div className="mb-10 mt-8 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
            <BookOpen size={16} aria-hidden="true" />
            Read & Learn
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            German Stories
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Choose a level, then pick a story to read.
          </p>
          <div className="flex justify-center mt-3">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className={`mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isLight
                  ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                  : "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              <Plus size={16} /> Add New Story
            </button>
          )}
        </div>

        {/* Level tabs */}
        {!loading && stories.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectLevel("")}
              className={tabClass(!activeLevel)}
            >
              All ({stories.length})
            </button>
            {availableLevels.map((level) => {
              const count = stories.filter(
                (story) => story.level?.level === level,
              ).length;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleSelectLevel(level)}
                  className={tabClass(activeLevel === level)}
                >
                  {level} ({count})
                </button>
              );
            })}
          </div>
        )}

        {!loading && isLoggedIn && stories.length > 0 && (
          <div className="mb-8">
            <FavoritesBar
              isLight={isLight}
              active={showFavoritesOnly}
              onToggle={() => setShowFavoritesOnly((prev) => !prev)}
              count={favoriteIds.length}
              onRequestDeleteAll={() => setDeleteAllModalOpen(true)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : error ? (
          <div
            className={`text-center ${isLight ? "text-rose-600" : "text-rose-300"}`}
          >
            {error}
          </div>
        ) : stories.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No stories yet.
          </p>
        ) : filteredStories.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            {showFavoritesOnly
              ? "You haven't favorited any stories yet."
              : `No stories yet for ${activeLevel}.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedStories.map((story) => {
              const level = story.level?.level;
              const badgeClass = LEVEL_BADGES[level] || DEFAULT_BADGE;
              const isFavorite = favoriteIds.includes(story.id);

              return (
                <div
                  key={story.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/stories/${story.id}`);
                    }
                  }}
                  className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  <div
                    className={`relative h-48 w-full overflow-hidden ${
                      isLight ? "bg-slate-100" : "bg-slate-800"
                    }`}
                  >
                    {story.image ? (
                      <img
                        src={story.image}
                        alt={story.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`flex h-full items-center justify-center ${
                          isLight ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        <BookOpen size={36} />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide  ${badgeClass}`}
                      >
                        {level || "General"}
                      </span>
                      {isAdmin && !story.isPublished && (
                        <span className="inline-flex rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      <FavoriteButton
                        isFavorite={isFavorite}
                        loading={!!loadingFavorites[story.id]}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(story.id);
                        }}
                        className={`bg-white/90 shadow-sm dark:bg-slate-900/80 ${
                          isFavorite ? "" : "text-slate-400"
                        }`}
                      />
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(story);
                            }}
                            aria-label="Edit story"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:text-sky-600 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-sky-400"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteStory(story);
                            }}
                            disabled={deletingId === story.id}
                            aria-label="Delete story"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:text-rose-600 disabled:opacity-50 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-rose-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4 ">
                    <h3
                      className={`mb-1  text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {story.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between text-sm font-semibold text-orange-500 dark:text-orange-400">
                      <span className="flex items-center gap-1">
                        Read this story
                        <ChevronRight size={16} />
                      </span>

                      {story.publishedAt && (
                        <p
                          className={`text-xs font-normal ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {formatPublishedDate(story.publishedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleGoToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span
              className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handleGoToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit modal (admin only) */}
      {modalMode !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
              isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-900"
            }`}
          >
            <h3
              className={`mb-4 text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
            >
              {modalMode === "create" ? "Add New Story" : "Edit Story"}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="story-title"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Title
                </label>
                <input
                  id="story-title"
                  type="text"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  placeholder="Story title..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                      : "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="story-level"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Level
                </label>
                <select
                  id="story-level"
                  value={formLevelId}
                  onChange={(event) => setFormLevelId(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900"
                      : "border-slate-600 bg-slate-800 text-white"
                  }`}
                >
                  <option value="">Select a level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="story-description"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Description
                </label>
                <textarea
                  id="story-description"
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={6}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                      : "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                  }`}
                  placeholder="Story text..."
                />
              </div>

              {/* Vocabulary editor — same word/meaning add-edit-remove shape
                  as the dashboard's StoriesManagement.jsx */}
              <div
                className={`rounded-lg border p-3 ${
                  isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <p
                  className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  <BookOpen size={14} aria-hidden="true" />
                  Vocabulary
                </p>

                {formVocabulary.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formVocabulary.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <input
                          type="text"
                          value={item.word}
                          onChange={(event) =>
                            handleVocabItemChange(index, "word", event.target.value)
                          }
                          placeholder="Word"
                          className={`w-1/3 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                            isLight
                              ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                              : "border-slate-600 bg-slate-900 text-white placeholder-slate-500"
                          }`}
                        />
                        <input
                          type="text"
                          value={item.meaning}
                          onChange={(event) =>
                            handleVocabItemChange(index, "meaning", event.target.value)
                          }
                          placeholder="Meaning"
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                            isLight
                              ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                              : "border-slate-600 bg-slate-900 text-white placeholder-slate-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteVocabItem(index)}
                          className="flex-shrink-0 rounded-lg bg-rose-600 px-2 py-1.5 text-xs text-white transition hover:bg-rose-700"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-2 border-t border-slate-300/50 pt-2 dark:border-slate-600/50">
                  <input
                    type="text"
                    value={newVocabWord}
                    onChange={(event) => setNewVocabWord(event.target.value)}
                    placeholder="New word"
                    className={`w-1/3 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      isLight
                        ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                        : "border-slate-600 bg-slate-900 text-white placeholder-slate-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={newVocabMeaning}
                    onChange={(event) => setNewVocabMeaning(event.target.value)}
                    placeholder="Meaning"
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      isLight
                        ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                        : "border-slate-600 bg-slate-900 text-white placeholder-slate-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddVocabItem}
                    className="flex-shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Image upload */}
              <div
                className={`rounded-lg border p-3 ${
                  isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <p
                  className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  <Image size={14} aria-hidden="true" />
                  Story Image
                </p>
                {formImagePreview && (
                  <img
                    src={formImagePreview}
                    alt="Preview"
                    className="mb-2 max-h-40 w-full rounded-lg object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageInputChange}
                  className={`w-full text-xs ${isLight ? "text-slate-600" : "text-slate-300"} file:mr-2 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-orange-600`}
                />
              </div>

              <label
                className={`flex items-center gap-2 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}
              >
                <input
                  type="checkbox"
                  checked={formIsPublished}
                  onChange={(event) => setFormIsPublished(event.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                Published (visible to everyone)
              </label>
            </div>

            <div
              className={`mt-6 flex justify-between gap-3 border-t pt-4 ${
                isLight ? "border-slate-100" : "border-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={handleSaveStory}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : modalMode === "create" ? "Create" : "Save"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={`rounded-lg border px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-600 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <FavoritesDeleteAllModal
        isOpen={deleteAllModalOpen}
        isLight={isLight}
        itemLabel="stories"
        onCancel={() => setDeleteAllModalOpen(false)}
        onConfirm={async () => {
          const success = await deleteAllFavorites();
          if (success) setDeleteAllModalOpen(false);
        }}
      />
    </Container>
  );
};

export default StoryTitleList;
