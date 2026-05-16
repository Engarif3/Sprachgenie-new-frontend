import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../axios";
import { invalidateWordsCache } from "../utils/storage";
import {
  validateRelationWords,
  detectWordsNeedingPOSSelection,
  showPOSSelectionPopup,
  fetchWordVariants,
} from "../utils/wordValidation";

import { useAuth } from "../services/auth.services";

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


const WordForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

  const initialWordData = {
    value: "",
    meaning: "",
    sentences: "",
    pluralForm: "",
    levelId: "",
    topicId: "",
    articleId: "",
    partOfSpeechId: "",
    synonyms: "",
    antonyms: "",
    similarWords: "",
    prefix: "",
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
  };

  const [wordData, setWordData] = useState(initialWordData);
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  const [wordsNeedingPOSSelection, setWordsNeedingPOSSelection] = useState([]);
  const [posSelections, setPOSSelections] = useState({});

  // Fetch the options for level, topic, article, and partOfSpeech
  useEffect(() => {
    const fetchData = async () => {
      try {
        const levelResponse = await api.get("/level/all");
        const topicResponse = await api.get("/topic/all");
        const articleResponse = await api.get("/articles");
        const partOfSpeechResponse = await api.get("/part-of-speech");

        setLevels(levelResponse.data.data);
        setTopics(topicResponse.data.data);
        setArticles(articleResponse.data);
        setPartsOfSpeech(partOfSpeechResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error); // Log the error for debugging
      }
    };

    fetchData();
  }, []);

  // Handle POS selection for a specific relation word
  const handlePOSSelection = async (word, relationType) => {
    const variants = await fetchWordVariants(word);
    if (variants.length === 0) return;

    let selected;
    if (variants.length === 1) {
      selected = variants[0];
    } else {
      // Disable the variant that has the same POS as the word being created
      // (only relevant when the relation word has the same value as the new word)
      let disabledVariantId = null;
      if (
        normalizeWordValue(word) === normalizeWordValue(wordData.value) &&
        wordData.partOfSpeechId
      ) {
        const samePOSVariant = variants.find(
          (v) => Number(v.partOfSpeechId) === parseInt(wordData.partOfSpeechId),
        );
        if (samePOSVariant) disabledVariantId = samePOSVariant.id;
      }

      selected = await showPOSSelectionPopup(
        `${word} (${relationType})`,
        variants,
        null,
        disabledVariantId,
      );
      if (!selected) return;
    }

    // Safety check: block same-value + same-POS (true self-reference)
    if (
      normalizeWordValue(word) === normalizeWordValue(wordData.value) &&
      wordData.partOfSpeechId &&
      Number(selected.partOfSpeechId) === parseInt(wordData.partOfSpeechId)
    ) {
      Swal.fire({
        title: "Invalid relation",
        text: `A word cannot reference itself as a ${relationType}.`,
        icon: "warning",
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    setPOSSelections((prev) => ({
      ...prev,
      [`${word}-${relationType}`]: selected,
    }));
  };

  // Check for words needing POS selection when relations change
  useEffect(() => {
    const checkRelations = async () => {
      const normalizeRelationList = (text) =>
        Array.from(
          new Set(
            text
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        );

      const relationsToCheck = {
        synonyms: normalizeRelationList(wordData.synonyms),
        antonyms: normalizeRelationList(wordData.antonyms),
        similarWords: normalizeRelationList(wordData.similarWords),
      };

      const wordsNeeding =
        await detectWordsNeedingPOSSelection(relationsToCheck);

      // Add unique index to handle duplicate words in different relation types
      const wordsWithIndex = wordsNeeding.map((w, idx) => ({
        ...w,
        uniqueKey: `${w.word}-${w.relationType}-${idx}`,
      }));

      setWordsNeedingPOSSelection(wordsWithIndex);
    };

    checkRelations();
  }, [wordData.synonyms, wordData.antonyms, wordData.similarWords]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle verb attributes nested object
    if (name.startsWith("verbAttributes.")) {
      const field = name.split(".")[1];

      setWordData((prevData) => {
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
            console.log("=== CASE REQUIREMENT CHANGE ===");
            console.log("Selected value:", value);
            console.log("Converted to:", newVerbAttrs[field]);
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

      setWordData((prevData) => {
        const newPrepositionAttrs = { ...prevData.prepositionAttributes };

        // Handle select dropdown - null means "Not specified"
        newPrepositionAttrs[field] = value === "" ? null : value;

        return {
          ...prevData,
          prepositionAttributes: newPrepositionAttrs,
        };
      });
    } else {
      setWordData((prevData) => {
        const updated = {
          ...prevData,
          [name]: type === "checkbox" ? checked : value,
        };
        // Reset article when POS changes to something other than noun
        if (name === "partOfSpeechId") {
          const newPOS = partsOfSpeech.find(
            (p) => p.id === parseInt(value),
          );
          if (!newPOS || newPOS.name.toLowerCase() !== "noun") {
            updated.articleId = "";
          }
        }
        return updated;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!wordData.levelId) {
      Swal.fire({
        title: "Level Required",
        text: "Please select a level before creating the word.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    if (!wordData.partOfSpeechId) {
      Swal.fire({
        title: "Part of Speech Required",
        text: "Please select a part of speech before creating the word.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    // Check if all required POS selections have been made
    if (wordsNeedingPOSSelection.length > 0) {
      const allSelectionsComplete = wordsNeedingPOSSelection.every(
        (w) => posSelections[`${w.word}-${w.relationType}`],
      );

      if (!allSelectionsComplete) {
        Swal.fire({
          title: "POS Selection Required",
          text: "Please select the part of speech for all related words with multiple meanings.",
          icon: "warning",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
    }

    const parseIntOrNull = (value) =>
      value === "" || value === null || value === undefined
        ? null
        : parseInt(value, 10);

    const newWordData = {
      value: wordData.value,
      meaning:
        typeof wordData.meaning === "string"
          ? wordData.meaning.split(",").map((item) => item.trim())
          : [],
      sentences:
        typeof wordData.sentences === "string"
          ? wordData.sentences
              .split("|")
              .map((item) => item.trim())
              .filter((item) => item) // Removes empty strings
          : [],
      pluralForm: wordData.pluralForm,
      levelId: parseIntOrNull(wordData.levelId),
      topicId: parseIntOrNull(wordData.topicId) || 1,
      articleId: parseIntOrNull(wordData.articleId) || 4,
      partOfSpeechId: parseIntOrNull(wordData.partOfSpeechId),
      synonyms:
        typeof wordData.synonyms === "string"
          ? Array.from(
              new Set(
                wordData.synonyms
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              ),
            )
          : [],
      antonyms:
        typeof wordData.antonyms === "string"
          ? Array.from(
              new Set(
                wordData.antonyms
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              ),
            )
          : [],
      similarWords:
        typeof wordData.similarWords === "string"
          ? Array.from(
              new Set(
                wordData.similarWords
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              ),
            )
          : [],
    };

    // Add verbAttributes only if there are non-default values
    const defaults = {
      conjugation: "REGULAR",
      isReflexive: false,
      isModal: false,
      prefixType: "NONE",
      caseRequirement: null,
    };

    const verbAttributes = {};
    Object.keys(wordData.verbAttributes).forEach((key) => {
      if (wordData.verbAttributes[key] !== defaults[key]) {
        verbAttributes[key] = wordData.verbAttributes[key];
      }
    });

    // console.log("=== WORD FORM DEBUG ===");
    // console.log("wordData.verbAttributes:", wordData.verbAttributes);
    // console.log("defaults:", defaults);
    // console.log("verbAttributes to send:", verbAttributes);

    // Only include verbAttributes if it has non-default values
    if (Object.keys(verbAttributes).length > 0) {
      newWordData.verbAttributes = verbAttributes;
    }

    // Always include prepositionCase (can be null)
    newWordData.prepositionCase =
      wordData.prepositionAttributes.prepositionCase;

    // Include prefix (can be null or empty)
    newWordData.prefix =
      wordData.prefix && wordData.prefix.trim() ? wordData.prefix.trim() : null;

    // Include isPrepositional (boolean)
    newWordData.isPrepositional = wordData.isPrepositional;

    // Validate prefix matches the word if it's a separable verb
    if (
      wordData.verbAttributes.prefixType === "SEPARABLE" &&
      newWordData.prefix &&
      newWordData.prefix.trim()
    ) {
      const wordValue = newWordData.value.toLowerCase();
      const prefixValue = newWordData.prefix.toLowerCase();

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
        Swal.fire({
          title: "Invalid Prefix",
          text: `The prefix "${newWordData.prefix}" doesn't match any part of the word "${newWordData.value}". Please enter a valid prefix.`,
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
    }

    newWordData.createdBy = userId;

    // Skip multi-POS words from the value-level self-reference check — their
    // POS is validated individually in addRelation via partOfSpeechId comparison.
    const multiPOSValues = new Set(
      wordsNeedingPOSSelection.map((w) => normalizeWordValue(w.word)),
    );
    const relationsForSelfRefCheck = {
      synonyms: newWordData.synonyms.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
      antonyms: newWordData.antonyms.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
      similarWords: newWordData.similarWords.filter(
        (v) => !multiPOSValues.has(normalizeWordValue(v)),
      ),
    };
    const selfReferenceMessage = getSelfReferenceMessage(
      newWordData.value,
      relationsForSelfRefCheck,
    );

    if (selfReferenceMessage) {
      Swal.fire({
        title: "Invalid relation",
        text: selfReferenceMessage,
        icon: "warning",
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    // Validate relation words (synonyms, antonyms, similar words)
    const validation = await validateRelationWords({
      synonyms: newWordData.synonyms,
      antonyms: newWordData.antonyms,
      similarWords: newWordData.similarWords,
    });

    if (!validation.valid) {
      return; // User cancelled the operation
    }

    try {
      const wordDataToSubmit = {
        ...newWordData,
        // Don't include relations in creation - we'll add them after with selected POS
        synonyms: [],
        antonyms: [],
        similarWords: [],
      };

      const createResponse = await api.post("/word/create", wordDataToSubmit);

      // Check if ambiguous words were found
      if (createResponse.data.data?.requiresSelection === true) {
        const ambiguousWords = createResponse.data.data.ambiguousWords || [];

        // Show popup for POS selection
        const posSelections = await new Promise((resolve) => {
          const selections = {};
          let currentIndex = 0;

          const showNextAmbiguousWord = () => {
            if (currentIndex >= ambiguousWords.length) {
              resolve(Object.values(selections));
              return;
            }

            const ambiguous = ambiguousWords[currentIndex];

            Swal.fire({
              title: `Select part of speech for "${ambiguous.value}"`,
              html: `
                <div class="text-left mt-2.5">
                  ${ambiguous.variants
                    .map(
                      (variant) => `
                    <div class="ambiguous-pos-option p-3 my-2 border border-gray-300 rounded cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400"
                         data-id="${variant.id}" data-word="${ambiguous.value}">
                      <strong>${variant.partOfSpeechName || "Unknown"}</strong>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              `,
              didOpen: () => {
                document
                  .querySelectorAll(".ambiguous-pos-option")
                  .forEach((el) => {
                    el.addEventListener("click", () => {
                      const selectedId = parseInt(el.dataset.id);
                      const wordValue = el.dataset.word;
                      selections[`${wordValue}-${currentIndex}`] = {
                        wordValue,
                        wordId: selectedId,
                      };
                      currentIndex++;
                      Swal.close();
                      showNextAmbiguousWord();
                    });
                  });
              },
              allowOutsideClick: false,
              showCancelButton: true,
              cancelButtonText: "Cancel",
              confirmButtonText: "Select",
            }).catch(() => {
              resolve(null); // User cancelled
            });
          };

          showNextAmbiguousWord();
        });

        if (!posSelections) {
          return; // User cancelled
        }

        // Call the confirmation endpoint with POS selections
        await api.post("/word/create/with-pos-selection", {
          wordData: createResponse.data.data.pendingWordData,
          posSelections,
        });

        await invalidateWordsCache();
        setWordData(initialWordData);
        setPOSSelections({});

        Swal.fire({
          title: "Created",
          text: "The word created successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Normal flow - word created without ambiguous words
        const createdWordId = createResponse.data.data.id;

        const addRelation = async (relatedWordValue, relationType) => {
          let selectedVariant =
            posSelections[`${relatedWordValue}-${relationType}`];

          if (!selectedVariant) {
            // Fallback for words that bypassed the POS selection buttons
            const variants = await fetchWordVariants(relatedWordValue);
            if (!variants || variants.length === 0) return;

            if (variants.length === 1) {
              selectedVariant = variants[0];
            } else {
              let disabledVariantId = null;
              if (
                normalizeWordValue(relatedWordValue) ===
                  normalizeWordValue(wordData.value) &&
                wordData.partOfSpeechId
              ) {
                const same = variants.find(
                  (v) =>
                    Number(v.partOfSpeechId) ===
                    parseInt(wordData.partOfSpeechId),
                );
                if (same) disabledVariantId = same.id;
              }
              selectedVariant = await showPOSSelectionPopup(
                `${relatedWordValue} (${relationType})`,
                variants,
                null,
                disabledVariantId,
              );
            }
          }

          if (!selectedVariant?.id) return;

          // Block if the selected variant is the newly-created word itself
          if (Number(selectedVariant.id) === Number(createdWordId)) {
            await Swal.fire({
              title: "Invalid relation",
              text: `A word cannot reference itself as a ${relationType}.`,
              icon: "warning",
              timer: 2200,
              showConfirmButton: false,
            });
            return;
          }

          // Block same-value + same-POS as the new word
          if (
            normalizeWordValue(relatedWordValue) ===
              normalizeWordValue(wordData.value) &&
            wordData.partOfSpeechId &&
            Number(selectedVariant.partOfSpeechId) ===
              parseInt(wordData.partOfSpeechId)
          ) {
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
            wordId: createdWordId,
            relatedWordId: selectedVariant.id,
            relationType,
          });
        };

        if (newWordData.synonyms.length > 0) {
          for (const synonym of newWordData.synonyms) {
            await addRelation(synonym, "synonym");
          }
        }

        if (newWordData.antonyms.length > 0) {
          for (const antonym of newWordData.antonyms) {
            await addRelation(antonym, "antonym");
          }
        }

        if (newWordData.similarWords.length > 0) {
          for (const similarWord of newWordData.similarWords) {
            await addRelation(similarWord, "similarWord");
          }
        }

        await invalidateWordsCache();
        setWordData(initialWordData);
        setPOSSelections({});

        Swal.fire({
          title: "Created",
          text: "The word created successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      // catch (error) {
      //   Swal.fire({
      //     title: "Error",
      //     text: "There was an error creating the word.",
      //     icon: "error",
      //     timer: 1500,
      //     showConfirmButton: false,
      //   });
      // }
      const errorMessage =
        error.response?.data?.message ||
        "There was an error creating the word.";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Show loading message if data is still being fetched
  // if (loading) {
  //   return <p>Loading...</p>;
  // }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const isNounSelected =
    partsOfSpeech
      .find((p) => p.id === parseInt(wordData.partOfSpeechId))
      ?.name?.toLowerCase() === "noun";

  return (
    <div className="w-full  p-0 md:p-6  lg:p-6 mt-4">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        Create a Word
      </h2>
      <form onSubmit={handleSubmit} className="w-full shadow-lg ">
        <div className="w-full bg-stone-800 rounded-md p-1   md:p-8 lg:p-8 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            <div className="space-y-6">
              {/* Word Input */}
              <div className="text-lg">
                <label
                  htmlFor="value"
                  className="block text-sm font-medium text-white"
                >
                  Word
                </label>
                <input
                  type="text"
                  id="value"
                  name="value"
                  value={wordData.value}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Meaning Input */}
              <div>
                <label
                  htmlFor="meaning"
                  className="block text-sm font-medium text-white"
                >
                  Meaning (comma separated)
                </label>
                <input
                  type="text"
                  id="meaning"
                  name="meaning"
                  value={wordData.meaning}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Sentences Input */}
              <div>
                <label
                  htmlFor="sentences"
                  className="block text-sm font-medium text-white"
                >
                  Sentences(Optional, eg. sentence A. | Sentence B.)
                </label>
                <input
                  type="text"
                  id="sentences"
                  name="sentences"
                  value={wordData.sentences}
                  onChange={handleChange}
                  className=" input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Plural Form Input */}
              <div>
                <label
                  htmlFor="pluralForm"
                  className="block text-sm font-medium text-white"
                >
                  Plural Form (Optional)
                </label>
                <input
                  type="text"
                  id="pluralForm"
                  name="pluralForm"
                  value={wordData.pluralForm}
                  onChange={handleChange}
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Level Dropdown */}
              <div>
                <label
                  htmlFor="levelId"
                  className="block text-sm font-medium text-white"
                >
                  Level
                </label>
                <select
                  id="levelId"
                  name="levelId"
                  value={wordData.levelId}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Level</option>
                  {levels && levels.length > 0 ? (
                    levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.level}
                      </option>
                    ))
                  ) : (
                    <option disabled>No levels available</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {/* Part of Speech Dropdown */}
              <div>
                <label
                  htmlFor="partOfSpeechId"
                  className="block text-sm font-medium text-white"
                >
                  Part of Speech
                </label>
                <select
                  id="partOfSpeechId"
                  name="partOfSpeechId"
                  value={wordData.partOfSpeechId}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Part of Speech</option>
                  {partsOfSpeech && partsOfSpeech.length > 0 ? (
                    partsOfSpeech.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No parts of speech available</option>
                  )}
                </select>
              </div>

              {/* Article Dropdown — only relevant for nouns */}
              <div>
                <label
                  htmlFor="articleId"
                  className="block text-sm font-medium text-white"
                >
                  Article
                  {!isNounSelected && (
                    <span className="ml-2 text-xs text-gray-400">
                      (only for nouns)
                    </span>
                  )}
                </label>
                <select
                  id="articleId"
                  name="articleId"
                  value={wordData.articleId}
                  onChange={handleChange}
                  disabled={!isNounSelected}
                  className={`input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 ${!isNounSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Article</option>
                  {articles && articles.length > 0 ? (
                    articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.name.trim() === ""
                          ? "No Article"
                          : article.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No articles available</option>
                  )}
                </select>
              </div>

              {/* Verb Attributes - Only show when part of speech is verb */}
              {partsOfSpeech
                .find((pos) => pos.id === parseInt(wordData.partOfSpeechId))
                ?.name?.toLowerCase() === "verb" && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    🔹 Verb Attributes
                  </h3>

                  {/* Conjugation Type */}
                  <div>
                    <label
                      htmlFor="verbAttributes-conjugation"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Conjugation Type
                    </label>
                    <select
                      id="verbAttributes-conjugation"
                      name="verbAttributes.conjugation"
                      value={wordData.verbAttributes.conjugation}
                      onChange={handleChange}
                      className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      <option value="REGULAR">Regular (weak)</option>
                      <option value="IRREGULAR">Irregular (strong)</option>
                    </select>
                  </div>

                  {/* Prefix Type */}
                  <div>
                    <label
                      htmlFor="verbAttributes-prefixType"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Prefix Type
                    </label>
                    <select
                      id="verbAttributes-prefixType"
                      name="verbAttributes.prefixType"
                      value={wordData.verbAttributes.prefixType}
                      onChange={handleChange}
                      className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
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
                  {wordData.verbAttributes.prefixType === "SEPARABLE" && (
                    <div>
                      <label
                        htmlFor="prefix"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                        value={wordData.prefix || ""}
                        onChange={handleChange}
                        placeholder="Enter prefix"
                        className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        The prefix will be highlighted in orange when displaying
                        the word
                      </p>
                    </div>
                  )}

                  {/* Case Requirement */}
                  <div>
                    <label
                      htmlFor="verbAttributes-caseRequirement"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Case Requirement
                    </label>
                    <select
                      id="verbAttributes-caseRequirement"
                      name="verbAttributes.caseRequirement"
                      value={wordData.verbAttributes.caseRequirement || ""}
                      onChange={handleChange}
                      className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      <option value="">Not specified</option>
                      <option value="ACCUSATIVE">Accusative (Akkusativ)</option>
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
                      checked={wordData.verbAttributes.isReflexive}
                      onChange={handleChange}
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
                      checked={wordData.verbAttributes.isModal}
                      onChange={handleChange}
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
              {partsOfSpeech
                .find((pos) => pos.id === parseInt(wordData.partOfSpeechId))
                ?.name?.toLowerCase() === "preposition" && (
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-slate-800 rounded-lg border-2 border-purple-200 dark:border-purple-600">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    🔹 Preposition Attributes
                  </h3>

                  {/* Preposition Case */}
                  <div>
                    <label
                      htmlFor="prepositionAttributes-prepositionCase"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Case Requirement
                    </label>
                    <select
                      id="prepositionAttributes-prepositionCase"
                      name="prepositionAttributes.prepositionCase"
                      value={
                        wordData.prepositionAttributes.prepositionCase || ""
                      }
                      onChange={handleChange}
                      className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
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
              {partsOfSpeech
                .find((pos) => pos.id === parseInt(wordData.partOfSpeechId))
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
                      checked={wordData.isPrepositional}
                      onChange={handleChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPrepositional"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Prepositional Adjective (e.g., abhängig von, interessiert
                      an)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                    ℹ️ Check this box for adjectives that require a specific
                    preposition. Include the preposition in the word field
                    (e.g., "abhängig von", "interessiert an")
                  </p>
                </div>
              )}

              {/* Topic Dropdown */}
              <div>
                <label
                  htmlFor="topicId"
                  className="block text-sm font-medium text-white"
                >
                  Topic
                </label>
                <select
                  id="topicId"
                  name="topicId"
                  value={wordData.topicId}
                  onChange={handleChange}
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Topic</option>
                  {topics && topics.length > 0 ? (
                    topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No topics available</option>
                  )}
                </select>
              </div>

              {/* Optional Inputs */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="synonyms"
                    className="block text-sm font-medium text-white"
                  >
                    Synonyms (comma separated, Optional)
                  </label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      id="synonyms"
                      name="synonyms"
                      value={wordData.synonyms}
                      onChange={handleChange}
                      className="input-md flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    />
                  </div>
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
                </div>

                <div>
                  <label
                    htmlFor="antonyms"
                    className="block text-sm font-medium text-white"
                  >
                    Antonyms (comma separated, Optional)
                  </label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      id="antonyms"
                      name="antonyms"
                      value={wordData.antonyms}
                      onChange={handleChange}
                      className="input-md flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    />
                  </div>
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
                </div>

                <div>
                  <label
                    htmlFor="similarWords"
                    className="block text-sm font-medium text-white"
                  >
                    Word to Watch (comma separated, Optional)
                  </label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      id="similarWords"
                      name="similarWords"
                      value={wordData.similarWords}
                      onChange={handleChange}
                      className="input-md flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                    />
                  </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2 text-white font-medium bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 my-8"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default WordForm;
