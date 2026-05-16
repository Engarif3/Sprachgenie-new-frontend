import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import Container from "../../../utils/Container";
import api, { publicApi } from "../../../axios";
import { useAuth } from "../../../services/auth.services";
import { invalidateWordsCache } from "../../../utils/storage";
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const [isSelected, setIsSelected] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing =
    editingField?.type === field && editingField?.index === index;

  const handleItemClick = () => {
    setIsSelected(!isSelected);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleItemClick}
      className={`flex items-center justify-between p-3 rounded-lg mb-2 shadow-sm transition-all ${
        isDragging
          ? "shadow-lg scale-105 bg-blue-400"
          : isSelected
            ? "bg-blue-300 shadow-md"
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

const normalizeWordValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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
  const [, setSuggestions] = useState({
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });

  const [formData, setFormData] = useState({
    id: id,
    value: "",
    meaning: [],
    sentences: [],
    levelId: null,
    topicId: null,
    articleId: null,
    partOfSpeechId: null,
    pluralForm: "",
    synonyms: [],
    antonyms: [],
    similarWords: [],
    prefix: null,
    isPrepositional: false,
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
    partOfSpeech: {},
  });

  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const [partOfSpeeches, setPartOfSpeeches] = useState([]);
  const [editingField, setEditingField] = useState(null); // { type: 'meaning' | 'sentences', index: number }
  const [editValue, setEditValue] = useState("");

  const [inputData, setInputData] = useState({
    meaning: "",
    sentences: "",
    synonyms: "",
    antonyms: "",
    similarWords: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [addingAt, setAddingAt] = useState(null); // { index: number, position: 'above' | 'below', field: string }
  const [newItemValue, setNewItemValue] = useState("");
  const [wordsNeedingPOSSelection, setWordsNeedingPOSSelection] = useState([]);
  const [posSelections, setPOSSelections] = useState({});
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

  // Handle POS selection for a new relation word — auto-saves immediately.
  const handlePOSSelection = async (word, relationType) => {
    const variants = await fetchWordVariants(word);
    if (variants.length === 0) return;

    let selected;
    if (variants.length === 1) {
      selected = variants[0];
    } else {
      selected = await showPOSSelectionPopup(
        `${word} (${relationType})`,
        variants,
        null,
        Number(formData.id),
      );
      if (!selected) return;
    }

    if (Number(selected.id) === Number(formData.id)) {
      await showSelfReferenceAlert(
        `A word cannot reference itself as a ${relationType}.`,
      );
      return;
    }

    const relTypeToField = {
      synonym: "synonyms",
      antonym: "antonyms",
      similarWord: "similarWords",
    };
    const fieldName = relTypeToField[relationType];

    try {
      await api.post("/word/relation/add", {
        wordId: formData.id,
        relatedWordId: selected.id,
        relationType,
      });

      // Remove from inputData so it won't be re-processed on submit
      setInputData((prev) => {
        const items = normalizeFieldItems(fieldName, prev[fieldName]);
        const filtered = items.filter(
          (w) => normalizeWordValue(w) !== normalizeWordValue(word),
        );
        return { ...prev, [fieldName]: filtered.join(", ") };
      });

      // Move to formData as a saved relation
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...prev[fieldName], word],
      }));

      // Track the linked variant ID
      setCurrentRelationIds((prev) => ({
        ...prev,
        [relationType]: { ...prev[relationType], [word]: selected.id },
      }));

      // For multi-POS words, show the POS button on the saved relation chip
      if (variants.length > 1) {
        setMultiPOSExisting((prev) => ({
          ...prev,
          [relationType]: new Set([...prev[relationType], word]),
        }));
        setCurrentRelationPOSNames((prev) => ({
          ...prev,
          [relationType]: {
            ...prev[relationType],
            [word]: selected.partOfSpeech.name,
          },
        }));
      }

      // Store in relPOSOverrides so the main submit strips it from the PUT body
      // and re-adds it via /word/relation/add with the correct variant ID.
      setRelPOSOverrides((prev) => ({
        ...prev,
        [relationType]: {
          ...prev[relationType],
          [word]: {
            variantId: selected.id,
            partOfSpeechName: selected.partOfSpeech.name,
          },
        },
      }));

      setPOSSelections((prev) => ({
        ...prev,
        [`${word}-${relationType}`]: selected,
      }));

      Swal.fire({
        title: "Added!",
        text: `"${word}" added as ${relationType} (${selected.partOfSpeech.name}).`,
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
          [wordValue]: selected.partOfSpeech.name,
        },
      }));
      // Keep relPOSOverrides in sync so main submit also uses the correct variant
      setRelPOSOverrides((prev) => ({
        ...prev,
        [relationType]: {
          ...prev[relationType],
          [wordValue]: {
            variantId: selected.id,
            partOfSpeechName: selected.partOfSpeech.name,
          },
        },
      }));

      Swal.fire({
        title: "Updated!",
        text: `Part of speech changed to "${selected.partOfSpeech.name}".`,
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

  // Check for words needing POS selection when input relations change
  useEffect(() => {
    const checkRelations = async () => {
      const newRelationWords = {
        synonyms: normalizeFieldItems("synonyms", inputData.synonyms),
        antonyms: normalizeFieldItems("antonyms", inputData.antonyms),
        similarWords: normalizeFieldItems(
          "similarWords",
          inputData.similarWords,
        ),
      };

      const wordsNeeding =
        await detectWordsNeedingPOSSelection(newRelationWords);
      const wordsWithIndex = wordsNeeding.map((w, idx) => ({
        ...w,
        uniqueKey: `${w.word}-${w.relationType}-${idx}`,
      }));
      setWordsNeedingPOSSelection(wordsWithIndex);
    };

    checkRelations();
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

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Reorder?",
      text: `Position ${oldIndex + 1} → ${newIndex + 1}`,
      // icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return; // User cancelled the reorder
    }

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));

    // Save to backend
    setLoading(true);
    try {
      await api.put(
        `/word/update/${formData.id}`,
        buildUpdatePayload(field, updatedArray),
      );

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

    const updatedArray = [...formData[field]];
    const insertIndex = position === "above" ? index : index + 1;
    updatedArray.splice(insertIndex, 0, ...itemsToInsert);

    if (RELATION_FIELDS.includes(field)) {
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

    // Save to backend
    setLoading(true);
    try {
      await api.put(
        `/word/update/${formData.id}`,
        buildUpdatePayload(field, updatedArray),
      );

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

        setFormData({
          id: word.id,
          value: word.value,
          meaning: word.meaning || [],
          sentences: word.sentences || [],
          levelId: word.levelId || 1,
          topicId: word.topicId || 1,
          articleId: word.articleId || 4,
          partOfSpeechId: word.partOfSpeechId || 3,
          pluralForm: word.pluralForm || "",
          synonyms: word.synonyms?.map((item) => item.value) || [],
          antonyms: word.antonyms?.map((item) => item.value) || [],
          similarWords: word.similarWords?.map((item) => item.value) || [],
          prefix: word.prefix || null,
          isPrepositional: word.isPrepositional || false,
          verbAttributes,
          prepositionAttributes,
          level: word.level,
          topic: word.topic,
          article: word.article,
          partOfSpeech: word.partOfSpeech,
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
        setPartOfSpeeches(partOfSpeechResponse.data);
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
          if (match) posNames[relationType][wordVal] = match.partOfSpeech.name;
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

  const handleInputChange = async (e) => {
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
    // If it's a select field (levelId, topicId, articleId, partOfSpeechId), update formData directly
    else if (
      name === "levelId" ||
      name === "topicId" ||
      name === "articleId" ||
      name === "partOfSpeechId"
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else if (
      name === "value" ||
      name === "pluralForm" ||
      name === "prefix" ||
      name === "isPrepositional"
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else if (
      name === "meaning" ||
      name === "sentences" ||
      name === "synonyms" ||
      name === "antonyms" ||
      name === "similarWords"
    ) {
      setInputData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      if (value.length >= 2) {
        try {
          const response = await publicApi.get("/words/suggestions", {
            params: {
              query: value,
              type: name,
            },
          });

          setSuggestions((prevSuggestions) => ({
            ...prevSuggestions,
            [name]: response.data,
          }));
        } catch {
          // Suggestions API call failed, continue without suggestions
        }
      } else {
        setSuggestions((prevSuggestions) => ({
          ...prevSuggestions,
          [name]: [],
        }));
      }
    }
  };

  const handleRemoveItem = async (field, index) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Remove",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setLoading(true);
      // Remove the item from the array
      const updatedArray = [...formData[field]];
      updatedArray.splice(index, 1);

      // Remove empty strings from the array
      const filteredArray = updatedArray.filter((item) => item.trim() !== "");

      // Update the state
      setFormData((prev) => ({
        ...prev,
        [field]: filteredArray,
      }));

      try {
        // Send the updated data to the backend
        await api.put(
          `/word/update/${formData.id}`,
          buildUpdatePayload(field, filteredArray),
        );

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

  const handleClearAllSentences = async () => {
    const result = await Swal.fire({
      title: "Clear all sentences?",
      text: 'Type "ok" (case insensitive) to confirm this action. This cannot be undone.',
      input: "text",
      inputPlaceholder: 'Type "ok" to confirm',
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Clear All",
      reverseButtons: true,
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
      reverseButtons: true,
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
    setLoading(true);
    setMessage("");

    // Ensure the necessary fields are arrays and remove empty strings
    // New relation words (synonym/antonym/similarWord) are added separately
    // after the update using /word/relation/add so posSelections can be applied.
    const newSynonyms = normalizeFieldItems("synonyms", inputData.synonyms);
    const newAntonyms = normalizeFieldItems("antonyms", inputData.antonyms);
    const newSimilarWords = normalizeFieldItems(
      "similarWords",
      inputData.similarWords,
    );

    // Collect specific variant IDs for multi-POS overridden relations so the
    // backend connects the exact variant instead of guessing by word value.
    const synonymIds = Object.values(relPOSOverrides.synonym).map((info) =>
      Number(info.variantId),
    );
    const antonymIds = Object.values(relPOSOverrides.antonym).map((info) =>
      Number(info.variantId),
    );
    const similarWordIds = Object.values(relPOSOverrides.similarWord).map(
      (info) => Number(info.variantId),
    );

    const dataToSend = {
      ...formData,

      meaning: formData.meaning.concat(
        normalizeFieldItems("meaning", inputData.meaning),
      ),
      sentences: formData.sentences.concat(
        normalizeSentenceItems(inputData.sentences),
      ),
      // Exclude overridden words from value-based processing — their specific
      // variant IDs are sent separately via synonymIds/antonymIds/similarWordIds.
      synonyms: formData.synonyms.filter((s) => !relPOSOverrides.synonym[s]),
      antonyms: formData.antonyms.filter((s) => !relPOSOverrides.antonym[s]),
      similarWords: formData.similarWords.filter(
        (s) => !relPOSOverrides.similarWord[s],
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
    delete dataToSend.partOfSpeech;

    // Add prepositionCase directly to dataToSend
    dataToSend.prepositionCase = formData.prepositionAttributes.prepositionCase;

    // Add prefix directly to dataToSend
    dataToSend.prefix =
      formData.prefix && formData.prefix.trim() ? formData.prefix.trim() : null;

    // Add isPrepositional directly to dataToSend
    dataToSend.isPrepositional = formData.isPrepositional;

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

    // Validate relation words (only the new ones from input)
    const newRelationWords = {
      synonyms: normalizeFieldItems("synonyms", inputData.synonyms),
      antonyms: normalizeFieldItems("antonyms", inputData.antonyms),
      similarWords: normalizeFieldItems("similarWords", inputData.similarWords),
    };

    // Value-level self-reference check for new relations.
    // Skip words that need POS selection (multi-POS) — for those, the ID check
    // in addRelation handles it after the user picks a specific variant.
    const multiPOSValues = new Set(
      wordsNeedingPOSSelection.map((w) => normalizeWordValue(w.word)),
    );
    const singlePOSNewRelations = {
      synonyms: newRelationWords.synonyms.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
      antonyms: newRelationWords.antonyms.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
      similarWords: newRelationWords.similarWords.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
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

      // Check if all required POS selections have been made
      if (wordsNeedingPOSSelection.length > 0) {
        const allSelectionsComplete = wordsNeedingPOSSelection.every(
          (w) => posSelections[`${w.word}-${w.relationType}`],
        );

        if (!allSelectionsComplete) {
          setLoading(false);
          Swal.fire({
            title: "POS Selection Required",
            text: "Please select the part of speech for all related words with multiple meanings.",
            icon: "warning",
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        }

        // Pre-validate that none of the selected POS variants is the word itself.
        // If it is, clear that selection so the user can pick a different POS.
        const selfRefKeys = wordsNeedingPOSSelection
          .filter((w) => {
            const variant = posSelections[`${w.word}-${w.relationType}`];
            return variant && Number(variant.id) === Number(formData.id);
          })
          .map((w) => `${w.word}-${w.relationType}`);

        if (selfRefKeys.length > 0) {
          const clearedSelections = { ...posSelections };
          selfRefKeys.forEach((k) => delete clearedSelections[k]);
          setPOSSelections(clearedSelections);
          setLoading(false);
          await showSelfReferenceAlert(
            "A word cannot reference itself. Please select a different part of speech.",
          );
          return;
        }
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

    if (result.isConfirmed) {
      try {
        const response = await api.put(
          `/word/update/${formData.id}`,
          dataToSend,
        );
        setMessage(response.data.message);

        // Add new relation words using posSelections so the correct POS
        // variant is linked instead of an arbitrary findFirst by value.
        const addRelation = async (relatedWordValue, relationType) => {
          const selectedVariant =
            posSelections[`${relatedWordValue}-${relationType}`] ||
            (await (async () => {
              const variants = await fetchWordVariants(relatedWordValue);
              if (variants.length <= 1) return variants[0] || null;
              return showPOSSelectionPopup(
                `${relatedWordValue} (${relationType})`,
                variants,
                null,
                Number(formData.id),
              );
            })());

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

        for (const synonym of newSynonyms)
          await addRelation(synonym, "synonym");
        for (const antonym of newAntonyms)
          await addRelation(antonym, "antonym");
        for (const similarWord of newSimilarWords)
          await addRelation(similarWord, "similarWord");

        setInputData({
          meaning: "",
          sentences: "",
          synonyms: "",
          antonyms: "",
          similarWords: "",
        });
        setPOSSelections({});
        setWordsNeedingPOSSelection([]);
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
      } catch {
        setMessage("Failed to update the word.");
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
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="update-meaning-input"
                      className="block text-white"
                    >
                      <span className="font-medium text-lg"> Meaning</span> (for
                      multiple input use comma)
                    </label>
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
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="update-sentences-input"
                      className="block text-white"
                    >
                      <span className="font-medium text-lg">Sentences</span>{" "}
                      (for multiple input use "|". eg. sentence A. | Sentence
                      B.)
                    </label>
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

                {/* Synonyms Section */}
                <div>
                  <label
                    htmlFor="update-synonyms"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Synonyms</span> (for
                    multiple input use comma)
                  </label>
                  <input
                    id="update-synonyms"
                    type="text"
                    name="synonyms"
                    value={inputData.synonyms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter synonyms"
                  />
                  {wordsNeedingPOSSelection
                    .filter((w) => w.relationType === "synonym")
                    .map((w) => (
                      <button
                        key={w.uniqueKey}
                        type="button"
                        onClick={() => handlePOSSelection(w.word, "synonym")}
                        className={`mt-2 px-3 py-1 text-sm rounded ${
                          posSelections[`${w.word}-synonym`]
                            ? "bg-green-500 text-white"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {posSelections[`${w.word}-synonym`]
                          ? `✓ ${w.word} (${posSelections[`${w.word}-synonym`].partOfSpeech.name})`
                          : `Select POS for "${w.word}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.synonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
                        <div className="flex gap-2">
                          {multiPOSExisting.synonym.has(item) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "synonym")
                              }
                              className={`btn btn-sm ${relPOSOverrides.synonym[item] ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}
                            >
                              {relPOSOverrides.synonym[item]
                                ? `✓ ${relPOSOverrides.synonym[item].partOfSpeechName}`
                                : currentRelationPOSNames.synonym[item]
                                  ? currentRelationPOSNames.synonym[item]
                                  : "Select POS"}
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

                  <input
                    id="update-antonyms"
                    type="text"
                    name="antonyms"
                    value={inputData.antonyms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter antonyms"
                  />
                  {wordsNeedingPOSSelection
                    .filter((w) => w.relationType === "antonym")
                    .map((w) => (
                      <button
                        key={w.uniqueKey}
                        type="button"
                        onClick={() => handlePOSSelection(w.word, "antonym")}
                        className={`mt-2 px-3 py-1 text-sm rounded ${
                          posSelections[`${w.word}-antonym`]
                            ? "bg-green-500 text-white"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {posSelections[`${w.word}-antonym`]
                          ? `✓ ${w.word} (${posSelections[`${w.word}-antonym`].partOfSpeech.name})`
                          : `Select POS for "${w.word}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.antonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
                        <div className="flex gap-2">
                          {multiPOSExisting.antonym.has(item) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "antonym")
                              }
                              className={`btn btn-sm ${relPOSOverrides.antonym[item] ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}
                            >
                              {relPOSOverrides.antonym[item]
                                ? `✓ ${relPOSOverrides.antonym[item].partOfSpeechName}`
                                : currentRelationPOSNames.antonym[item]
                                  ? currentRelationPOSNames.antonym[item]
                                  : "Select POS"}
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

                  <input
                    id="update-similarWords"
                    type="text"
                    name="similarWords"
                    value={inputData.similarWords}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter similar words"
                  />
                  {wordsNeedingPOSSelection
                    .filter((w) => w.relationType === "similarWord")
                    .map((w) => (
                      <button
                        key={w.uniqueKey}
                        type="button"
                        onClick={() =>
                          handlePOSSelection(w.word, "similarWord")
                        }
                        className={`mt-2 px-3 py-1 text-sm rounded ${
                          posSelections[`${w.word}-similarWord`]
                            ? "bg-green-500 text-white"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {posSelections[`${w.word}-similarWord`]
                          ? `✓ ${w.word} (${posSelections[`${w.word}-similarWord`].partOfSpeech.name})`
                          : `Select POS for "${w.word}"`}
                      </button>
                    ))}
                  <div className="mt-2">
                    {formData.similarWords.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
                        <div className="flex gap-2">
                          {multiPOSExisting.similarWord.has(item) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExistingPOSSelection(item, "similarWord")
                              }
                              className={`btn btn-sm  ${relPOSOverrides.similarWord[item] ? "btn-success" : "btn-info"}`}
                            >
                              {relPOSOverrides.similarWord[item]
                                ? `✓ ${relPOSOverrides.similarWord[item].partOfSpeechName}`
                                : currentRelationPOSNames.similarWord[item]
                                  ? currentRelationPOSNames.similarWord[item]
                                  : "Select POS"}
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

                {/* Article Dropdown */}
                <div>
                  <label
                    htmlFor="update-articleId"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg">Article</span>
                  </label>
                  <select
                    id="update-articleId"
                    name="articleId"
                    value={formData.articleId || "4"}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Part of Speech Dropdown */}
                <div>
                  <label
                    htmlFor="update-partOfSpeechId"
                    className="block  mb-2 text-white"
                  >
                    <span className="font-medium text-lg"> Part of Speech</span>
                  </label>
                  <select
                    id="update-partOfSpeechId"
                    name="partOfSpeechId"
                    value={formData.partOfSpeechId || "3"}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Select" disabled>
                      Select
                    </option>
                    {partOfSpeeches.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verb Attributes - Only show when part of speech is verb */}
                {partOfSpeeches
                  .find((pos) => pos.id === parseInt(formData.partOfSpeechId))
                  ?.name?.toLowerCase() === "verb" && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      🔹 Verb Attributes
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

                {/* Preposition Attributes - Only show when part of speech is preposition */}
                {partOfSpeeches
                  .find((pos) => pos.id === parseInt(formData.partOfSpeechId))
                  ?.name?.toLowerCase() === "preposition" && (
                  <div className="space-y-4 p-4 bg-purple-50 dark:bg-slate-800 rounded-lg border-2 border-purple-200 dark:border-purple-600">
                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      🔹 Preposition Attributes
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

                {/* Adjective Attributes - Only show when part of speech is adjective */}
                {partOfSpeeches
                  .find((pos) => pos.id === parseInt(formData.partOfSpeechId))
                  ?.name?.toLowerCase() === "adjective" && (
                  <div className="space-y-4 p-4 bg-yellow-50 dark:bg-slate-800 rounded-lg border-2 border-yellow-200 dark:border-yellow-600">
                    <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                      🔹 Adjective Attributes
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
                className="btn w-full md:w-8/12 lg:w-8/12 btn-primary"
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
