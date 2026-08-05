import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../Words/Modals/FavoriteButton";
import FavoritesBar from "../../components/Favorites/FavoritesBar";
import FavoritesDeleteAllModal from "../../components/Favorites/FavoritesDeleteAllModal";

// Smaller than the admin page's 40/page — this is a browsing grid for
// learners, not a management table, so a denser page would just mean more
// scrolling before reaching the pager.
const PAGE_SIZE = 12;

const HowToSayList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { isSuperAdmin, isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    favoriteIds,
    loadingIds: loadingFavorites,
    toggleFavorite,
    deleteAllFavorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = useFavorites("how-to-say", "titleId", "phrase");

  const [titles, setTitles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  // Collapsed by default — only the English title shows until a learner
  // opens it, so a page of 12 titles doesn't dump every sentence at once.
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Favorites are scattered across whatever server page they happen to
  // land on, so "favorites only" can't just filter the current page — it
  // pulls every title (looping the same paginated endpoint at its max
  // limit) once, then filters that full set client-side by favoriteIds.
  const [allTitles, setAllTitles] = useState([]);
  const [loadingAllTitles, setLoadingAllTitles] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);

  // Modal state. modalTitleId is null (closed), "new" (create flow), or an
  // existing title's id (edit flow) — sentences can only be managed once
  // it's a real id, since a sentence needs a titleId to attach to.
  const [modalTitleId, setModalTitleId] = useState(null);
  const [modalTitleText, setModalTitleText] = useState("");
  const [modalSentences, setModalSentences] = useState([]);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deletingTitleId, setDeletingTitleId] = useState(null);

  const [newSentenceText, setNewSentenceText] = useState("");
  const [addingSentence, setAddingSentence] = useState(false);
  const [editingSentenceId, setEditingSentenceId] = useState(null);
  const [editingSentenceText, setEditingSentenceText] = useState("");
  const [savingSentenceId, setSavingSentenceId] = useState(null);
  const [deletingSentenceId, setDeletingSentenceId] = useState(null);

  const requestedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Math.max(requestedPage || 1, 1);
  const appliedSearch = searchParams.get("q") || "";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchTitles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/how-to-say-titles/all", {
        params: {
          page: currentPage,
          limit: PAGE_SIZE,
          search: appliedSearch || undefined,
        },
      });
      setTitles(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (error) {
      console.error(
        "Error fetching 'How to say it in German' phrases:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedSearch]);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  const fetchAllTitlesForFavorites = useCallback(async () => {
    setLoadingAllTitles(true);
    try {
      const ADMIN_MAX_LIMIT = 40;
      let page = 1;
      let collected = [];
      while (true) {
        const response = await api.get("/how-to-say-titles/all", {
          params: { page, limit: ADMIN_MAX_LIMIT },
        });
        const data = response.data?.data || [];
        collected = collected.concat(data);
        const metaTotal = response.data?.meta?.total ?? collected.length;
        if (data.length === 0 || collected.length >= metaTotal) break;
        page += 1;
      }
      setAllTitles(collected);
    } catch (error) {
      console.error("Error fetching all phrases for favorites:", error);
    } finally {
      setLoadingAllTitles(false);
    }
  }, []);

  useEffect(() => {
    if (showFavoritesOnly) {
      fetchAllTitlesForFavorites();
    }
  }, [showFavoritesOnly, fetchAllTitlesForFavorites]);

  const displayedTitles = showFavoritesOnly
    ? allTitles.filter((titleItem) => favoriteIds.includes(titleItem.id))
    : titles;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = {};
    const trimmed = searchInput.trim();
    if (trimmed) params.q = trimmed;
    setSearchParams(params);
  };

  const handleGoToPage = (page) => {
    const params = {};
    if (appliedSearch) params.q = appliedSearch;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
  };

  const toggleExpanded = (titleId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(titleId)) {
        next.delete(titleId);
      } else {
        next.add(titleId);
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setModalTitleId("new");
    setModalTitleText("");
    setModalSentences([]);
  };

  const openEditModal = (titleItem) => {
    setModalTitleId(titleItem.id);
    setModalTitleText(titleItem.title);
    setModalSentences(titleItem.sentences || []);
  };

  const closeModal = () => {
    setModalTitleId(null);
    setModalTitleText("");
    setModalSentences([]);
    setNewSentenceText("");
    setEditingSentenceId(null);
    setEditingSentenceText("");
    fetchTitles();
    if (showFavoritesOnly) {
      fetchAllTitlesForFavorites();
    }
  };

  const handleSaveTitle = async () => {
    const title = modalTitleText.trim();
    if (!title) return;

    setSavingTitle(true);
    try {
      if (modalTitleId === "new") {
        const response = await api.post("/how-to-say-titles/create", {
          title,
        });
        setModalTitleId(response.data.data.id);
        setModalSentences([]);
      } else {
        const response = await api.put(
          `/how-to-say-titles/update/${modalTitleId}`,
          { title },
        );
        setModalTitleText(response.data.data.title);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not save",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDeleteTitle = async (titleItem) => {
    const sentenceCount = titleItem.sentences?.length || 0;
    const confirmation = await Swal.fire({
      title: "Delete this phrase?",
      html: `Type <strong>ok</strong> to permanently delete <strong>"${titleItem.title}"</strong>${
        sentenceCount > 0
          ? ` and its ${sentenceCount} German sentence${sentenceCount === 1 ? "" : "s"}`
          : ""
      }. This can't be undone.`,
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
    });
    if (!confirmation.isConfirmed) return;

    setDeletingTitleId(titleItem.id);
    try {
      await api.delete(`/how-to-say-titles/delete/${titleItem.id}`);
      if (modalTitleId === titleItem.id) {
        setModalTitleId(null);
      }
      if (titles.length === 1 && currentPage > 1) {
        handleGoToPage(currentPage - 1);
      } else {
        await fetchTitles();
      }
      if (showFavoritesOnly) {
        await fetchAllTitlesForFavorites();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete phrase",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingTitleId(null);
    }
  };

  const handleAddSentence = async () => {
    const sentence = newSentenceText.trim();
    if (!sentence || !modalTitleId || modalTitleId === "new") return;

    setAddingSentence(true);
    try {
      const response = await api.post("/how-to-say-sentences/create", {
        titleId: modalTitleId,
        sentence,
      });
      setModalSentences((prev) => [...prev, response.data.data]);
      setNewSentenceText("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not add sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setAddingSentence(false);
    }
  };

  const startEditSentence = (sentenceItem) => {
    setEditingSentenceId(sentenceItem.id);
    setEditingSentenceText(sentenceItem.sentence);
  };

  const cancelEditSentence = () => {
    setEditingSentenceId(null);
    setEditingSentenceText("");
  };

  const handleSaveSentence = async (sentenceId) => {
    const sentence = editingSentenceText.trim();
    if (!sentence) return;

    setSavingSentenceId(sentenceId);
    try {
      const response = await api.put(
        `/how-to-say-sentences/update/${sentenceId}`,
        { sentence },
      );
      setModalSentences((prev) =>
        prev.map((item) => (item.id === sentenceId ? response.data.data : item)),
      );
      cancelEditSentence();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not update sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingSentenceId(null);
    }
  };

  const handleDeleteSentence = async (sentenceItem) => {
    const result = await Swal.fire({
      title: "Delete this sentence?",
      html: `Delete <strong>"${sentenceItem.sentence}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingSentenceId(sentenceItem.id);
    try {
      await api.delete(`/how-to-say-sentences/delete/${sentenceItem.id}`);
      setModalSentences((prev) =>
        prev.filter((item) => item.id !== sentenceItem.id),
      );
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingSentenceId(null);
    }
  };

  const modalInputClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
    isLight
      ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
      : "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
  }`;

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-6xl p-4 pb-12">
        {/* Header */}
        <div className="mb-10 mt-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
            🗣️ Learn Phrases
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            How to Say It in German
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Pick an English phrase and see how it's actually said in German.
          </p>
        </div>

        {/* Search + admin create */}
        <div className="mx-auto mb-10 flex max-w-md flex-col items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex w-full gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search phrases..."
              className={`w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                  : "border-slate-700 bg-slate-900 text-white placeholder-slate-500"
              }`}
            />
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Search
            </button>
          </form>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isLight
                  ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                  : "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              <Plus size={16} /> Add New Phrase
            </button>
          )}
        </div>

        {isLoggedIn && (total > 0 || favoriteIds.length > 0) && (
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

        {loading || (showFavoritesOnly && loadingAllTitles) ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader loading={true} />
          </div>
        ) : displayedTitles.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            {showFavoritesOnly
              ? "You haven't favorited any phrases yet."
              : appliedSearch
                ? "No phrases match your search."
                : "No phrases have been added yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {displayedTitles.map((titleItem) => {
              const isExpanded = expandedIds.has(titleItem.id);

              return (
                <div
                  key={titleItem.id}
                  className={`w-full overflow-hidden rounded-3xl border shadow-sm transition-colors duration-200 ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2 px-6 py-3.5 md:px-7 md:py-4">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(titleItem.id)}
                      aria-expanded={isExpanded}
                      className="flex flex-1 items-center justify-between gap-4 text-left"
                    >
                      <span
                        className={`text-xl font-bold leading-snug ${isLight ? "text-slate-900" : "text-white"}`}
                      >
                        {titleItem.title}
                      </span>
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                          isExpanded ? "rotate-45" : ""
                        } ${
                          isLight
                            ? "border-orange-300 text-orange-500"
                            : "border-orange-500/40 text-orange-400"
                        }`}
                      >
                        <Plus size={18} />
                      </span>
                    </button>

                    <FavoriteButton
                      isFavorite={favoriteIds.includes(titleItem.id)}
                      loading={!!loadingFavorites[titleItem.id]}
                      onClick={() => toggleFavorite(titleItem.id)}
                      className={`flex-shrink-0 ${
                        favoriteIds.includes(titleItem.id)
                          ? ""
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />

                    {isSuperAdmin && (
                      <div className="flex flex-shrink-0 items-center gap-1.5 pl-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(titleItem)}
                          aria-label="Edit phrase"
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                            isLight
                              ? "border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600"
                              : "border-slate-700 text-slate-400 hover:border-sky-500/50 hover:text-sky-400"
                          }`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTitle(titleItem)}
                          disabled={deletingTitleId === titleItem.id}
                          aria-label="Delete phrase"
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                            isLight
                              ? "border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600"
                              : "border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div
                      className={`space-y-2.5 border-t pb-6 pl-10 pr-6 pt-4 md:pb-7 md:pl-14 md:pr-7 ${
                        isLight ? "border-slate-100" : "border-slate-800"
                      }`}
                    >
                      {(titleItem.sentences || []).length === 0 ? (
                        <p
                          className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                        >
                          No German sentences yet.
                        </p>
                      ) : (
                        titleItem.sentences.map((sentenceItem) => (
                          <p
                            key={sentenceItem.id}
                            className={`flex items-center gap-2.5 text-base font-medium leading-relaxed ${
                              isLight ? "text-slate-700" : "text-slate-200"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
                                isLight
                                  ? "border-teal-700 bg-teal-600 text-white"
                                  : "border-teal-500 bg-teal-600 text-white"
                              }`}
                            >
                              DE
                            </span>
                            {sentenceItem.sentence}
                          </p>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !showFavoritesOnly && totalPages > 1 && (
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

      {/* Create/Edit modal (SUPER_ADMIN only) */}
      {modalTitleId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
              isLight
                ? "border-slate-200 bg-white"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            <h3
              className={`mb-4 text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
            >
              {modalTitleId === "new" ? "Add New Phrase" : "Edit Phrase"}
            </h3>

            {/* Title */}
            <div className="mb-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={modalTitleText}
                onChange={(event) => setModalTitleText(event.target.value)}
                placeholder='English title, e.g. "I used to"'
                className={modalInputClass}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={savingTitle || !modalTitleText.trim()}
                className="flex-shrink-0 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {savingTitle
                  ? "Saving..."
                  : modalTitleId === "new"
                    ? "Create"
                    : "Save"}
              </button>
            </div>

            {/* Sentences — only once the title is a real saved record */}
            {modalTitleId !== "new" && (
              <div className="space-y-3">
                <p
                  className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  German sentences
                </p>

                {modalSentences.length === 0 && (
                  <p
                    className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No sentences yet.
                  </p>
                )}

                {modalSentences.map((sentenceItem) => (
                  <div key={sentenceItem.id} className="flex items-center gap-2">
                    {editingSentenceId === sentenceItem.id ? (
                      <>
                        <input
                          type="text"
                          value={editingSentenceText}
                          onChange={(event) =>
                            setEditingSentenceText(event.target.value)
                          }
                          className={modalInputClass}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSentence(sentenceItem.id)}
                          disabled={
                            savingSentenceId === sentenceItem.id ||
                            !editingSentenceText.trim()
                          }
                          className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditSentence}
                          disabled={savingSentenceId === sentenceItem.id}
                          className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                            isLight
                              ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                              : "border-slate-600 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex-1 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}
                        >
                          {sentenceItem.sentence}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditSentence(sentenceItem)}
                          aria-label="Edit sentence"
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isLight
                              ? "border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600"
                              : "border-slate-700 text-slate-400 hover:border-sky-500/50 hover:text-sky-400"
                          }`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSentence(sentenceItem)}
                          disabled={deletingSentenceId === sentenceItem.id}
                          aria-label="Delete sentence"
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
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
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSentenceText}
                    onChange={(event) => setNewSentenceText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddSentence();
                      }
                    }}
                    placeholder="Add a German sentence..."
                    className={modalInputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddSentence}
                    disabled={addingSentence || !newSentenceText.trim()}
                    className="flex-shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    {addingSentence ? "Adding..." : "+ Add"}
                  </button>
                </div>
              </div>
            )}

            <div
              className={`mt-6 flex justify-end border-t pt-4 ${
                isLight ? "border-slate-100" : "border-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={closeModal}
                className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-600 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <FavoritesDeleteAllModal
        isOpen={deleteAllModalOpen}
        isLight={isLight}
        itemLabel="phrases"
        onCancel={() => setDeleteAllModalOpen(false)}
        onConfirm={async () => {
          const success = await deleteAllFavorites();
          if (success) setDeleteAllModalOpen(false);
        }}
      />
    </Container>
  );
};

export default HowToSayList;
