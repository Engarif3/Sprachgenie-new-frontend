import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import Container from "../../../utils/Container";
import api from "../../../axios";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
            className="flex-1 break-words font-medium cursor-grab active:cursor-grabbing"
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

const UpdateWord = () => {
  const { id } = useParams();
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

  // Security check: Only allow admin/super_admin users
  if (
    !userLoggedIn ||
    !userInfo.id ||
    (userInfo.role !== "admin" && userInfo.role !== "super_admin")
  ) {
    return <Navigate to="/" replace />;
  }
  const [suggestions, setSuggestions] = useState({
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });

  const [formData, setFormData] = useState({
    id: id,
    value: "",
    meaning: [],
    sentences: [],
    levelId: "" || null,
    topicId: "" || null,
    articleId: "" || null,
    partOfSpeechId: "" || null,
    pluralForm: "",
    synonyms: [],
    antonyms: [],
    similarWords: [],
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

  // Setup DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      await api.put(`/word/update/${formData.id}`, {
        ...formData,
        [field]: updatedArray,
      });

      Swal.fire({
        title: "Reordered!",
        text: "Items reordered successfully.",
        timer: 500,
        showConfirmButton: false,
        icon: "success",
      });

      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
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
    if (!newItemValue.trim()) {
      Swal.fire({
        title: "Error",
        text: "Please enter a value",
        icon: "error",
      });
      return;
    }

    const updatedArray = [...formData[field]];
    const insertIndex = position === "above" ? index : index + 1;
    updatedArray.splice(insertIndex, 0, newItemValue.trim());

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));

    // Save to backend
    setLoading(true);
    try {
      await api.put(`/word/update/${formData.id}`, {
        ...formData,
        [field]: updatedArray,
      });

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
    } catch (error) {
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
      try {
        setInitialLoading(true);

        // Fetch all data in parallel using Promise.all for faster loading
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
        setFormData({
          id: word.id,
          value: word.value,
          meaning: word.meaning,
          sentences: word.sentences,
          levelId: word.levelId || 1,
          topicId: word.topicId || 1,
          articleId: word.articleId || 4,
          partOfSpeechId: word.partOfSpeechId || 3,
          pluralForm: word.pluralForm || "",
          synonyms: word.synonyms?.map((item) => item.value) || [],
          antonyms: word.antonyms?.map((item) => item.value) || [],
          similarWords: word.similarWords?.map((item) => item.value) || [],
          level: word.level,
          topic: word.topic,
          article: word.article,
          partOfSpeech: word.partOfSpeech,
        });

        setLevels(levelsResponse.data);
        setTopics(topicsResponse.data);
        setArticles(articlesResponse.data);
        setPartOfSpeeches(partOfSpeechResponse.data);
      } catch (error) {
        // Error handled - form will show validation errors
        console.error("Error fetching data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllData();
  }, [id, refetchTrigger]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    // If it's a select field (levelId, topicId, articleId, partOfSpeechId), update formData directly
    if (
      name === "levelId" ||
      name === "topicId" ||
      name === "articleId" ||
      name === "partOfSpeechId"
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else if (name === "value" || name === "pluralForm") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
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
          const res = await fetch(
            `/words/suggestions?query=${value}&type=${name}`,
          );
          const contentType = res.headers.get("Content-Type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setSuggestions((prevSuggestions) => ({
              ...prevSuggestions,
              [name]: data,
            }));
          }
        } catch (error) {
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
        const response = await api.put(`/word/update/${formData.id}`, {
          ...formData,
          [field]: filteredArray, // Send the updated list to the backend
        });

        Swal.fire({
          title: "Removed!",
          text: "The item has been removed successfully.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch (error) {
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
        const response = await api.put(`/word/update/${formData.id}`, {
          ...formData,
          sentences: emptyArray,
        });

        Swal.fire({
          title: "Cleared!",
          text: "All sentences have been removed.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });

        // Trigger refetch by incrementing counter
        setRefetchTrigger((prev) => prev + 1);
      } catch (error) {
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
    const dataToSend = {
      ...formData,

      meaning: formData.meaning.concat(
        inputData.meaning
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
      ),
      sentences: formData.sentences.concat(
        inputData.sentences
          .split("|")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
      ),
      synonyms: formData.synonyms.concat(
        inputData.synonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
      ),
      antonyms: formData.antonyms.concat(
        inputData.antonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
      ),
      similarWords: formData.similarWords.concat(
        inputData.similarWords
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
      ),
    };

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
        setInputData({
          meaning: "",
          sentences: "",
          synonyms: "",
          antonyms: "",
          similarWords: "",
        });

        // Clear the word list cache after successful update
        localStorage.removeItem("wordListCache");

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
        setMessage("Failed to update the word.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async (field, index) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = editValue.trim();

    // Optional: Prevent saving empty values
    if (!updatedArray[index]) return;

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));

    try {
      await api.put(`/word/update/${formData.id}`, {
        ...formData,
        [field]: updatedArray,
      });

      Swal.fire({
        title: "Updated!",
        text: "The item has been edited successfully.",
        timer: 800,
        showConfirmButton: false,
        icon: "success",
      });

      // Trigger refetch by incrementing counter
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Meaning</span> (for
                    multiple input use comma)
                  </label>
                  <input
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
                                    onKeyPress={(e) => {
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
                                    onKeyPress={(e) => {
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
                    <label className="block text-white">
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
                                    onKeyPress={(e) => {
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
                                    onKeyPress={(e) => {
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Plural Form</span>
                  </label>
                  <input
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Synonyms</span> (for
                    multiple input use comma)
                  </label>
                  <input
                    type="text"
                    name="synonyms"
                    value={inputData.synonyms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter synonyms"
                  />
                  <div className="mt-2">
                    {formData.synonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem("synonyms", index)}
                          className="btn btn-sm btn-error"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Antonyms Section */}
                <div>
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Antonyms</span> (for
                    multiple input use comma)
                  </label>

                  <input
                    type="text"
                    name="antonyms"
                    value={inputData.antonyms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter antonyms"
                  />
                  <div className="mt-2">
                    {formData.antonyms.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem("antonyms", index)}
                          className="btn btn-sm btn-error"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Words Section */}
                <div>
                  <label className="block mb-2 text-white">
                    <span className="font-medium text-lg"> Word to Watch</span>{" "}
                    (for multiple input use comma)
                  </label>

                  <input
                    type="text"
                    name="similarWords"
                    value={inputData.similarWords}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter similar words"
                  />
                  <div className="mt-2">
                    {formData.similarWords.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                      >
                        <li>{item}</li>
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
                    ))}
                  </div>
                </div>

                {/* Level Dropdown */}
                <div>
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Level</span>
                  </label>
                  <select
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg">Topic</span>
                  </label>
                  <select
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg">Article</span>
                  </label>
                  <select
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
                  <label className="block  mb-2 text-white">
                    <span className="font-medium text-lg"> Part of Speech</span>
                  </label>
                  <select
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
