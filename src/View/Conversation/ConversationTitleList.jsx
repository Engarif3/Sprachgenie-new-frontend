import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, ChevronDown, Pencil, Plus, Trash2, MessageCircle } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../Words/Modals/FavoriteButton";
import FavoritesBar from "../../components/Favorites/FavoritesBar";
import FavoritesDeleteAllModal from "../../components/Favorites/FavoritesDeleteAllModal";
import CategoryMultiSelect from "../../components/UI/CategoryMultiSelect";
import { splitConversationTopic } from "../../utils/splitConversationTopic";

// Color identity per CEFR level, consistent with the badge/chip style used
// elsewhere in the app (Leaderboard, ChallengeSession) — anything outside
// this known set (shouldn't normally happen) falls back to a neutral chip.
const LEVEL_BADGES = {
  A1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  B1: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  B2: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  C1: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  C2: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CONVERSATIONS_PER_PAGE = 9;

// A custom dropdown instead of a native <select> — the closed pill button
// keeps the rounded, centered-text look, but a native select can't give
// the OPEN option list its own modern (rounded, shadowed) panel or
// left-aligned option rows; the browser controls that part entirely.
const CategoryFilterDropdown = ({
  categories,
  allLabel,
  activeCategory,
  onSelect,
  isLight,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selected = categories.find(
    (category) => String(category.id) === activeCategory,
  );
  const summaryLabel = selected
    ? `${selected.name} (${selected.count})`
    : allLabel;

  const optionClass = (isActive) =>
    `block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
      isActive
        ? isLight
          ? "bg-teal-50 text-teal-700"
          : "bg-teal-500/15 text-teal-300"
        : isLight
          ? "text-slate-700 hover:bg-slate-50"
          : "text-slate-200 hover:bg-slate-800"
    }`;

  const select = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Filter by category"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
          isLight
            ? "border-teal-200 bg-white text-slate-700 hover:border-teal-300"
            : "border-teal-700/60 bg-slate-900 text-slate-200 hover:border-teal-500/60"
        }`}
      >
        <span className="truncate">{summaryLabel}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""} ${
            isLight ? "text-teal-500" : "text-teal-400"
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border shadow-lg ${
            isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-900"
          }`}
        >
          <div className="max-h-72 overflow-y-auto py-1.5">
            <button
              type="button"
              onClick={() => select("")}
              className={optionClass(!activeCategory)}
            >
              {allLabel}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => select(String(category.id))}
                className={optionClass(activeCategory === String(category.id))}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ConversationTitleList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, isAdmin } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  // In-page admin create/edit — same idea as the "How to Say It" modal, so
  // an admin never has to leave this page to manage conversations.
  const [allCategories, setAllCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [modalMode, setModalMode] = useState(null); // null | "create" | "edit"
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [formTopic, setFormTopic] = useState("");
  const [formLevelId, setFormLevelId] = useState("");
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [formText, setFormText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    favoriteIds,
    loadingIds: loadingFavorites,
    toggleFavorite,
    deleteAllFavorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = useFavorites("conversations", "conversationId", "conversation");

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conversation/all");
      setConversations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Categories/levels for the create/edit form's pickers — only needed by
  // admins, and levels here are fetched from the real API (unlike the
  // existing create/edit dashboard forms, which hardcode a 5-level list).
  useEffect(() => {
    if (!isAdmin) return;

    api
      .get("/conversation-category/all")
      .then((response) => setAllCategories(response.data?.data || []))
      .catch((error) =>
        console.error("Error fetching conversation categories:", error),
      );

    api
      .get("/level/all")
      .then((response) => setLevels(response.data?.data || []))
      .catch((error) => console.error("Error fetching levels:", error));
  }, [isAdmin]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingConversationId(null);
    setFormTopic("");
    setFormLevelId("");
    setFormCategoryIds([]);
    setFormText('[\n  { "speaker": "Lena", "message": "Hallo! Wie geht es dir?" }\n]');
  };

  const openEditModal = (conversation) => {
    setModalMode("edit");
    setEditingConversationId(conversation.id);
    setFormTopic(conversation.topic);
    setFormLevelId(String(conversation.levelId));
    setFormCategoryIds((conversation.categories || []).map((c) => c.id));
    setFormText(JSON.stringify(conversation.text, null, 2));
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingConversationId(null);
    setFormTopic("");
    setFormLevelId("");
    setFormCategoryIds([]);
    setFormText("");
  };

  const handleSaveConversation = async () => {
    if (!formTopic.trim()) {
      Swal.fire({ icon: "warning", title: "Topic is required", timer: 1800, showConfirmButton: false });
      return;
    }
    if (!formLevelId) {
      Swal.fire({ icon: "warning", title: "Please select a level", timer: 1800, showConfirmButton: false });
      return;
    }

    let parsedText;
    try {
      parsedText = JSON.parse(formText);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Invalid dialogue JSON",
        text: 'Dialogue must be valid JSON, e.g. [{ "speaker": "Lena", "message": "..." }]',
      });
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        await api.post("/conversation/create", {
          topic: formTopic.trim(),
          levelId: Number(formLevelId),
          categoryIds: formCategoryIds,
          text: parsedText,
        });
      } else {
        await api.put(`/conversation/update/${editingConversationId}`, {
          topic: formTopic.trim(),
          levelId: Number(formLevelId),
          categoryIds: formCategoryIds,
          text: parsedText,
        });
      }
      closeModal();
      await fetchConversations();
      Swal.fire({
        icon: "success",
        title: modalMode === "create" ? "Conversation created!" : "Conversation updated!",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error saving conversation:", error);
      Swal.fire({
        icon: "error",
        title: "Could not save",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConversation = async (conversation) => {
    const { english } = splitConversationTopic(conversation.topic);
    const result = await Swal.fire({
      title: "Delete this conversation?",
      html: `Delete <strong>"${english}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingId(conversation.id);
    try {
      await api.delete(`/conversation/delete/${conversation.id}`);
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
    } catch (error) {
      console.error("Error deleting conversation:", error);
      Swal.fire({
        icon: "error",
        title: "Could not delete",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Only the levels that actually have at least one topic get a tab, in
  // standard CEFR order (any unexpected level string is appended, sorted).
  const availableLevels = useMemo(() => {
    const present = new Set(
      conversations.map((c) => c.levels?.level).filter(Boolean),
    );
    const known = CEFR_ORDER.filter((level) => present.has(level));
    const unknown = [...present]
      .filter((level) => !CEFR_ORDER.includes(level))
      .sort();
    return [...known, ...unknown];
  }, [conversations]);

  // Same idea for categories — only ones actually in use get a tab,
  // alphabetical. A conversation can carry more than one category, so this
  // collects every category across every conversation, not just the first.
  const availableCategories = useMemo(() => {
    const byId = new Map();
    conversations.forEach((c) => {
      (c.categories || []).forEach((category) => {
        byId.set(category.id, category.name);
      });
    });
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [conversations]);

  const requestedLevel = searchParams.get("level") || "";
  const activeLevel = availableLevels.includes(requestedLevel)
    ? requestedLevel
    : "";

  const requestedCategory = searchParams.get("category") || "";
  const activeCategory = availableCategories.some(
    (category) => String(category.id) === requestedCategory,
  )
    ? requestedCategory
    : "";

  const filteredConversations = conversations
    .filter((c) => !activeLevel || c.levels?.level === activeLevel)
    .filter(
      (c) =>
        !activeCategory ||
        (c.categories || []).some(
          (category) => String(category.id) === activeCategory,
        ),
    )
    .filter((c) => !showFavoritesOnly || favoriteIds.includes(c.id));

  const totalPages = Math.max(
    1,
    Math.ceil(filteredConversations.length / CONVERSATIONS_PER_PAGE),
  );
  const requestedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Math.min(Math.max(requestedPage || 1, 1), totalPages);
  const paginatedConversations = filteredConversations.slice(
    (currentPage - 1) * CONVERSATIONS_PER_PAGE,
    currentPage * CONVERSATIONS_PER_PAGE,
  );

  const handleSelectLevel = (level) => {
    const params = {};
    if (level) params.level = level;
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params);
  };

  const handleSelectCategory = (categoryId) => {
    const params = {};
    if (activeLevel) params.level = activeLevel;
    if (categoryId) params.category = categoryId;
    setSearchParams(params);
  };

  const handleGoToPage = (page) => {
    const params = {};
    if (activeLevel) params.level = activeLevel;
    if (activeCategory) params.category = activeCategory;
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
      <div className="mx-auto min-h-screen max-w-6xl px-4 pt-1 pb-12">
        {/* Header */}
        <div className="mb-3 mt-4 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-1.5 text-sm font-semibold text-orange-500 dark:text-orange-400">
            <MessageCircle size={16} aria-hidden="true" />
            Practice German
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Conversation Topics
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Choose a level, then pick a topic to practice a real-world German
            dialogue.
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
              <Plus size={16} /> Add New Conversation
            </button>
          )}
        </div>

        {/* Level tabs */}
        {!loading && conversations.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectLevel("")}
              className={tabClass(!activeLevel)}
            >
              All ({conversations.length})
            </button>
            {availableLevels.map((level) => {
              const count = conversations.filter(
                (c) => c.levels?.level === level,
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

        {/* Category filter — a single dropdown instead of one button per
            category, since the list can grow arbitrarily long (unlike the
            fixed, small set of CEFR levels above). */}
        {!loading && availableCategories.length > 0 && (
          <div className="mb-8 mt-4 flex justify-center">
            <CategoryFilterDropdown
              categories={availableCategories.map((category) => ({
                ...category,
                count: conversations.filter((c) =>
                  (c.categories || []).some((cat) => cat.id === category.id),
                ).length,
              }))}
              allLabel={`All Categories (${conversations.length})`}
              activeCategory={activeCategory}
              onSelect={handleSelectCategory}
              isLight={isLight}
            />
          </div>
        )}

        {!loading && isLoggedIn && conversations.length > 0 && (
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
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : conversations.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No conversation topics yet.
          </p>
        ) : filteredConversations.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            {showFavoritesOnly
              ? "You haven't favorited any conversations yet."
              : "No topics yet for this filter."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {paginatedConversations.map((conversation) => {
              const level = conversation.levels?.level;
              const badgeClass = LEVEL_BADGES[level] || DEFAULT_BADGE;
              const { english, german } = splitConversationTopic(
                conversation.topic,
              );

              const categories = conversation.categories || [];

              const isFavorite = favoriteIds.includes(conversation.id);

              return (
                <div
                  key={conversation.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/conversation/${conversation.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/conversation/${conversation.id}`);
                    }
                  }}
                  // `h-full` + the grid's default row stretch is what makes
                  // every card in a row match height regardless of how much
                  // text/badges any one of them has — `flex-1` further down
                  // then absorbs the leftover space so the CTA always lands
                  // on the same bottom line across the whole row.
                  className={`group flex h-full cursor-pointer flex-col rounded-3xl border p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-7 ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  {/* Level badge + icon: always their own line, so a long
                      list of category tags below can never push them out
                      of place or squeeze the icon smaller. */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badgeClass}`}
                    >
                      {level || "General"}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <FavoriteButton
                        isFavorite={isFavorite}
                        loading={!!loadingFavorites[conversation.id]}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(conversation.id);
                        }}
                        className={isFavorite ? "" : "text-slate-300 dark:text-slate-600"}
                      />
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(conversation);
                            }}
                            aria-label="Edit conversation"
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                              isLight
                                ? "border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600"
                                : "border-slate-700 text-slate-400 hover:border-sky-500/50 hover:text-sky-400"
                            }`}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteConversation(conversation);
                            }}
                            disabled={deletingId === conversation.id}
                            aria-label="Delete conversation"
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                              isLight
                                ? "border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600"
                                : "border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                            }`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Category tags: their own line below the level badge,
                      never sharing a row with it. */}
                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <span
                          key={category.id}
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isLight
                              ? "bg-blue-100 text-blue-700"
                              : "bg-blue-500/15 text-blue-300"
                          }`}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="my-6 flex-1">
                    <p
                      className={`text-xl font-bold leading-snug ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {english}
                    </p>
                    {german && (
                      <p
                        className={`mt-2 text-base font-medium italic leading-relaxed ${isLight ? "text-teal-600" : "text-teal-400"}`}
                      >
                        {german}
                      </p>
                    )}
                  </div>

                  <div
                    className={`flex w-full items-center justify-end gap-1 border-t pt-4 text-sm font-semibold text-orange-500 transition-transform group-hover:gap-2 dark:text-orange-400 ${
                      isLight ? "border-slate-100" : "border-slate-800"
                    }`}
                  >
                    <span>Practice this dialogue</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
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
              {modalMode === "create" ? "Add New Conversation" : "Edit Conversation"}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="conversation-topic"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Topic
                </label>
                <input
                  id="conversation-topic"
                  type="text"
                  value={formTopic}
                  onChange={(event) => setFormTopic(event.target.value)}
                  placeholder='e.g. "At the Doctor / Beim Arzt"'
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
                  htmlFor="conversation-level"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Level
                </label>
                <select
                  id="conversation-level"
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
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Categories
                </label>
                <CategoryMultiSelect
                  categories={allCategories}
                  selectedIds={formCategoryIds}
                  onChange={setFormCategoryIds}
                  placeholder="Select categories (optional)"
                />
              </div>

              <div>
                <label
                  htmlFor="conversation-text"
                  className={`mb-1 block text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  Dialogue (JSON)
                </label>
                <textarea
                  id="conversation-text"
                  value={formText}
                  onChange={(event) => setFormText(event.target.value)}
                  rows={8}
                  className={`w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                      : "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                  }`}
                  placeholder='[{ "speaker": "Lena", "message": "Hallo!" }]'
                />
              </div>
            </div>

            <div
              className={`mt-6 flex justify-between gap-3 border-t pt-4 ${
                isLight ? "border-slate-100" : "border-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={handleSaveConversation}
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
        itemLabel="conversations"
        onCancel={() => setDeleteAllModalOpen(false)}
        onConfirm={async () => {
          const success = await deleteAllFavorites();
          if (success) setDeleteAllModalOpen(false);
        }}
      />
    </Container>
  );
};

export default ConversationTitleList;
