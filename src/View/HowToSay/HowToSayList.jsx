import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../Words/Modals/FavoriteButton";
import FavoritesBar from "../../components/Favorites/FavoritesBar";
import FavoritesDeleteAllModal from "../../components/Favorites/FavoritesDeleteAllModal";

// Same drag-to-reorder row shape as the word-update form's DraggableItem —
// a checkbox for bulk-select, a drag handle over the text, then edit/delete.
// Shared by both the sentences list and the rules list (they only differ in
// which field of the underlying record holds the display text).
const SortableTextRow = ({
  id,
  text,
  isLight,
  isSelected,
  onToggleSelect,
  isEditing,
  editingText,
  onEditingTextChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isSaving,
  isDeleting,
  modalInputClass,
  editAriaLabel,
  deleteAriaLabel,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg p-1.5 ${
        isDragging ? "shadow-lg" : isSelected ? (isLight ? "bg-sky-50" : "bg-sky-500/10") : ""
      }`}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={editingText}
            onChange={(event) => onEditingTextChange(event.target.value)}
            className={modalInputClass}
            autoFocus
          />
          <button
            type="button"
            onClick={onSaveEdit}
            disabled={isSaving || !editingText.trim()}
            className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSaving}
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
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(id)}
            className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-500 accent-sky-600"
          />
          <span
            className={`flex flex-1 cursor-grab items-center gap-1.5 touch-none text-sm active:cursor-grabbing ${
              isLight ? "text-slate-700" : "text-slate-200"
            }`}
            {...attributes}
            {...listeners}
          >
            <GripVertical
              size={14}
              className={`flex-shrink-0 ${isLight ? "text-slate-300" : "text-slate-600"}`}
            />
            {text}
          </span>
          <button
            type="button"
            onClick={onStartEdit}
            aria-label={editAriaLabel}
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
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={deleteAriaLabel}
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
  );
};

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
  // existing title's id (edit flow) — sentences/rules can only be managed
  // once it's a real id, since they need a titleId to attach to.
  const [modalTitleId, setModalTitleId] = useState(null);
  const [modalTitleText, setModalTitleText] = useState("");
  const [modalSentences, setModalSentences] = useState([]);
  const [modalRules, setModalRules] = useState([]);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deletingTitleId, setDeletingTitleId] = useState(null);

  const [newSentenceText, setNewSentenceText] = useState("");
  const [addingSentence, setAddingSentence] = useState(false);
  const [editingSentenceId, setEditingSentenceId] = useState(null);
  const [editingSentenceText, setEditingSentenceText] = useState("");
  const [savingSentenceId, setSavingSentenceId] = useState(null);
  const [deletingSentenceId, setDeletingSentenceId] = useState(null);
  const [selectedSentenceIds, setSelectedSentenceIds] = useState(() => new Set());
  const [deletingSelectedSentences, setDeletingSelectedSentences] = useState(false);
  const [reorderingSentences, setReorderingSentences] = useState(false);

  // Rules mirror the sentences state/handlers exactly — same optional,
  // pipeline-addable, drag-reorderable, multi-select-deletable list, just
  // attached to the "rule" field instead of "sentence".
  const [newRuleText, setNewRuleText] = useState("");
  const [addingRule, setAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRuleText, setEditingRuleText] = useState("");
  const [savingRuleId, setSavingRuleId] = useState(null);
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [selectedRuleIds, setSelectedRuleIds] = useState(() => new Set());
  const [deletingSelectedRules, setDeletingSelectedRules] = useState(false);
  const [reorderingRules, setReorderingRules] = useState(false);

  // One sensor config reused by both the sentences and rules drag contexts
  // — sensors are stateless descriptors, each <DndContext> instantiates its
  // own sensor instances from them.
  const dragSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
    setModalRules([]);
    setSelectedSentenceIds(new Set());
    setSelectedRuleIds(new Set());
  };

  const openEditModal = (titleItem) => {
    setModalTitleId(titleItem.id);
    setModalTitleText(titleItem.title);
    setModalSentences(titleItem.sentences || []);
    setModalRules(titleItem.rules || []);
    setSelectedSentenceIds(new Set());
    setSelectedRuleIds(new Set());
  };

  const closeModal = () => {
    setModalTitleId(null);
    setModalTitleText("");
    setModalSentences([]);
    setModalRules([]);
    setNewSentenceText("");
    setEditingSentenceId(null);
    setEditingSentenceText("");
    setSelectedSentenceIds(new Set());
    setNewRuleText("");
    setEditingRuleId(null);
    setEditingRuleText("");
    setSelectedRuleIds(new Set());
    fetchTitles();
    if (showFavoritesOnly) {
      fetchAllTitlesForFavorites();
    }
  };

  // Re-fetches just this title's sentences and rules from the server —
  // used to recover the authoritative order/list after a reorder or
  // bulk-delete fails partway through, instead of leaving the modal
  // showing a possibly-inconsistent local state.
  const refetchModalTitleData = async () => {
    if (!modalTitleId || modalTitleId === "new") return;
    try {
      const response = await api.get(`/how-to-say-titles/${modalTitleId}`);
      setModalSentences(response.data?.data?.sentences || []);
      setModalRules(response.data?.data?.rules || []);
    } catch (error) {
      console.error("Error refetching title data:", error);
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

  // Same "|" pipeline convention as the word update form: "Sentence A. |
  // Sentence B. | Sentence C." creates three separate sentence rows in one
  // go. Created sequentially (not Promise.all) so each one's server-side
  // `order` (based on the current count under the title) accounts for the
  // ones just created before it, landing them in the typed order.
  const handleAddSentence = async () => {
    const segments = newSentenceText
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length === 0 || !modalTitleId || modalTitleId === "new") {
      return;
    }

    setAddingSentence(true);
    try {
      const created = [];
      for (const sentence of segments) {
        const response = await api.post("/how-to-say-sentences/create", {
          titleId: modalTitleId,
          sentence,
        });
        created.push(response.data.data);
      }
      setModalSentences((prev) => [...prev, ...created]);
      setNewSentenceText("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not add sentence(s)",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
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

  const toggleSelectSentence = (sentenceId) => {
    setSelectedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(sentenceId)) {
        next.delete(sentenceId);
      } else {
        next.add(sentenceId);
      }
      return next;
    });
  };

  const deselectAllSentences = () => setSelectedSentenceIds(new Set());

  const handleDeleteSelectedSentences = async () => {
    const ids = [...selectedSentenceIds];
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${ids.length} sentence${ids.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setDeletingSelectedSentences(true);
    try {
      await Promise.all(
        ids.map((sentenceId) =>
          api.delete(`/how-to-say-sentences/delete/${sentenceId}`),
        ),
      );
      setModalSentences((prev) =>
        prev.filter((item) => !selectedSentenceIds.has(item.id)),
      );
      setSelectedSentenceIds(new Set());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete selected sentences",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
    } finally {
      setDeletingSelectedSentences(false);
    }
  };

  // Same drag-then-confirm-then-persist flow as the word update form's
  // handleDragEnd: reorder locally, ask for confirmation, then send the new
  // id order to the backend so it survives a refresh.
  const handleSentenceDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modalSentences.findIndex((s) => s.id === active.id);
    const newIndex = modalSentences.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const result = await Swal.fire({
      title: "Reorder?",
      text: `Position ${oldIndex + 1} → ${newIndex + 1}`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    const reordered = arrayMove(modalSentences, oldIndex, newIndex);
    setModalSentences(reordered);
    setReorderingSentences(true);
    try {
      const response = await api.put("/how-to-say-sentences/reorder", {
        titleId: modalTitleId,
        orderedIds: reordered.map((s) => s.id),
      });
      setModalSentences(response.data.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not reorder",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
    } finally {
      setReorderingSentences(false);
    }
  };

  // Rules mirror every one of the sentence handlers above — same pipeline
  // add, inline edit, single/bulk delete, and drag reorder — just against
  // the /how-to-say-rules endpoints and the "rule" field instead of
  // "sentence". Rules are entirely optional, so an empty list is normal.
  const handleAddRule = async () => {
    const segments = newRuleText
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length === 0 || !modalTitleId || modalTitleId === "new") {
      return;
    }

    setAddingRule(true);
    try {
      const created = [];
      for (const rule of segments) {
        const response = await api.post("/how-to-say-rules/create", {
          titleId: modalTitleId,
          rule,
        });
        created.push(response.data.data);
      }
      setModalRules((prev) => [...prev, ...created]);
      setNewRuleText("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not add rule(s)",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
    } finally {
      setAddingRule(false);
    }
  };

  const startEditRule = (ruleItem) => {
    setEditingRuleId(ruleItem.id);
    setEditingRuleText(ruleItem.rule);
  };

  const cancelEditRule = () => {
    setEditingRuleId(null);
    setEditingRuleText("");
  };

  const handleSaveRule = async (ruleId) => {
    const rule = editingRuleText.trim();
    if (!rule) return;

    setSavingRuleId(ruleId);
    try {
      const response = await api.put(`/how-to-say-rules/update/${ruleId}`, {
        rule,
      });
      setModalRules((prev) =>
        prev.map((item) => (item.id === ruleId ? response.data.data : item)),
      );
      cancelEditRule();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not update rule",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleItem) => {
    const result = await Swal.fire({
      title: "Delete this rule?",
      html: `Delete <strong>"${ruleItem.rule}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingRuleId(ruleItem.id);
    try {
      await api.delete(`/how-to-say-rules/delete/${ruleItem.id}`);
      setModalRules((prev) => prev.filter((item) => item.id !== ruleItem.id));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete rule",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingRuleId(null);
    }
  };

  const toggleSelectRule = (ruleId) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const deselectAllRules = () => setSelectedRuleIds(new Set());

  const handleDeleteSelectedRules = async () => {
    const ids = [...selectedRuleIds];
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${ids.length} rule${ids.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setDeletingSelectedRules(true);
    try {
      await Promise.all(
        ids.map((ruleId) => api.delete(`/how-to-say-rules/delete/${ruleId}`)),
      );
      setModalRules((prev) =>
        prev.filter((item) => !selectedRuleIds.has(item.id)),
      );
      setSelectedRuleIds(new Set());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete selected rules",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
    } finally {
      setDeletingSelectedRules(false);
    }
  };

  const handleRuleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modalRules.findIndex((r) => r.id === active.id);
    const newIndex = modalRules.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const result = await Swal.fire({
      title: "Reorder?",
      text: `Position ${oldIndex + 1} → ${newIndex + 1}`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    const reordered = arrayMove(modalRules, oldIndex, newIndex);
    setModalRules(reordered);
    setReorderingRules(true);
    try {
      const response = await api.put("/how-to-say-rules/reorder", {
        titleId: modalTitleId,
        orderedIds: reordered.map((r) => r.id),
      });
      setModalRules(response.data.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not reorder",
        text: error.response?.data?.message || "Please try again.",
      });
      await refetchModalTitleData();
    } finally {
      setReorderingRules(false);
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
                  <div className="flex w-full items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(titleItem.id)}
                      aria-expanded={isExpanded}
                      className="flex flex-1 items-center justify-between gap-4 px-6 py-3.5 text-left md:px-7 md:py-4"
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

                    <div className="flex flex-shrink-0 items-center gap-2 pr-6 md:pr-7">
                      <FavoriteButton
                        isFavorite={favoriteIds.includes(titleItem.id)}
                        loading={!!loadingFavorites[titleItem.id]}
                        onClick={() => toggleFavorite(titleItem.id)}
                        className={
                          favoriteIds.includes(titleItem.id)
                            ? ""
                            : "text-slate-300 dark:text-slate-600"
                        }
                      />

                      {isSuperAdmin && (
                        <div className="flex flex-shrink-0 items-center gap-1.5">
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
                  </div>

                  {isExpanded && (
                    <div
                      className={`space-y-2.5 border-t pb-6 pl-10 pr-6 pt-4 md:pb-7 md:pl-14 md:pr-7 ${
                        isLight ? "border-slate-100" : "border-slate-800"
                      }`}
                    >
                      {titleItem.rules?.length > 0 && (
                        <div className="space-y-2 pb-1">
                          {titleItem.rules.map((ruleItem) => (
                            <p
                              key={ruleItem.id}
                              className={`flex items-center gap-2.5 text-sm font-medium leading-relaxed ${
                                isLight ? "text-slate-600" : "text-slate-300"
                              }`}
                            >
                              <span
                                className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
                                  isLight
                                    ? "border-amber-700 bg-amber-600 text-white"
                                    : "border-amber-500 bg-amber-600 text-white"
                                }`}
                              >
                                RULE
                              </span>
                              {ruleItem.rule}
                            </p>
                          ))}
                        </div>
                      )}

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

            {/* Rules — optional, only once the title is a real saved record */}
            {modalTitleId !== "new" && (
              <div className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                  >
                    Grammar rules{" "}
                    <span
                      className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}
                    >
                      (optional — for multiple, use "|")
                    </span>
                  </p>
                  {selectedRuleIds.size > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={deselectAllRules}
                        disabled={deletingSelectedRules}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          isLight
                            ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                            : "border-slate-600 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedRules}
                        disabled={deletingSelectedRules}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        {deletingSelectedRules
                          ? "Deleting..."
                          : `Delete Selected (${selectedRuleIds.size})`}
                      </button>
                    </div>
                  )}
                </div>

                {modalRules.length === 0 && (
                  <p
                    className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No rules added — this section only shows on the phrase
                    when at least one rule exists.
                  </p>
                )}

                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleRuleDragEnd}
                >
                  <SortableContext
                    items={modalRules.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {modalRules.map((ruleItem) => (
                        <SortableTextRow
                          key={ruleItem.id}
                          id={ruleItem.id}
                          text={ruleItem.rule}
                          isLight={isLight}
                          isSelected={selectedRuleIds.has(ruleItem.id)}
                          onToggleSelect={toggleSelectRule}
                          isEditing={editingRuleId === ruleItem.id}
                          editingText={editingRuleText}
                          onEditingTextChange={setEditingRuleText}
                          onStartEdit={() => startEditRule(ruleItem)}
                          onSaveEdit={() => handleSaveRule(ruleItem.id)}
                          onCancelEdit={cancelEditRule}
                          onDelete={() => handleDeleteRule(ruleItem)}
                          isSaving={savingRuleId === ruleItem.id}
                          isDeleting={deletingRuleId === ruleItem.id}
                          modalInputClass={modalInputClass}
                          editAriaLabel="Edit rule"
                          deleteAriaLabel="Delete rule"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {reorderingRules && (
                  <p
                    className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Saving new order...
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newRuleText}
                    onChange={(event) => setNewRuleText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddRule();
                      }
                    }}
                    placeholder='Subject + Verb | ...'
                    className={modalInputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    disabled={addingRule || !newRuleText.trim()}
                    className="flex-shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    {addingRule ? "Adding..." : "+ Add"}
                  </button>
                </div>
              </div>
            )}

            {/* Sentences — only once the title is a real saved record */}
            {modalTitleId !== "new" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}
                  >
                    German sentences{" "}
                    <span
                      className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}
                    >
                      (for multiple, use "|" — e.g. Sentence A. | Sentence B.)
                    </span>
                  </p>
                  {selectedSentenceIds.size > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={deselectAllSentences}
                        disabled={deletingSelectedSentences}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          isLight
                            ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                            : "border-slate-600 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedSentences}
                        disabled={deletingSelectedSentences}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        {deletingSelectedSentences
                          ? "Deleting..."
                          : `Delete Selected (${selectedSentenceIds.size})`}
                      </button>
                    </div>
                  )}
                </div>

                {modalSentences.length === 0 && (
                  <p
                    className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No sentences yet.
                  </p>
                )}

                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSentenceDragEnd}
                >
                  <SortableContext
                    items={modalSentences.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {modalSentences.map((sentenceItem) => (
                        <SortableTextRow
                          key={sentenceItem.id}
                          id={sentenceItem.id}
                          text={sentenceItem.sentence}
                          isLight={isLight}
                          isSelected={selectedSentenceIds.has(sentenceItem.id)}
                          onToggleSelect={toggleSelectSentence}
                          isEditing={editingSentenceId === sentenceItem.id}
                          editingText={editingSentenceText}
                          onEditingTextChange={setEditingSentenceText}
                          onStartEdit={() => startEditSentence(sentenceItem)}
                          onSaveEdit={() => handleSaveSentence(sentenceItem.id)}
                          onCancelEdit={cancelEditSentence}
                          onDelete={() => handleDeleteSentence(sentenceItem)}
                          isSaving={savingSentenceId === sentenceItem.id}
                          isDeleting={deletingSentenceId === sentenceItem.id}
                          editAriaLabel="Edit sentence"
                          deleteAriaLabel="Delete sentence"
                          modalInputClass={modalInputClass}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {reorderingSentences && (
                  <p
                    className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Saving new order...
                  </p>
                )}

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
                    placeholder='Sentence A. | Sentence B. | Sentence C.'
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
              className={`mt-6 flex justify-between gap-3 border-t pt-4 ${
                isLight ? "border-slate-100" : "border-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Done
              </button>
              <button
                type="button"
                onClick={closeModal}
                className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${
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
