import { useState, useEffect, useRef } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { IoCheckmark } from "react-icons/io5";
import Container from "../../../utils/Container";
import api from "../../../axios";
import { useAuth } from "../../../services/auth.services";
import { invalidateWordsCache } from "../../../utils/storage";
import RelationTagInput from "../../../components/RelationTagInput";
import {
  validateSingleRelationField,
  validateRelationWords,
  detectWordsNeedingPOSSelection,
  showPOSSelectionPopup,
  fetchWordVariants,
} from "../../../utils/wordValidation";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  capitalizePartOfSpeechName,
  sortByPartOfSpeechDisplayOrder,
} from "../../../utils/partOfSpeechDisplay";

// Draggable Item Component
const DraggableItem = ({
  id,
  item,
  index,
  field,
  editingField,
  editValue,
  onEdit,
  onRemove,
  onSaveEdit,
  onCancelEdit,
  setEditValue,
  onAddAbove,
  onAddBelow,
  isSelected,
  onToggleSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing =
    editingField?.type === field && editingField?.index === index;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg mb-2 shadow-sm transition-all ${
        isDragging
          ? "shadow-lg scale-105 bg-blue-400"
          : isSelected
            ? "bg-blue-200 shadow-md ring-2 ring-blue-400"
            : "bg-slate-300"
      }`}
    >
      {isEditing ? (
        <div className="flex flex-col md:flex-row justify-between w-full gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit(field, index);
              }}
              className="btn btn-sm btn-success"
            >
              Save
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(index); }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-500 accent-blue-600"
          />
          <div
            className="flex-1 break-words font-medium cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            {item}
          </div>
          <div className="flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddAbove(field, index);
              }}
              className="hover:scale-110 transition-transform"
              title="Add above"
            >
              <FaChevronCircleUp
                size={24}
                className="text-slate-700 hover:text-orange-500 transition-colors"
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddBelow(field, index);
              }}
              className="hover:scale-110 transition-transform"
              title="Add below"
            >
              <FaChevronCircleDown
                size={24}
                className="text-slate-700 hover:text-orange-500 transition-colors"
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(field, index, item);
              }}
              className="btn btn-sm btn-info gap-1"
              title="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(field, index);
              }}
              className="btn btn-sm btn-error gap-1"
              title="Remove"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FIELD_DELIMITERS = {
  meaning: ",",
  synonyms: ",",
  antonyms: ",",
  similarWords: ",",
};

const normalizeFieldItems = (field, value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (!normalizedValue) {
    return [];
  }

  const delimiter = FIELD_DELIMITERS[field];

  if (!delimiter) {
    return [normalizedValue];
  }

  return normalizedValue
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeSentenceItems = (value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (!normalizedValue) {
    return [];
  }

  return normalizedValue
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeInsertedItems = (field, value) => {
  if (field === "sentences") {
    return normalizeSentenceItems(value);
  }

  return normalizeFieldItems(null, value);
};

const RELATION_FIELDS = ["synonyms", "antonyms", "similarWords"];
const RELATION_ID_KEYS = {
  synonyms: "synonymIds",
  antonyms: "antonymIds",
  similarWords: "similarWordIds",
};

const normalizeWordValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

// "Phrase" and "unknown" can't be combined with any other part of speech —
// mirrors the backend's validateExclusivePartOfSpeechRule. (Unlike the
// create form, Update's relation self-reference checks are already
// id-based — the word being edited always has a real id — so no POS-set
// comparison helper is needed here.)
const EXCLUSIVE_PART_OF_SPEECH_NAMES = ["phrase", "unknown"];

const getSelfReferenceMessage = (value, relations) => {
  const normalizedValue = normalizeWordValue(value);

  if (!normalizedValue) {
    return null;
  }

  const invalidLabels = [
    ["synonyms", "synonym"],
    ["antonyms", "antonym"],
    ["similarWords", "similar word"],
  ]
    .filter(([field]) =>
      Array.isArray(relations[field])
        ? relations[field].some(
            (item) => normalizeWordValue(item) === normalizedValue,
          )
        : false,
    )
    .map(([, label]) => label);

  if (!invalidLabels.length) {
    return null;
  }

  return `The word cannot reference itself as a ${invalidLabels.join(", ")}.`;
};

const showSelfReferenceAlert = (message) =>
  Swal.fire({
    title: "Invalid relation",
    text: message,
    icon: "warning",
    timer: 2200,
    showConfirmButton: false,
  });

const UpdateWord = () => {
  const { id } = useParams();
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

  const [formData, setFormData] = useState({
    id: id,
    value: "",
    meaning: [],
    sentences: [],
    levelId: null,
    topicId: null,
    articleId: null,
    partOfSpeechIds: [],
    pluralForm: "",
    synonyms: [],
    antonyms: [],
    similarWords: [],
    prefix: null,
    isPrepositional: false,
    isShortForm: false,
    verbAttributes: {
      conjugation: "REGULAR",
      isReflexive: false,
      isModal: false,
      prefixType: "NONE",
      caseRequirement: null,
    },
    prepositionAttributes: {
      prepositionCase: null,
    },
    level: {},
    topic: {},
    article: {},
    partsOfSpeech: [],
  });

  // Snapshot of formData as last loaded/saved from the server — compared
  // against the live formData (plus any pending quick-add/inline-edit text)
  // to decide whether the Update button should be enabled at all.
  const [initialFormData, setInitialFormData] = useState(null);

  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const [partOfSpeeches, setPartOfSpeeches] = useState([]);
  const [editingField, setEditingField] = useState(null); // { type: 'meaning' | 'sentences', index: number }
  const [editValue, setEditValue] = useState("");

  const [inputData, setInputData] = useState({
    meaning: "",
    sentences: "",
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [addingAt, setAddingAt] = useState(null); // { index: number, position: 'above' | 'below', field: string }
  const [newItemValue, setNewItemValue] = useState("");
  const [selectedItems, setSelectedItems] = useState({ meaning: new Set(), sentences: new Set() });
  // Chips in the "add a new relation" inputs still awaiting a manual POS
  // pick (their text matches more than one existing Word row) — keyed by
  // the chip's own stable `key`, not its text, so two new chips that
  // happen to share a spelling (e.g. "kühler" as noun AND as adjective)
  // are tracked independently instead of colliding.
  const [ambiguousChips, setAmbiguousChips] = useState({});
  // Chip keys already sent through fetchWordVariants — each chip only
  // needs resolving once (see makeChip in RelationTagInput for why
  // removing and re-adding the same text never collides with this).
  const processedChipKeysRef = useRef(new Set());
  // Ids added THIS session via the new-relation ambiguous-POS-resolve flow
  // below, tracked separately from `currentRelationIds` (which stays
  // keyed by plain text and belongs to the existing-relations re-edit
  // feature further down) so two new same-text-different-POS additions
  // don't clobber each other's tracking. Every id here was already POSTed
  // to /word/relation/add the moment it was resolved — this only feeds
  // preservedIdsFor at submit time so a later Update click doesn't
  // silently disconnect it again.
  const [addedRelationIds, setAddedRelationIds] = useState({
    synonym: {},
    antonym: {},
    similarWord: {},
  });
  // Tracks POS overrides for EXISTING relation items (not new typed ones)
  const [relPOSOverrides, setRelPOSOverrides] = useState({
    synonym: {},
    antonym: {},
    similarWord: {},
  });
  // Which existing relation words have multiple POS variants (controls button visibility)
  const [multiPOSExisting, setMultiPOSExisting] = useState({
    synonym: new Set(),
    antonym: new Set(),
    similarWord: new Set(),
  });
  // The full backend relation objects (id + partsOfSpeech), in the exact
  // order the backend returns them — same order formData.synonyms/etc is
  // built from at load. Unlike currentRelationPOSNames (keyed by text,
  // collapses duplicate spellings to one), this is read by INDEX, so two
  // rows with the same text each show their own correct POS. Refreshed on
  // every refetch — briefly stale (falls back to no label) right after a
  // local-only add/remove/reorder, until the matching refetch lands.
  const [relationVariantDetails, setRelationVariantDetails] = useState({
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });
  // The variant ID currently linked for each existing relation word
  const [currentRelationIds, setCurrentRelationIds] = useState({
    synonym: {},
    antonym: {},
    similarWord: {},
  });
  // The POS name currently linked for each multi-POS relation word (for display)
  const [currentRelationPOSNames, setCurrentRelationPOSNames] = useState({
    synonym: {},
    antonym: {},
    similarWord: {},
  });

  // Setup DnD Kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // True when a Word row is already linked as this relation type — either
  // already saved (relationVariantDetails, kept in sync locally by every
  // add below) or resolved on another chip still sitting in the "add new"
  // box. Catches a word being added twice, whether by re-suggesting the
  // same exact variant or by two free-typed chips resolving to the same
  // single variant.
  const isWordIdAlreadyLinked = (field, wordId, excludeChipKey = null) =>
    relationVariantDetails[field].some((d) => d.id === wordId) ||
    inputData[field].some(
      (c) => c.wordId === wordId && c.key !== excludeChipKey,
    );

  // Writes a resolution directly onto one specific chip (by key) in
  // inputData, never onto every chip sharing its text.
  const applyChipResolution = (field, chipKey, resolution) => {
    setInputData((prev) => ({
      ...prev,
      [field]: prev[field].map((chip) =>
        chip.key === chipKey ? { ...chip, ...resolution } : chip,
      ),
    }));
    setAmbiguousChips((prev) => {
      if (!(chipKey in prev)) return prev;
      const next = { ...prev };
      delete next[chipKey];
      return next;
    });
  };

  // Resolve one ambiguous new-relation chip's POS via the picker popup —
  // saves immediately (POST /word/relation/add), same as before, but keyed
  // by the specific chip so a second chip sharing the same text resolves
  // completely independently instead of clobbering the first one's link.
  const resolveChipPOS = async (chipKey) => {
    const pending = ambiguousChips[chipKey];
    if (!pending) return;

    const selected = await showPOSSelectionPopup(
      `${pending.value} (${pending.relationType})`,
      pending.variants,
      null,
      Number(formData.id),
    );
    if (!selected) return;

    if (Number(selected.id) === Number(formData.id)) {
      await showSelfReferenceAlert(
        `A word cannot reference itself as a ${pending.relationType}.`,
      );
      return;
    }

    if (isWordIdAlreadyLinked(pending.field, selected.id, chipKey)) {
      Swal.fire({
        title: "Already added",
        text: `"${pending.value}" (${selected.partsOfSpeech.map((p) => p.name).join(", ")}) is already linked to this word.`,
        icon: "info",
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    try {
      await api.post("/word/relation/add", {
        wordId: formData.id,
        relatedWordId: selected.id,
        relationType: pending.relationType,
      });

      // Remove just this one chip from the "add new" staging area.
      setInputData((prev) => ({
        ...prev,
        [pending.field]: prev[pending.field].filter(
          (chip) => chip.key !== chipKey,
        ),
      }));
      setAmbiguousChips((prev) => {
        const next = { ...prev };
        delete next[chipKey];
        return next;
      });

      // Move to formData as a saved relation, same as an unambiguous add.
      setFormData((prev) => ({
        ...prev,
        [pending.field]: [...prev[pending.field], pending.value],
      }));

      // Update relationVariantDetails in the SAME step, synchronously —
      // this (not a background refetch) is what the per-row POS label
      // reads, so it's correct immediately regardless of refetch timing,
      // caching, or ordering from the backend.
      setRelationVariantDetails((prev) => ({
        ...prev,
        [pending.field]: [
          ...prev[pending.field],
          {
            id: selected.id,
            value: pending.value,
            partsOfSpeech: selected.partsOfSpeech,
          },
        ],
      }));

      // Tracked separately from currentRelationIds (owned by the
      // existing-relations re-edit feature below, left untouched here) so
      // a second same-text addition this session doesn't overwrite the
      // first one's id — both must survive the next Update click's
      // preservedIdsFor pass.
      setAddedRelationIds((prev) => {
        const existingIds = prev[pending.relationType][pending.value] || [];
        return {
          ...prev,
          [pending.relationType]: {
            ...prev[pending.relationType],
            [pending.value]: [...existingIds, selected.id],
          },
        };
      });

      // Lets the existing-relations "Select POS" button also appear for
      // this newly-added multi-POS word if the admin wants to re-pick it
      // later via the (separate, text-keyed) existing-relations flow.
      setMultiPOSExisting((prev) => ({
        ...prev,
        [pending.relationType]: new Set([
          ...prev[pending.relationType],
          pending.value,
        ]),
      }));

      Swal.fire({
        title: "Added!",
        text: `"${pending.value}" added as ${pending.relationType} (${selected.partsOfSpeech.map((p) => p.name).join(", ")}).`,
        timer: 800,
        showConfirmButton: false,
        icon: "success",
      });
    } catch {
      Swal.fire({
        title: "Error",
        text: "Failed to add relation. Please try again.",
        icon: "error",
      });
    }
  };

  // Handle POS selection for existing relation items — saves immediately, no Submit needed.
  const handleExistingPOSSelection = async (wordValue, relationType) => {
    const variants = await fetchWordVariants(wordValue);
    if (variants.length === 0) return;

    let selected;
    if (variants.length === 1) {
      selected = variants[0];
    } else {
      const currentVariantId =
        relPOSOverrides[relationType]?.[wordValue]?.variantId ??
        currentRelationIds[relationType]?.[wordValue];
      selected = await showPOSSelectionPopup(
        `${wordValue} (${relationType})`,
        variants,
        currentVariantId,
        Number(formData.id),
      );
    }

    if (!selected) return;

    // Self-reference check before any API call
    if (Number(selected.id) === Number(formData.id)) {
      await showSelfReferenceAlert(
        `A word cannot reference itself as a ${relationType}.`,
      );
      return;
    }

    const oldVariantId =
      relPOSOverrides[relationType]?.[wordValue]?.variantId ??
      currentRelationIds[relationType]?.[wordValue];

    // No change
    if (oldVariantId && Number(oldVariantId) === Number(selected.id)) return;

    try {
      // Remove old link, then add new link
      if (oldVariantId) {
        await api.delete("/word/relation/remove", {
          data: {
            wordId: formData.id,
            relatedWordId: oldVariantId,
            relationType,
          },
        });
      }
      await api.post("/word/relation/add", {
        wordId: formData.id,
        relatedWordId: selected.id,
        relationType,
      });

      // Update tracking state so the button reflects the new POS immediately
      setCurrentRelationIds((prev) => ({
        ...prev,
        [relationType]: { ...prev[relationType], [wordValue]: selected.id },
      }));
      setCurrentRelationPOSNames((prev) => ({
        ...prev,
        [relationType]: {
          ...prev[relationType],
          [wordValue]: selected.partsOfSpeech.map((p) => p.name).join(", "),
        },
      }));
      // Keep relPOSOverrides in sync so main submit also uses the correct variant
      setRelPOSOverrides((prev) => ({
        ...prev,
        [relationType]: {
          ...prev[relationType],
          [wordValue]: {
            variantId: selected.id,
            partOfSpeechName: selected.partsOfSpeech.map((p) => p.name).join(", "),
          },
        },
      }));

      Swal.fire({
        title: "Updated!",
        text: `Part of speech changed to "${selected.partsOfSpeech.map((p) => p.name).join(", ")}".`,
        timer: 800,
        showConfirmButton: false,
        icon: "success",
      });
    } catch {
      Swal.fire({
        title: "Error",
        text: "Failed to update part of speech. Please try again.",
        icon: "error",
      });
    }
  };

  // Resolve every not-yet-linked new-relation chip's word id/POS as soon
  // as it's added: 0 variants → new word text, left unresolved (existing
  // plain-text create-on-submit behavior, unchanged); 1 variant → silently
  // auto-resolved; >1 variants → surfaced as an ambiguous chip needing a
  // manual pick. Each chip is identified by its own stable key, so two
  // chips sharing a spelling (different POS) resolve independently.
  useEffect(() => {
    const relationLists = [
      { chips: inputData.synonyms, type: "synonym", field: "synonyms" },
      { chips: inputData.antonyms, type: "antonym", field: "antonyms" },
      {
        chips: inputData.similarWords,
        type: "similarWord",
        field: "similarWords",
      },
    ];

    const toResolve = [];
    relationLists.forEach(({ chips, type, field }) => {
      chips.forEach((chip) => {
        if (
          chip.wordId === null &&
          !processedChipKeysRef.current.has(chip.key)
        ) {
          toResolve.push({ chip, type, field });
        }
      });
    });

    if (toResolve.length === 0) return;

    toResolve.forEach(({ chip }) =>
      processedChipKeysRef.current.add(chip.key),
    );

    let cancelled = false;

    (async () => {
      for (const { chip, type, field } of toResolve) {
        const variants = await fetchWordVariants(chip.value);
        if (cancelled) return;

        if (variants.length === 0) {
          continue;
        }

        if (variants.length === 1) {
          const variant = variants[0];
          if (Number(variant.id) === Number(formData.id)) {
            // Self-reference — leave unresolved, same as today's
            // behavior; caught again defensively at submit time.
            continue;
          }

          if (isWordIdAlreadyLinked(field, variant.id, chip.key)) {
            // Same text, only one variant to resolve to, and that variant
            // is already linked (saved or on another pending chip) —
            // remove this one rather than silently creating a duplicate.
            setInputData((prev) => ({
              ...prev,
              [field]: prev[field].filter((c) => c.key !== chip.key),
            }));
            Swal.fire({
              title: "Already added",
              text: `"${chip.value}" is already linked to this word.`,
              icon: "info",
              timer: 1800,
              showConfirmButton: false,
            });
            continue;
          }

          applyChipResolution(field, chip.key, {
            wordId: variant.id,
            pos: variant.partsOfSpeech.map((p) => p.name).join(", "),
          });
          continue;
        }

        setAmbiguousChips((prev) => ({
          ...prev,
          [chip.key]: {
            value: chip.value,
            relationType: type,
            field,
            variants,
          },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputData.synonyms, inputData.antonyms, inputData.similarWords]);

  // Build PUT payload — omit relation arrays when the field being updated is not a
  // relation field so the backend skips re-processing all relation DB writes.
  const buildUpdatePayload = (field, overrideValue) => {
    const payload = { ...formData, [field]: overrideValue };
    if (!RELATION_FIELDS.includes(field)) {
      delete payload.synonyms;
      delete payload.antonyms;
      delete payload.similarWords;
    }
    return payload;
  };

  // Builds a PUT payload for a relation-list quick action (remove/reorder/
  // quick-add) using explicit ids for ALL THREE relation types, not just
  // the one being touched. Sending any relation field as plain text makes
  // the backend re-resolve it by VALUE (batchUpsertRelatedWords), which
  // collapses same-spelling multi-POS entries (e.g. two "kühler" rows) down
  // to one — and since the untouched two relation fields were always sent
  // as plain text here too (buildUpdatePayload only strips them for
  // non-relation edits), removing one item from "Word to Watch" could
  // silently corrupt an unrelated multi-POS synonym. `overrides` supplies
  // the field actually being changed as its own already-spliced/reordered
  // {values, details} pair; the other two fields use their current,
  // unchanged state.
  //
  // Each field is partitioned position-by-position against
  // relationVariantDetails: a position with a matching known id goes out
  // as an id; anything else (freshly quick-added raw text with no
  // resolved id yet, or a position that's drifted out of alignment) falls
  // back to the plain-text value — exactly today's behavior for that one
  // entry, never worse than before, just no longer applied to entries
  // that ARE already known.
  const buildRelationIdPayload = (overrides = {}) => {
    const payload = { ...formData };

    RELATION_FIELDS.forEach((field) => {
      const values = overrides[field]?.values ?? formData[field];
      const details = overrides[field]?.details ?? relationVariantDetails[field];
      const idKey = RELATION_ID_KEYS[field];

      const knownIds = [];
      const unresolvedText = [];

      values.forEach((value, i) => {
        const detail = details[i];
        if (detail && detail.value === value) {
          knownIds.push(detail.id);
        } else {
          unresolvedText.push(value);
        }
      });

      payload[field] = unresolvedText;
      payload[idKey] = knownIds;
    });

    return payload;
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Extract field and indices from IDs
    const [activeField, activeIndex] = active.id.split("-");
    const [overField, overIndex] = over.id.split("-");

    if (activeField !== overField) {
      return; // Can't drag between different fields
    }

    const field = activeField;
    const oldIndex = parseInt(activeIndex, 10);
    const newIndex = parseInt(overIndex, 10);

    // Update the array
    const updatedArray = arrayMove(formData[field], oldIndex, newIndex);
    const isRelationField = RELATION_FIELDS.includes(field);
    const updatedDetails = isRelationField
      ? arrayMove(relationVariantDetails[field], oldIndex, newIndex)
      : null;

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Reorder?",
      text: `Position ${oldIndex + 1} → ${newIndex + 1}`,
      // icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) {
      return; // User cancelled the reorder
    }

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));
    if (isRelationField) {
      setRelationVariantDetails((prev) => ({
        ...prev,
        [field]: updatedDetails,
      }));
    }
    setSelectedItems((prev) => ({ ...prev, [field]: new Set() }));

    // Save to backend
    setLoading(true);
    try {
      const payload = isRelationField
        ? buildRelationIdPayload({
            [field]: { values: updatedArray, details: updatedDetails },
          })
        : buildUpdatePayload(field, updatedArray);
      await api.put(`/word/update/${formData.id}`, payload);

      Swal.fire({
        title: "Reordered!",
        text: "Items reordered successfully.",
        timer: 500,
        showConfirmButton: false,
        icon: "success",
      });

      setRefetchTrigger((prev) => prev + 1);
    } catch {
      Swal.fire({
        title: "Error!",
        text: "Failed to reorder. Please try again.",
        icon: "error",
      });
      // Revert on error
      setRefetchTrigger((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (field, index, position) => {
    const itemsToInsert = normalizeInsertedItems(field, newItemValue);

    if (itemsToInsert.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Please enter a value",
        icon: "error",
      });
      return;
    }

    // Quick add-above/add-below saves immediately via api.put below,
    // bypassing handleSubmit entirely — so it also has to repeat
    // handleSubmit's noun/article check itself, or a word that's already
    // sitting in an invalid state (noun with no article, e.g. from data
    // predating this rule) 400s on every unrelated edit with no explanation,
    // instead of guiding the admin to fix the article like the main form
    // does.
    const selectedPosNames = partOfSpeeches
      .filter((p) => formData.partOfSpeechIds.includes(p.id))
      .map((p) => p.name.toLowerCase());
    const isNoun = selectedPosNames.includes("noun");
    const hasRealArticle =
      !!formData.articleId && Number(formData.articleId) !== 4;

    if (isNoun && !hasRealArticle) {
      Swal.fire({
        title: "Article Required",
        text: "This word is a noun but has no article set. Please select an article (in the main form) before adding more items.",
        icon: "warning",
      });
      return;
    }

    const updatedArray = [...formData[field]];
    const insertIndex = position === "above" ? index : index + 1;
    updatedArray.splice(insertIndex, 0, ...itemsToInsert);

    const isRelationField = RELATION_FIELDS.includes(field);
    // Placeholder `null`s at the insert position — the newly-typed text
    // has no resolved id yet, so buildRelationIdPayload's partition below
    // correctly sends just these positions as plain text (still going
    // through the backend's value-based lookup, as today) while every
    // pre-existing entry stays id-based.
    let updatedDetails = null;
    if (isRelationField) {
      updatedDetails = [...relationVariantDetails[field]];
      updatedDetails.splice(insertIndex, 0, ...itemsToInsert.map(() => null));
    }

    if (isRelationField) {
      const selfReferenceMessage = getSelfReferenceMessage(formData.value, {
        [field]: updatedArray,
      });

      if (selfReferenceMessage) {
        await showSelfReferenceAlert(selfReferenceMessage);
        return;
      }

      // Validate that the words exist if they are relation fields
      const isValid = await validateSingleRelationField(itemsToInsert, field);
      if (!isValid) {
        return; // User cancelled the operation
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));
    if (isRelationField) {
      setRelationVariantDetails((prev) => ({
        ...prev,
        [field]: updatedDetails,
      }));
    }

    // Save to backend
    setLoading(true);
    try {
      const payload = isRelationField
        ? buildRelationIdPayload({
            [field]: { values: updatedArray, details: updatedDetails },
          })
        : buildUpdatePayload(field, updatedArray);
      await api.put(`/word/update/${formData.id}`, payload);

      Swal.fire({
        title: "Added!",
        text: "New item added successfully.",
        timer: 500,
        showConfirmButton: false,
        icon: "success",
      });

      setAddingAt(null);
      setNewItemValue("");
      setRefetchTrigger((prev) => prev + 1);
    } catch {
      Swal.fire({
        title: "Error!",
        text: "Failed to add item. Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing word data and all dropdown options in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      let wordData = null;
      let wordCurrentIds = null;

      // --- Critical path: load form + dropdowns, show form immediately ---
      try {
        setInitialLoading(true);

        const [
          wordResponse,
          levelsResponse,
          topicsResponse,
          articlesResponse,
          partOfSpeechResponse,
        ] = await Promise.all([
          api.get(`/word/${id}?_t=${Date.now()}`),
          api.get("/levels"),
          api.get("/topics"),
          api.get("/articles"),
          api.get("/part-of-speech"),
        ]);

        const word = wordResponse.data.data;
        wordData = word;

        const defaults = {
          conjugation: "REGULAR",
          isReflexive: false,
          isModal: false,
          prefixType: "NONE",
          caseRequirement: null,
        };

        const verbAttributes = {
          conjugation: word.conjugation ?? defaults.conjugation,
          isReflexive: word.isReflexive ?? defaults.isReflexive,
          isModal: word.isModal ?? defaults.isModal,
          prefixType: word.prefixType ?? defaults.prefixType,
          caseRequirement: word.caseRequirement ?? defaults.caseRequirement,
        };

        const prepositionAttributes = {
          prepositionCase: word.prepositionCase ?? null,
        };

        const loadedFormData = {
          id: word.id,
          value: word.value,
          meaning: word.meaning || [],
          sentences: word.sentences || [],
          levelId: word.levelId || 1,
          topicId: word.topicId || 1,
          articleId: word.articleId || 4,
          partOfSpeechIds:
            word.partsOfSpeech?.length > 0
              ? word.partsOfSpeech.map((p) => p.id)
              : [3],
          pluralForm: word.pluralForm || "",
          synonyms: word.synonyms?.map((item) => item.value) || [],
          antonyms: word.antonyms?.map((item) => item.value) || [],
          similarWords: word.similarWords?.map((item) => item.value) || [],
          prefix: word.prefix || null,
          isPrepositional: word.isPrepositional || false,
          isShortForm: word.isShortForm || false,
          verbAttributes,
          prepositionAttributes,
          level: word.level,
          topic: word.topic,
          article: word.article,
          partsOfSpeech: word.partsOfSpeech || [],
        };

        setFormData(loadedFormData);
        setInitialFormData(loadedFormData);

        // Full relation objects, same order as loadedFormData.synonyms/etc
        // (both derive from the same word.synonyms/antonyms/similarWords
        // arrays) — read by index in the JSX below for a per-row POS label.
        setRelationVariantDetails({
          synonyms: word.synonyms || [],
          antonyms: word.antonyms || [],
          similarWords: word.similarWords || [],
        });

        wordCurrentIds = {
          synonym: Object.fromEntries(
            (word.synonyms || []).map((s) => [s.value, s.id]),
          ),
          antonym: Object.fromEntries(
            (word.antonyms || []).map((s) => [s.value, s.id]),
          ),
          similarWord: Object.fromEntries(
            (word.similarWords || []).map((s) => [s.value, s.id]),
          ),
        };
        setCurrentRelationIds(wordCurrentIds);

        setLevels(levelsResponse.data);
        setTopics(topicsResponse.data);
        setArticles(articlesResponse.data);
        setPartOfSpeeches(
          sortByPartOfSpeechDisplayOrder(partOfSpeechResponse.data),
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setInitialLoading(false);
      }

      // --- Background path: detect multi-POS relation words (slow, non-blocking) ---
      if (!wordData || !wordCurrentIds) return;
      try {
        const existingRelations = {
          synonyms: (wordData.synonyms || []).map((s) => s.value),
          antonyms: (wordData.antonyms || []).map((s) => s.value),
          similarWords: (wordData.similarWords || []).map((s) => s.value),
        };
        const multiPOSWords =
          await detectWordsNeedingPOSSelection(existingRelations);
        setMultiPOSExisting({
          synonym: new Set(
            multiPOSWords
              .filter((w) => w.relationType === "synonym")
              .map((w) => w.word),
          ),
          antonym: new Set(
            multiPOSWords
              .filter((w) => w.relationType === "antonym")
              .map((w) => w.word),
          ),
          similarWord: new Set(
            multiPOSWords
              .filter((w) => w.relationType === "similarWord")
              .map((w) => w.word),
          ),
        });

        const posNames = { synonym: {}, antonym: {}, similarWord: {} };
        for (const { word: wordVal, relationType, variants } of multiPOSWords) {
          const currentId = wordCurrentIds[relationType]?.[wordVal];
          const match = variants.find((v) => v.id === currentId);
          if (match)
            posNames[relationType][wordVal] = match.partsOfSpeech
              .map((p) => p.name)
              .join(", ");
        }
        setCurrentRelationPOSNames(posNames);
      } catch (posError) {
        console.error(
          "Error detecting multi-POS existing relations:",
          posError,
        );
      }
    };

    fetchAllData();
  }, [id, refetchTrigger]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle verb attributes nested object
    if (name.startsWith("verbAttributes.")) {
      const field = name.split(".")[1];

      setFormData((prevData) => {
        const newVerbAttrs = { ...prevData.verbAttributes };

        // Handle boolean checkboxes
        if (type === "checkbox") {
          newVerbAttrs[field] = checked;

          // Mutual exclusivity: Modal clears reflexive and sets prefixType to none
          if (field === "isModal" && checked) {
            newVerbAttrs.isReflexive = false;
            newVerbAttrs.prefixType = "NONE";
          }

          // Reflexive unchecks Modal
          if (field === "isReflexive" && checked) {
            newVerbAttrs.isModal = false;
          }
        } else {
          // Handle select dropdowns
          // Convert empty string to null for caseRequirement
          if (field === "caseRequirement") {
            newVerbAttrs[field] = value === "" ? null : value;
          } else {
            newVerbAttrs[field] = value;
          }

          // Changing prefixType to separable/inseparable unchecks Modal
          if (
            field === "prefixType" &&
            (value === "SEPARABLE" || value === "INSEPARABLE")
          ) {
            newVerbAttrs.isModal = false;
          }
        }

        return {
          ...prevData,
          verbAttributes: newVerbAttrs,
        };
      });
    } else if (name.startsWith("prepositionAttributes.")) {
      const field = name.split(".")[1];

      setFormData((prevData) => {
        const newPrepositionAttrs = { ...prevData.prepositionAttributes };

        // Handle select dropdown - null means "Not specified"
        newPrepositionAttrs[field] = value === "" ? null : value;

        return {
          ...prevData,
          prepositionAttributes: newPrepositionAttrs,
        };
      });
    }
    // If it's a select field (levelId, topicId, articleId), update formData directly
    else if (
      name === "levelId" ||
      name === "topicId" ||
      name === "articleId"
    ) {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    } else if (
      name === "value" ||
      name === "pluralForm" ||
      name === "prefix" ||
      name === "isPrepositional" ||
      name === "isShortForm"
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else if (name === "meaning" || name === "sentences") {
      setInputData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleRelationChipsChange = (field, nextChips) => {
    setInputData((prevData) => ({
      ...prevData,
      [field]: nextChips,
    }));
  };

  // Toggling a part-of-speech checkbox. Phrase/unknown are mutually
  // exclusive with everything else (backend enforces this too — see
  // validateExclusivePartOfSpeechRule); selecting one of them clears any
  // other selection, and the checkbox group disables the rest while one is
  // active.
  const togglePartOfSpeech = (pos) => {
    const isExclusive = EXCLUSIVE_PART_OF_SPEECH_NAMES.includes(
      pos.name.toLowerCase(),
    );

    setFormData((prevData) => {
      const currentlySelected = prevData.partOfSpeechIds.includes(pos.id);
      const nextIds = isExclusive
        ? currentlySelected
          ? []
          : [pos.id]
        : currentlySelected
          ? prevData.partOfSpeechIds.filter((id) => id !== pos.id)
          : [...prevData.partOfSpeechIds, pos.id];

      const nextSelectedNames = partOfSpeeches
        .filter((p) => nextIds.includes(p.id))
        .map((p) => p.name.toLowerCase());
      const stillNoun = nextSelectedNames.includes("noun");

      return {
        ...prevData,
        partOfSpeechIds: nextIds,
        // Reset article to "No Article" when noun is no longer selected —
        // mirrors WordForm.jsx's create-word behavior.
        articleId: stillNoun ? prevData.articleId : "4",
      };
    });
  };

  const handleRemoveItem = async (field, index) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Remove",
    });

    if (result.isConfirmed) {
      setLoading(true);
      // Remove the item from the array
      const updatedArray = [...formData[field]];
      updatedArray.splice(index, 1);

      // Remove empty strings from the array
      const filteredArray = updatedArray.filter((item) => item.trim() !== "");

      const isRelationField = RELATION_FIELDS.includes(field);
      let updatedDetails = null;
      if (isRelationField) {
        updatedDetails = [...relationVariantDetails[field]];
        updatedDetails.splice(index, 1);
      }

      // Update the state
      setFormData((prev) => ({
        ...prev,
        [field]: filteredArray,
      }));
      if (isRelationField) {
        setRelationVariantDetails((prev) => ({
          ...prev,
          [field]: updatedDetails,
        }));
      }
      setSelectedItems((prev) => ({ ...prev, [field]: new Set() }));

      try {
        // Send the updated data to the backend
        const payload = isRelationField
          ? buildRelationIdPayload({
              [field]: { values: filteredArray, details: updatedDetails },
            })
          : buildUpdatePayload(field, filteredArray);
        await api.put(`/word/update/${formData.id}`, payload);

        Swal.fire({
          title: "Removed!",
          text: "The item has been removed successfully.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch {
        Swal.fire({
          title: "Error!",
          text: "Failed to update the backend. Please try again.",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleSelectItem = (field, index) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev[field]);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return { ...prev, [field]: newSet };
    });
  };

  const handleDeselectAll = (field) => {
    setSelectedItems((prev) => ({ ...prev, [field]: new Set() }));
  };

  const handleRemoveSelected = async (field) => {
    const indices = [...selectedItems[field]].sort((a, b) => b - a);
    if (indices.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${indices.length} item${indices.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      setLoading(true);
      const updatedArray = [...formData[field]];
      indices.forEach((idx) => updatedArray.splice(idx, 1));
      const filteredArray = updatedArray.filter((item) => item.trim() !== "");

      setFormData((prev) => ({ ...prev, [field]: filteredArray }));
      setSelectedItems((prev) => ({ ...prev, [field]: new Set() }));

      try {
        await api.put(
          `/word/update/${formData.id}`,
          buildUpdatePayload(field, filteredArray),
        );
        Swal.fire({
          title: "Removed!",
          text: `${indices.length} item${indices.length > 1 ? "s" : ""} removed.`,
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });
        setRefetchTrigger((prev) => prev + 1);
      } catch {
        Swal.fire({
          title: "Error!",
          text: "Failed to update. Please try again.",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearAllSentences = async () => {
    const result = await Swal.fire({
      title: "Clear all sentences?",
      text: 'Type "ok" (case insensitive) to confirm this action. This cannot be undone.',
      input: "text",
      inputPlaceholder: 'Type "ok" to confirm',
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Clear All",
      preConfirm: (value) => {
        if (value && value.toLowerCase() === "ok") {
          return true;
        } else {
          Swal.showValidationMessage('Please type "ok" to confirm');
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      setLoading(true);
      const emptyArray = [];

      // Update the state
      setFormData((prev) => ({
        ...prev,
        sentences: emptyArray,
      }));
      setSelectedItems((prev) => ({ ...prev, sentences: new Set() }));

      try {
        // Send the updated data to the backend
        await api.put(
          `/word/update/${formData.id}`,
          buildUpdatePayload("sentences", emptyArray),
        );

        Swal.fire({
          title: "Cleared!",
          text: "All sentences have been removed.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch {
        Swal.fire({
          title: "Error!",
          text: "Failed to update the backend. Please try again.",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearAllMeanings = async () => {
    const result = await Swal.fire({
      title: "Clear all meanings?",
      text: 'Type "ok" (case insensitive) to confirm this action. This cannot be undone.',
      input: "text",
      inputPlaceholder: 'Type "ok" to confirm',
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Clear All",
      preConfirm: (value) => {
        if (value && value.toLowerCase() === "ok") {
          return true;
        } else {
          Swal.showValidationMessage('Please type "ok" to confirm');
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      setLoading(true);
      const emptyArray = [];

      // Update the state
      setFormData((prev) => ({
        ...prev,
        meaning: emptyArray,
      }));
      setSelectedItems((prev) => ({ ...prev, meaning: new Set() }));

      try {
        // Send the updated data to the backend
        await api.put(
          `/word/update/${formData.id}`,
          buildUpdatePayload("meaning", emptyArray),
        );

        Swal.fire({
          title: "Cleared!",
          text: "All meanings have been removed.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch {
        Swal.fire({
          title: "Error!",
          text: "Failed to update the backend. Please try again.",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDirty) {
      Swal.fire({
        title: "Nothing to update",
        text: "You haven't changed anything yet.",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // Block submit while any new-relation chip still needs a manual POS pick.
    if (Object.keys(ambiguousChips).length > 0) {
      Swal.fire({
        title: "POS Selection Required",
        text: "Please select the part of speech for all related words with multiple meanings.",
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    // If the admin left an "add above/below" or inline "edit" box open with
    // unsaved text instead of clicking its own Add/Save button, fold it into
    // the payload here instead of silently dropping it — those two inline
    // actions normally save straight to the backend on their own, bypassing
    // this form's submit entirely, so anything left un-clicked in them never
    // reached formData before.
    let mergedFormData = formData;

    if (addingAt && newItemValue.trim()) {
      const itemsToInsert = normalizeInsertedItems(
        addingAt.field,
        newItemValue,
      );

      if (itemsToInsert.length > 0) {
        const updatedArray = [...mergedFormData[addingAt.field]];
        const insertIndex =
          addingAt.position === "above" ? addingAt.index : addingAt.index + 1;
        updatedArray.splice(insertIndex, 0, ...itemsToInsert);
        mergedFormData = { ...mergedFormData, [addingAt.field]: updatedArray };
      }
    }

    if (editingField && editValue.trim()) {
      const replacementItems = normalizeInsertedItems(
        editingField.type,
        editValue,
      );

      if (replacementItems.length > 0) {
        const updatedArray = [...mergedFormData[editingField.type]];
        updatedArray.splice(editingField.index, 1, ...replacementItems);
        mergedFormData = {
          ...mergedFormData,
          [editingField.type]: updatedArray,
        };
      }
    }

    if (mergedFormData !== formData) {
      setFormData(mergedFormData);
      setAddingAt(null);
      setNewItemValue("");
      setEditingField(null);
      setEditValue("");
    }

    if (mergedFormData.partOfSpeechIds.length === 0) {
      Swal.fire({
        title: "Part of Speech Required",
        text: "Please select at least one part of speech before saving.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    const selectedPosNames = partOfSpeeches
      .filter((p) => mergedFormData.partOfSpeechIds.includes(p.id))
      .map((p) => p.name.toLowerCase());
    const isNoun = selectedPosNames.includes("noun");
    const hasRealArticle =
      !!mergedFormData.articleId && Number(mergedFormData.articleId) !== 4;

    if (isNoun && !hasRealArticle) {
      Swal.fire({
        title: "Article Required",
        text: "Please select an article for this noun before saving.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    if (!isNoun && hasRealArticle) {
      Swal.fire({
        title: "Invalid Article Selection",
        text: "An article can only be set when the part of speech is Noun.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);
    setMessage("");

    // New relation words (synonym/antonym/similarWord) are added separately
    // after the update using /word/relation/add — chips already resolved
    // to a specific Word row (via the live per-chip resolution above) use
    // that id directly; unresolved chips (brand-new word text) fall back
    // to the value-based flow at submit time.

    // Collect specific variant IDs for multi-POS overridden relations so the
    // backend connects the exact variant instead of guessing by word value.
    const overriddenSynonymIds = Object.values(relPOSOverrides.synonym).map(
      (info) => Number(info.variantId),
    );
    const overriddenAntonymIds = Object.values(relPOSOverrides.antonym).map(
      (info) => Number(info.variantId),
    );
    const overriddenSimilarWordIds = Object.values(
      relPOSOverrides.similarWord,
    ).map((info) => Number(info.variantId));

    // Preserve the already-connected variant for every existing relation the
    // admin isn't explicitly re-picking this session. Without this, the
    // backend falls back to resolving these by plain value (see
    // batchUpsertRelatedWords), which picks whichever variant of that word
    // happens to have the lowest id — silently reconnecting a multi-POS
    // relation to the wrong variant on every unrelated save, not just once.
    // `addedIds` (this session's newly-resolved same-text-different-POS
    // additions, keyed separately from `savedIds` — see addedRelationIds
    // above) is merged in and deduped so a text appearing twice in
    // `values` doesn't produce duplicate ids, and both a pre-existing and
    // a freshly-added id for the same text both survive.
    const preservedIdsFor = (values, overrides, savedIds, addedIds) => {
      const fromSaved = values
        .filter((v) => !overrides[v] && savedIds[v] !== undefined)
        .map((v) => savedIds[v]);
      const fromAdded = values.flatMap((v) => addedIds[v] || []);
      return [...new Set([...fromSaved, ...fromAdded])];
    };

    const preservedSynonymIds = preservedIdsFor(
      mergedFormData.synonyms,
      relPOSOverrides.synonym,
      currentRelationIds.synonym,
      addedRelationIds.synonym,
    );
    const preservedAntonymIds = preservedIdsFor(
      mergedFormData.antonyms,
      relPOSOverrides.antonym,
      currentRelationIds.antonym,
      addedRelationIds.antonym,
    );
    const preservedSimilarWordIds = preservedIdsFor(
      mergedFormData.similarWords,
      relPOSOverrides.similarWord,
      currentRelationIds.similarWord,
      addedRelationIds.similarWord,
    );

    const synonymIds = [...overriddenSynonymIds, ...preservedSynonymIds];
    const antonymIds = [...overriddenAntonymIds, ...preservedAntonymIds];
    const similarWordIds = [
      ...overriddenSimilarWordIds,
      ...preservedSimilarWordIds,
    ];

    const dataToSend = {
      ...mergedFormData,

      meaning: mergedFormData.meaning.concat(
        normalizeFieldItems("meaning", inputData.meaning),
      ),
      sentences: mergedFormData.sentences.concat(
        normalizeSentenceItems(inputData.sentences),
      ),
      // Only genuinely unresolved values (no known current id, not
      // explicitly overridden this session, and not already resolved via
      // the new-chip add flow) go through the backend's value-based
      // lookup — everything else is sent as an explicit id via
      // synonymIds/antonymIds/similarWordIds above.
      synonyms: mergedFormData.synonyms.filter(
        (s) =>
          !relPOSOverrides.synonym[s] &&
          currentRelationIds.synonym[s] === undefined &&
          !(addedRelationIds.synonym[s]?.length > 0),
      ),
      antonyms: mergedFormData.antonyms.filter(
        (s) =>
          !relPOSOverrides.antonym[s] &&
          currentRelationIds.antonym[s] === undefined &&
          !(addedRelationIds.antonym[s]?.length > 0),
      ),
      similarWords: mergedFormData.similarWords.filter(
        (s) =>
          !relPOSOverrides.similarWord[s] &&
          currentRelationIds.similarWord[s] === undefined &&
          !(addedRelationIds.similarWord[s]?.length > 0),
      ),
      ...(synonymIds.length > 0 && { synonymIds }),
      ...(antonymIds.length > 0 && { antonymIds }),
      ...(similarWordIds.length > 0 && { similarWordIds }),
    };

    // Filter verbAttributes to only include non-default values
    const defaults = {
      conjugation: "REGULAR",
      isReflexive: false,
      isModal: false,
      prefixType: "NONE",
      caseRequirement: null,
    };

    const verbAttributes = {};
    Object.keys(formData.verbAttributes).forEach((key) => {
      if (formData.verbAttributes[key] !== defaults[key]) {
        verbAttributes[key] = formData.verbAttributes[key];
      }
    });

    // Only include verbAttributes if it has non-default values
    if (Object.keys(verbAttributes).length > 0) {
      dataToSend.verbAttributes = verbAttributes;
    } else {
      dataToSend.verbAttributes = null;
    }

    // Remove prepositionAttributes from dataToSend (backend expects prepositionCase directly)
    delete dataToSend.prepositionAttributes;

    // Remove display-only objects that backend doesn't need
    delete dataToSend.level;
    delete dataToSend.topic;
    delete dataToSend.article;
    delete dataToSend.partsOfSpeech;

    // Add prepositionCase directly to dataToSend
    dataToSend.prepositionCase = formData.prepositionAttributes.prepositionCase;

    // Add prefix directly to dataToSend
    dataToSend.prefix =
      formData.prefix && formData.prefix.trim() ? formData.prefix.trim() : null;

    // Add isPrepositional directly to dataToSend
    dataToSend.isPrepositional = formData.isPrepositional;

    // Add isShortForm directly to dataToSend
    dataToSend.isShortForm = formData.isShortForm;

    // Validate prefix matches the word if it's a separable verb
    if (
      formData.verbAttributes.prefixType === "SEPARABLE" &&
      dataToSend.prefix &&
      dataToSend.prefix.trim()
    ) {
      const wordValue = dataToSend.value.toLowerCase();
      const prefixValue = dataToSend.prefix.toLowerCase();

      // Split the word into parts to handle multi-part verbs like "über etwas hinausdenken"
      const parts = wordValue.split(" ");
      let foundMatch = false;

      // Check if any part (excluding "sich") starts with the prefix
      for (const part of parts) {
        if (part === "sich") continue; // Skip "sich"

        if (part.startsWith(prefixValue)) {
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        setLoading(false);
        await Swal.fire({
          title: "Invalid Prefix",
          text: `The prefix "${dataToSend.prefix}" doesn't match any part of the word "${dataToSend.value}". Please enter a valid prefix.`,
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
    }

    // Build relations for the self-reference check, excluding saved same-value entries
    // that are known multi-POS variants (different POS, same word value — not a real self-reference).
    const wordNorm = normalizeWordValue(dataToSend.value);
    const filterKnownMultiPOS = (arr, savedIds) =>
      (arr || []).filter(
        (v) =>
          normalizeWordValue(v) !== wordNorm ||
          !(normalizeWordValue(v) in savedIds),
      );
    const relationsForSelfRefCheck = {
      synonyms: filterKnownMultiPOS(
        dataToSend.synonyms,
        currentRelationIds.synonym,
      ),
      antonyms: filterKnownMultiPOS(
        dataToSend.antonyms,
        currentRelationIds.antonym,
      ),
      similarWords: filterKnownMultiPOS(
        dataToSend.similarWords,
        currentRelationIds.similarWord,
      ),
    };

    const selfReferenceMessage = getSelfReferenceMessage(
      dataToSend.value,
      relationsForSelfRefCheck,
    );

    if (selfReferenceMessage) {
      setLoading(false);
      await showSelfReferenceAlert(selfReferenceMessage);
      return;
    }

    // Validate relation words (only the new ones from input). Chips already
    // resolved to a specific Word row are excluded from the value-level
    // self-reference check below — a resolved chip's id was already
    // checked against formData.id at resolution time (see the per-chip
    // effect and resolveChipPOS above).
    const unresolvedTextOf = (chips) =>
      chips.filter((c) => c.wordId === null).map((c) => c.value);
    const newRelationWords = {
      synonyms: inputData.synonyms.map((c) => c.value),
      antonyms: inputData.antonyms.map((c) => c.value),
      similarWords: inputData.similarWords.map((c) => c.value),
    };
    const singlePOSNewRelations = {
      synonyms: unresolvedTextOf(inputData.synonyms),
      antonyms: unresolvedTextOf(inputData.antonyms),
      similarWords: unresolvedTextOf(inputData.similarWords),
    };
    const newRelationSelfRefMessage = getSelfReferenceMessage(
      dataToSend.value,
      singlePOSNewRelations,
    );
    if (newRelationSelfRefMessage) {
      setLoading(false);
      await showSelfReferenceAlert(newRelationSelfRefMessage);
      return;
    }

    // Only validate if there are new relation words to add
    const hasNewRelationWords =
      newRelationWords.synonyms.length > 0 ||
      newRelationWords.antonyms.length > 0 ||
      newRelationWords.similarWords.length > 0;

    if (hasNewRelationWords) {
      const validation = await validateRelationWords(newRelationWords);

      if (!validation.valid) {
        setLoading(false);
        return; // User cancelled the operation
      }
    }

    // Validate that no POS override for existing relations points to the word itself.
    const overrideEntries = [
      ...Object.entries(relPOSOverrides.synonym).map(([word, info]) => ({
        word,
        info,
        relationType: "synonym",
      })),
      ...Object.entries(relPOSOverrides.antonym).map(([word, info]) => ({
        word,
        info,
        relationType: "antonym",
      })),
      ...Object.entries(relPOSOverrides.similarWord).map(([word, info]) => ({
        word,
        info,
        relationType: "similar word",
      })),
    ];
    const selfRefOverride = overrideEntries.find(
      ({ info }) => Number(info.variantId) === Number(formData.id),
    );
    if (selfRefOverride) {
      setRelPOSOverrides((prev) => {
        const relType = selfRefOverride.relationType.replace(" ", "");
        const updated = { ...prev[relType] };
        delete updated[selfRefOverride.word];
        return { ...prev, [relType]: updated };
      });
      setLoading(false);
      await showSelfReferenceAlert(
        `A word cannot reference itself as a ${selfRefOverride.relationType}. Please select a different part of speech.`,
      );
      return;
    }

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this word?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      // setLoading(true) ran well before this prompt — without resetting it
      // here, cancelling (or dismissing via Escape/backdrop click) left the
      // Update button permanently disabled until a full page reload, since
      // the only setLoading(false) lived in this block's own finally.
      setLoading(false);
      return;
    }

    if (result.isConfirmed) {
      try {
        const response = await api.put(
          `/word/update/${formData.id}`,
          dataToSend,
        );
        setMessage(response.data.message);

        // Add new relation words. Chips already resolved (live, while they
        // were being added — see the per-chip effect above) use that id
        // directly; a chip somehow still unresolved here (e.g. resolution
        // was still in flight) gets a fallback fetch+prompt.
        const addRelation = async (chip, relationType) => {
          let selectedVariant = null;

          if (chip.wordId !== null) {
            selectedVariant = { id: chip.wordId };
          } else {
            const variants = await fetchWordVariants(chip.value);
            selectedVariant =
              variants.length <= 1
                ? variants[0] || null
                : await showPOSSelectionPopup(
                    `${chip.value} (${relationType})`,
                    variants,
                    null,
                    Number(formData.id),
                  );
          }

          if (selectedVariant?.id) {
            if (Number(selectedVariant.id) === Number(formData.id)) {
              await Swal.fire({
                title: "Invalid relation",
                text: `A word cannot reference itself as a ${relationType}.`,
                icon: "warning",
                timer: 2200,
                showConfirmButton: false,
              });
              return;
            }
            await api.post("/word/relation/add", {
              wordId: formData.id,
              relatedWordId: selectedVariant.id,
              relationType,
            });
          }
        };

        for (const chip of inputData.synonyms)
          await addRelation(chip, "synonym");
        for (const chip of inputData.antonyms)
          await addRelation(chip, "antonym");
        for (const chip of inputData.similarWords)
          await addRelation(chip, "similarWord");

        setInputData({
          meaning: "",
          sentences: "",
          synonyms: [],
          antonyms: [],
          similarWords: [],
        });
        setAmbiguousChips({});
        processedChipKeysRef.current.clear();
        setAddedRelationIds({ synonym: {}, antonym: {}, similarWord: {} });
        setRelPOSOverrides({ synonym: {}, antonym: {}, similarWord: {} });

        // Clear the word list cache after successful update
        await invalidateWordsCache();

        // Show SweetAlert success message
        await Swal.fire({
          title: "Updated!",
          text: "The word has been updated successfully.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to update the word.";

        // The "word already exists as X" duplicate-POS message needs to stay
        // on screen and name what to change — an auto-dismissing toast isn't
        // enough time to read and act on it.
        const isDuplicatePosError = errorMessage.includes("already exists as");

        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
          ...(isDuplicatePosError
            ? { confirmButtonText: "OK" }
            : { timer: 2000, showConfirmButton: false }),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async (field, index) => {
    const replacementItems = normalizeInsertedItems(field, editValue);

    if (replacementItems.length === 0) {
      return;
    }

    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1, ...replacementItems);

    if (RELATION_FIELDS.includes(field)) {
      const selfReferenceMessage = getSelfReferenceMessage(formData.value, {
        [field]: updatedArray,
      });

      if (selfReferenceMessage) {
        await showSelfReferenceAlert(selfReferenceMessage);
        return;
      }

      // Validate that the words exist if they are relation fields
      const isValid = await validateSingleRelationField(
        replacementItems,
        field,
      );
      if (!isValid) {
        return; // User cancelled the operation
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));

    try {
      await api.put(
        `/word/update/${formData.id}`,
        buildUpdatePayload(field, updatedArray),
      );

      Swal.fire({
        title: "Updated!",
        text: "The item has been edited successfully.",
        timer: 800,
        showConfirmButton: false,
        icon: "success",
      });

      // Trigger refetch by incrementing counter
      setRefetchTrigger((prev) => prev + 1);
    } catch {
      Swal.fire({
        title: "Error!",
        text: "Failed to update. Please try again.",
        icon: "error",
      });
    } finally {
      setEditingField(null);
      setEditValue("");
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const selectedPosNames = partOfSpeeches
    .filter((p) => formData.partOfSpeechIds.includes(p.id))
    .map((p) => p.name.toLowerCase());
  const isNounSelected = selectedPosNames.includes("noun");
  const isPhraseOrUnknownSelected = selectedPosNames.some((name) =>
    EXCLUSIVE_PART_OF_SPEECH_NAMES.includes(name),
  );

  // Whether there's actually anything for Update to save — either a real
  // change to formData, unsaved text sitting in one of the quick-add inputs
  // (meaning/sentences/synonyms/antonyms/similarWords), or an open "add
  // above/below"/inline-edit box with unsaved text. Without this, Update
  // stayed clickable and re-submitted identical data every time.
  const hasPendingQuickAdd = Boolean(
    inputData.meaning.trim() ||
      inputData.sentences.trim() ||
      inputData.synonyms.length > 0 ||
      inputData.antonyms.length > 0 ||
      inputData.similarWords.length > 0,
  );
  const hasPendingInlineEdit = Boolean(
    (addingAt && newItemValue.trim()) || (editingField && editValue.trim()),
  );
  const isDirty =
    hasPendingQuickAdd ||
    hasPendingInlineEdit ||
    (initialFormData !== null &&
      JSON.stringify(formData) !== JSON.stringify(initialFormData));

  // Read-only POS label for one existing-relation row, by index — safe for
  // duplicate-text rows (unlike multiPOSExisting/relPOSOverrides, which
  // are keyed by text and can't tell two "kühler" rows apart). Falls back
  // to no label rather than a wrong one if the row was just added/removed/
  // reordered locally and the matching refetch hasn't landed yet.
  const getRelationPOSLabel = (field, index, item) => {
    const detail = relationVariantDetails[field]?.[index];
    if (!detail || detail.value !== item) {
      return null;
    }
    return detail.partsOfSpeech?.length > 0
      ? detail.partsOfSpeech.map((p) => p.name).join(", ")
      : null;
  };

  return (
    <Container>
      <h2 className="text-3xl font-semibold mb-6 text-center mt-8 text-white">
        Update
      </h2>

      {initialLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      ) : (
        <>
          {message && (
            <p className="mb-4 text-green-600 text-center">{message}</p>
          )}
          <form onSubmit={handleSubmit} className="w-full ">
            <span className="flex justify-end w-full md:w-10/12">
              <Link to="/" className="btn btn-sm btn-error ">
                Cancel
              </Link>
            </span>
            <div className="w-full md:w-8/12 mx-auto mb-4 ">
              {/* <label className="block   text-cyan-600 ">
                {" "}
                <span className="font-medium text-2xl "> Word</span>
              </label> */}

              <input
                key={`word-value-${formData.id}`}
                type="text"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="w-full text-4xl font-semibold p-3 border-2 border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 capitalize text-slate-950"
                placeholder="Enter the word"
              />
            </div>
            <div className="w-full  flex flex-col md:flex-row lg:flex-row justify-center items-center mt-8  ">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-center items-start  gap-4 w-full md:w-8/12 p-1  md:p-8 lg:p-8 rounded-lg bg-stone-800">
                {/* Meanings Section */}
                <div className="w-full">
                  <div className="sticky top-16 z-10 -mx-1 mb-2 space-y-2 bg-stone-800 px-1 py-2">
                    <label
                      htmlFor="update-meaning-input"
                      className="block text-white"
                    >
                      <span className="font-medium text-lg"> Meaning</span> (for
                      multiple input use comma)
                    </label>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {selectedItems.meaning.size > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeselectAll("meaning")}
                            disabled={loading}
                            className="btn btn-sm border border-slate-500 bg-slate-700 text-white hover:bg-slate-600"
                          >
                            Deselect All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelected("meaning")}
                            disabled={loading}
                            className="btn btn-warning btn-sm"
                          >
                            Delete Selected ({selectedItems.meaning.size})
                          </button>
                        </>
                      )}
                      {formData.meaning.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllMeanings}
                          disabled={loading}
                          className="btn btn-error btn-sm"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id="update-meaning-input"
                    type="text"
                    name="meaning"
                    value={inputData.meaning}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter meanings"
                  />
                  <div className="mt-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formData.meaning.map(
                          (_, index) => `meaning-${index}`,
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        {formData.meaning.map((item, index) => (
                          <div key={index}>
                            {addingAt?.field === "meaning" &&
                              addingAt?.position === "above" &&
                              addingAt?.index === index && (
                                <div className="flex gap-2 mt-2 mb-2 p-2 bg-green-100 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="Add above..."
                                    value={newItemValue}
                                    onChange={(e) =>
                                      setNewItemValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddItem(
                                          "meaning",
                                          addingAt.index,
                                          "above",
                                        );
                                      }
                                    }}
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddItem(
                                        "meaning",
                                        addingAt.index,
                                        "above",
                                      )
                                    }
                                    className="btn btn-sm btn-success"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingAt(null);
                                      setNewItemValue("");
                                    }}
                                    className="btn btn-sm btn-ghost"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            <DraggableItem
                              key={`item-${index}`}
                              id={`meaning-${index}`}
                              item={item}
                              index={index}
                              field="meaning"
                              editingField={editingField}
                              editValue={editValue}
                              onEdit={(field, idx, val) => {
                                setEditingField({ type: field, index: idx });
                                setEditValue(val);
                              }}
                              onRemove={handleRemoveItem}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={() => setEditingField(null)}
                              setEditValue={setEditValue}
                              onAddAbove={(field, idx) =>
                                setAddingAt({
                                  field,
                                  index: idx,
                                  position: "above",
                                })
                              }
                              onAddBelow={(field, idx) =>
                                setAddingAt({
                                  field,
                                  index: idx,
                                  position: "below",
                                })
                              }
                              isSelected={selectedItems.meaning.has(index)}
                              onToggleSelect={(idx) => handleToggleSelectItem("meaning", idx)}
                            />
                            {addingAt?.field === "meaning" &&
                              addingAt?.position === "below" &&
                              addingAt?.index === index && (
                                <div className="flex gap-2 mt-2 mb-2 p-2 bg-green-100 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="Add below..."
                                    value={newItemValue}
                                    onChange={(e) =>
                                      setNewItemValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddItem(
                                          "meaning",
                                          addingAt.index,
                                          "below",
                                        );
                                      }
                                    }}
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddItem(
                                        "meaning",
                                        addingAt.index,
                                        "below",
                                      )
                                    }
                                    className="btn btn-sm btn-success"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingAt(null);
                                      setNewItemValue("");
                                    }}
                                    className="btn btn-sm btn-ghost"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                          </div>
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                {/* Sentences Section */}
                <div>
                  <div className="sticky top-16 z-10 -mx-1 mb-2 space-y-2 bg-stone-800 px-1 py-2">
                    <label
                      htmlFor="update-sentences-input"
                      className="block text-white"
                    >
                      <span className="font-medium text-lg">Sentences</span>{" "}
                      (for multiple input use "|". eg. sentence A. | Sentence
                      B.)
                    </label>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 font-mono font-semibold text-orange-400">
                          ##
                        </span>
                        Header
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono font-semibold text-indigo-400">
                          --
                        </span>
                        Sub-header (under a ## above it)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="rounded bg-purple-500/15 px-1.5 py-0.5 font-mono font-semibold text-purple-400">
                          **text**
                        </span>
                        Note / bullet
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {selectedItems.sentences.size > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeselectAll("sentences")}
                            disabled={loading}
                            className="btn btn-sm border border-slate-500 bg-slate-700 text-white hover:bg-slate-600"
                          >
                            Deselect All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelected("sentences")}
                            disabled={loading}
                            className="btn btn-warning btn-sm"
                          >
                            Delete Selected ({selectedItems.sentences.size})
                          </button>
                        </>
                      )}
                      {formData.sentences.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllSentences}
                          disabled={loading}
                          className="btn btn-error btn-sm"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id="update-sentences-input"
                    type="text"
                    name="sentences"
                    value={inputData.sentences}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sentence A. SentenceB."
                  />
                  <div className="mt-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formData.sentences.map(
                          (_, index) => `sentences-${index}`,
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        {formData.sentences.map((item, index) => (
                          <div key={index}>
                            {addingAt?.field === "sentences" &&
                              addingAt?.position === "above" &&
                              addingAt?.index === index && (
                                <div className="flex gap-2 mt-2 mb-2 p-2 bg-green-100 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="Add above..."
                                    value={newItemValue}
                                    onChange={(e) =>
                                      setNewItemValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddItem(
                                          "sentences",
                                          addingAt.index,
                                          "above",
                                        );
                                      }
                                    }}
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddItem(
                                        "sentences",
                                        addingAt.index,
                                        "above",
                                      )
                                    }
                                    className="btn btn-sm btn-success"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingAt(null);
                                      setNewItemValue("");
                                    }}
                                    className="btn btn-sm btn-ghost"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            <DraggableItem
                              key={`item-${index}`}
                              id={`sentences-${index}`}
                              item={item}
                              index={index}
                              field="sentences"
                              editingField={editingField}
                              editValue={editValue}
                              onEdit={(field, idx, val) => {
                                setEditingField({ type: field, index: idx });
                                setEditValue(val);
                              }}
                              onRemove={handleRemoveItem}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={() => setEditingField(null)}
                              setEditValue={setEditValue}
                              onAddAbove={(field, idx) =>
                                setAddingAt({
                                  field,
                                  index: idx,
                                  position: "above",
                                })
                              }
                              onAddBelow={(field, idx) =>
                                setAddingAt({
                                  field,
                                  index: idx,
                                  position: "below",
                                })
                              }
                              isSelected={selectedItems.sentences.has(index)}
                              onToggleSelect={(idx) => handleToggleSelectItem("sentences", idx)}
                            />
                            {addingAt?.field === "sentences" &&
                              addingAt?.position === "below" &&
                              addingAt?.index === index && (
                                <div className="flex gap-2 mt-2 mb-2 p-2 bg-green-100 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="Add below..."
                                    value={newItemValue}
                                    onChange={(e) =>
                                      setNewItemValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddItem(
                                          "sentences",
                                          addingAt.index,
                                          "below",
                                        );
                                      }
                                    }}
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddItem(
                                        "sentences",
                                        addingAt.index,
                                        "below",
                                      )
                                    }
                                    className="btn btn-sm btn-success"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingAt(null);
                                      setNewItemValue("");
                                    }}
                                    className="btn btn-sm btn-ghost"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                          </div>
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="update-pluralForm"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Plural Form</span>
                  </label>
                  <input
                    id="update-pluralForm"
                    type="text"
                    name="pluralForm"
                    value={formData.pluralForm}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter plural form"
                  />
                </div>

                {/* Short Form Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isShortForm"
                    name="isShortForm"
                    checked={formData.isShortForm}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isShortForm"
                    className="text-sm font-medium text-white"
                  >
                    Short Form / Abbreviation (e.g., AKW, USA) — shows in ALL
                    CAPS
                  </label>
                </div>

                {/* Synonyms Section */}
                <div>
                  <label
                    htmlFor="update-synonyms"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Synonyms</span> (for
                    multiple input use comma)
                  </label>
                  <RelationTagInput
                    id="update-synonyms"
                    currentWordId={formData.id}
                    currentWordValue={formData.value}
                    alreadyLinkedIds={relationVariantDetails.synonyms.map(
                      (d) => d.id,
                    )}
                    values={inputData.synonyms}
                    onChange={(next) =>
                      handleRelationChipsChange("synonyms", next)
                    }
                    placeholder="Type a synonym and press comma…"
                  />
                  {Object.entries(ambiguousChips)
                    .filter(([, w]) => w.relationType === "synonym")
                    .map(([chipKey, w]) => (
                      <button
                        key={chipKey}
                        type="button"
                        onClick={() => resolveChipPOS(chipKey)}
                        className="mt-2 mr-2 px-3 py-1 text-sm rounded bg-orange-500 text-white"
                      >
                        {`Select POS for "${w.value}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.synonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>
                          {item}
                          {getRelationPOSLabel("synonyms", index, item) && (
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                              (
                              {getRelationPOSLabel("synonyms", index, item)}
                              )
                            </span>
                          )}
                        </li>
                        <div className="flex gap-2">
                          {multiPOSExisting.synonym.has(item) &&
                            formData.synonyms.filter((v) => v === item)
                              .length === 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "synonym")
                              }
                              className={`btn btn-sm ${relPOSOverrides.synonym[item] ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}
                            >
                              {relPOSOverrides.synonym[item] ? (
                                <span className="inline-flex items-center gap-1">
                                  <IoCheckmark aria-hidden="true" />
                                  {relPOSOverrides.synonym[item].partOfSpeechName}
                                </span>
                              ) : currentRelationPOSNames.synonym[item] ? (
                                currentRelationPOSNames.synonym[item]
                              ) : (
                                "Select POS"
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem("synonyms", index)}
                            className="btn btn-sm btn-error"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Antonyms Section */}
                <div>
                  <label
                    htmlFor="update-antonyms"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Antonyms</span> (for
                    multiple input use comma)
                  </label>

                  <RelationTagInput
                    id="update-antonyms"
                    currentWordId={formData.id}
                    currentWordValue={formData.value}
                    alreadyLinkedIds={relationVariantDetails.antonyms.map(
                      (d) => d.id,
                    )}
                    values={inputData.antonyms}
                    onChange={(next) =>
                      handleRelationChipsChange("antonyms", next)
                    }
                    placeholder="Type an antonym and press comma…"
                  />
                  {Object.entries(ambiguousChips)
                    .filter(([, w]) => w.relationType === "antonym")
                    .map(([chipKey, w]) => (
                      <button
                        key={chipKey}
                        type="button"
                        onClick={() => resolveChipPOS(chipKey)}
                        className="mt-2 mr-2 px-3 py-1 text-sm rounded bg-orange-500 text-white"
                      >
                        {`Select POS for "${w.value}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.antonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>
                          {item}
                          {getRelationPOSLabel("antonyms", index, item) && (
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                              (
                              {getRelationPOSLabel("antonyms", index, item)}
                              )
                            </span>
                          )}
                        </li>
                        <div className="flex gap-2">
                          {multiPOSExisting.antonym.has(item) &&
                            formData.antonyms.filter((v) => v === item)
                              .length === 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "antonym")
                              }
                              className={`btn btn-sm ${relPOSOverrides.antonym[item] ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}
                            >
                              {relPOSOverrides.antonym[item] ? (
                                <span className="inline-flex items-center gap-1">
                                  <IoCheckmark aria-hidden="true" />
                                  {relPOSOverrides.antonym[item].partOfSpeechName}
                                </span>
                              ) : currentRelationPOSNames.antonym[item] ? (
                                currentRelationPOSNames.antonym[item]
                              ) : (
                                "Select POS"
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem("antonyms", index)}
                            className="btn btn-sm btn-error"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Words Section */}
                <div>
                  <label
                    htmlFor="update-similarWords"
                    className="block mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Word to Watch</span>{" "}
                    (for multiple input use comma)
                  </label>

                  <RelationTagInput
                    id="update-similarWords"
                    currentWordId={formData.id}
                    currentWordValue={formData.value}
                    alreadyLinkedIds={relationVariantDetails.similarWords.map(
                      (d) => d.id,
                    )}
                    values={inputData.similarWords}
                    onChange={(next) =>
                      handleRelationChipsChange("similarWords", next)
                    }
                    placeholder="Type a word and press comma…"
                  />
                  {Object.entries(ambiguousChips)
                    .filter(([, w]) => w.relationType === "similarWord")
                    .map(([chipKey, w]) => (
                      <button
                        key={chipKey}
                        type="button"
                        onClick={() => resolveChipPOS(chipKey)}
                        className="mt-2 mr-2 px-3 py-1 text-sm rounded bg-orange-500 text-white"
                      >
                        {`Select POS for "${w.value}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.similarWords.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>
                          {item}
                          {getRelationPOSLabel("similarWords", index, item) && (
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                              (
                              {getRelationPOSLabel(
                                "similarWords",
                                index,
                                item,
                              )}
                              )
                            </span>
                          )}
                        </li>
                        <div className="flex gap-2">
                          {multiPOSExisting.similarWord.has(item) &&
                            formData.similarWords.filter((v) => v === item)
                              .length === 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "similarWord")
                              }
                              className={`btn btn-sm  ${relPOSOverrides.similarWord[item] ? "btn-success" : "btn-info"}`}
                            >
                              {relPOSOverrides.similarWord[item] ? (
                                <span className="inline-flex items-center gap-1">
                                  <IoCheckmark aria-hidden="true" />
                                  {relPOSOverrides.similarWord[item].partOfSpeechName}
                                </span>
                              ) : currentRelationPOSNames.similarWord[item] ? (
                                currentRelationPOSNames.similarWord[item]
                              ) : (
                                "Select POS"
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem("similarWords", index)
                            }
                            className="btn btn-sm btn-error"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Level Dropdown */}
                <div>
                  <label
                    htmlFor="update-levelId"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Level</span>
                  </label>
                  <select
                    id="update-levelId"
                    name="levelId"
                    value={formData.levelId || "1"}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Select" disabled>
                      Select
                    </option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Dropdown */}
                <div>
                  <label
                    htmlFor="update-topicId"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg">Topic</span>
                  </label>
                  <select
                    id="update-topicId"
                    name="topicId"
                    value={formData.topicId || "1"}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Select" disabled>
                      Select
                    </option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Article Dropdown — only relevant for nouns */}
                <div>
                  <label
                    htmlFor="update-articleId"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg">Article</span>
                    {!isNounSelected && (
                      <span className="ml-2 text-sm font-normal text-gray-400">
                        (only for nouns)
                      </span>
                    )}
                  </label>
                  <select
                    id="update-articleId"
                    name="articleId"
                    value={formData.articleId || "4"}
                    onChange={handleInputChange}
                    disabled={!isNounSelected}
                    className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isNounSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="Select" disabled>
                      Select
                    </option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Part of Speech — multi-select checkboxes */}
                <div>
                  <p className="block mb-2 text-white">
                    <span className="font-medium text-lg">
                      Part(s) of Speech
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    Select one or more (e.g. Adjective + Adverb). Phrase and
                    Unknown can't be combined with anything else.
                  </p>
                  <div
                    role="group"
                    aria-label="Parts of speech"
                    className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-gray-300 bg-white"
                  >
                    {partOfSpeeches.map((pos) => {
                      const isChecked = formData.partOfSpeechIds.includes(
                        pos.id,
                      );
                      const isExclusive =
                        EXCLUSIVE_PART_OF_SPEECH_NAMES.includes(
                          pos.name.toLowerCase(),
                        );
                      const disabled =
                        !isChecked &&
                        ((isPhraseOrUnknownSelected && !isExclusive) ||
                          (isExclusive &&
                            formData.partOfSpeechIds.length > 0));

                      return (
                        <label
                          key={pos.id}
                          className={`flex items-center gap-2 text-sm ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            id={`pos-${pos.id}`}
                            name="partOfSpeechIds"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => togglePartOfSpeech(pos)}
                            className="h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
                          />
                          {capitalizePartOfSpeechName(pos.name)}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Verb Attributes - shown when verb is among the selected POS */}
                {selectedPosNames.includes("verb") && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      Verb Attributes
                    </h3>

                    {/* Conjugation Type */}
                    <div>
                      <label
                        htmlFor="verbAttributes-conjugation"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Conjugation Type
                      </label>
                      <select
                        id="verbAttributes-conjugation"
                        name="verbAttributes.conjugation"
                        value={formData.verbAttributes.conjugation}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="REGULAR">Regular (weak)</option>
                        <option value="IRREGULAR">Irregular (strong)</option>
                      </select>
                    </div>

                    {/* Prefix Type */}
                    <div>
                      <label
                        htmlFor="verbAttributes-prefixType"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Prefix Type
                      </label>
                      <select
                        id="verbAttributes-prefixType"
                        name="verbAttributes.prefixType"
                        value={formData.verbAttributes.prefixType}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NONE">No Prefix</option>
                        <option value="SEPARABLE">
                          Separable (e.g., aufstehen, ankommen)
                        </option>
                        <option value="INSEPARABLE">
                          Inseparable (e.g., verstehen, bekommen)
                        </option>
                      </select>
                    </div>

                    {/* Separable Prefix Input - Only shown for separable verbs */}
                    {formData.verbAttributes.prefixType === "SEPARABLE" && (
                      <div>
                        <label
                          htmlFor="prefix"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Separable Prefix{" "}
                          <span className="text-xs text-gray-500">
                            (e.g., "auf" for aufstehen, "aus" for ausgeben)
                          </span>
                        </label>
                        <input
                          type="text"
                          id="prefix"
                          name="prefix"
                          value={formData.prefix || ""}
                          onChange={handleInputChange}
                          placeholder="Enter prefix"
                          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          The prefix will be highlighted in orange when
                          displaying the word
                        </p>
                      </div>
                    )}

                    {/* Case Requirement */}
                    <div>
                      <label
                        htmlFor="verbAttributes-caseRequirement"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Case Type
                      </label>
                      <select
                        id="verbAttributes-caseRequirement"
                        name="verbAttributes.caseRequirement"
                        value={formData.verbAttributes.caseRequirement || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not specified</option>
                        <option value="ACCUSATIVE">
                          Accusative (Akkusativ)
                        </option>
                        <option value="DATIVE">Dative (Dativ)</option>
                        <option value="GENITIVE">Genitive (Genitiv)</option>
                        <option value="PREPOSITIONAL">Prepositional</option>
                      </select>
                    </div>

                    {/* Reflexive Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="verbAttributes-isReflexive"
                        name="verbAttributes.isReflexive"
                        checked={formData.verbAttributes.isReflexive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="verbAttributes-isReflexive"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Reflexive Verb (e.g., sich erinnern)
                      </label>
                    </div>

                    {/* Modal Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="verbAttributes-isModal"
                        name="verbAttributes.isModal"
                        checked={formData.verbAttributes.isModal}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="verbAttributes-isModal"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Modal Verb (e.g., können, müssen)
                      </label>
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      ℹ️ Note: Modal verbs cannot be Reflexive or have
                      Separable/Inseparable prefixes. All other combinations are
                      allowed.
                    </p>
                  </div>
                )}

                {/* Preposition Attributes - shown when preposition is among the selected POS */}
                {selectedPosNames.includes("preposition") && (
                  <div className="space-y-4 p-4 bg-purple-50 dark:bg-slate-800 rounded-lg border-2 border-purple-200 dark:border-purple-600">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 dark:text-purple-300">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      Preposition Attributes
                    </h3>

                    {/* Preposition Case */}
                    <div>
                      <label
                        htmlFor="prepositionAttributes-prepositionCase"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Case Requirement
                      </label>
                      <select
                        id="prepositionAttributes-prepositionCase"
                        name="prepositionAttributes.prepositionCase"
                        value={
                          formData.prepositionAttributes.prepositionCase || ""
                        }
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Not specified</option>
                        <option value="ACCUSATIVE">
                          Accusative (e.g., durch, für, gegen, ohne)
                        </option>
                        <option value="DATIVE">
                          Dative (e.g., aus, bei, mit, nach)
                        </option>
                        <option value="GENITIVE">
                          Genitive (e.g., während, wegen, trotz)
                        </option>
                        <option value="WECHSEL">
                          Changeable (Accusative/Dative)
                        </option>
                      </select>
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      ℹ️ Note: Wechsel prepositions can take Accusative (motion)
                      or Dative (location) depending on context.
                    </p>
                  </div>
                )}

                {/* Adjective Attributes - shown when adjective is among the selected POS */}
                {selectedPosNames.includes("adjective") && (
                  <div className="space-y-4 p-4 bg-yellow-50 dark:bg-slate-800 rounded-lg border-2 border-yellow-200 dark:border-yellow-600">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      Adjective Attributes
                    </h3>

                    {/* Prepositional Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrepositional"
                        name="isPrepositional"
                        checked={formData.isPrepositional}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPrepositional"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Prepositional Adjective (e.g., abhängig von,
                        interessiert an)
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                      ℹ️ Check this box for adjectives that require a specific
                      preposition. Include the preposition in the word field
                      (e.g., "abhängig von", "interessiert an")
                    </p>
                  </div>
                )}

                {/* </div> */}
              </div>
            </div>
            {/* Submit Button */}
            <div className="text-center mt-6 mb-24 w-full p-1">
              <button
                type="submit"
                disabled={loading}
                aria-disabled={!isDirty}
                className={`btn w-full md:w-8/12 lg:w-8/12 disabled:cursor-not-allowed disabled:opacity-100 ${
                  isDirty
                    ? "btn-primary"
                    : "cursor-not-allowed border-slate-500 bg-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-600"
                }`}
              >
                Update
              </button>
            </div>
          </form>
        </>
      )}
    </Container>
  );
};

export default UpdateWord;
