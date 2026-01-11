import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../../utils/Container";
import Pagination from "../../../utils/Pagination";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import api from "../../../axios";
import Loader from "../../../utils/Loader";
import WordListModal from "../Modals/WordListModal";
import HistoryModal from "../Modals/HistoryModal";
import { getFromStorage, setToStorage } from "../../../utils/storage";
import aiApi from "../../../AI_axios";
import { IoSearch } from "react-icons/io5";
import AIModal from "../Modals/AIModal";
import useDebounce from "../../../hooks/useDebounce";
import WordTableRow from "./WordTableRow";

// Cache key constants
const CACHE_KEY = "wordListCache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const WORDS_PER_PAGE = 40;

const UNKNOWN_TOPIC_ID = 1;
const RESTRICTED_LEVEL_ID = 6;

const WordList = () => {
  const location = useLocation();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState({
    creator: "",
    modifiers: [],
  });
  // ===
  const [filteredTopics, setFilteredTopics] = useState([]);
  // const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [levels, setLevels] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAllData, setShowAllData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const focusElement = useRef(null);
  const [showActionColumn, setShowActionColumn] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState({});
  const [searchType, setSearchType] = useState("word"); // 'word' | 'meaning'
  const [selectedWordId, setSelectedWordId] = useState(null);

  // ===================
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

  const isAdmin = useMemo(
    () => ["admin", "super_admin"].includes(userInfo.role),
    [userInfo.role]
  );

  const [favorites, setFavorites] = useState([]);

  // 	=========AI ===============
  const [aiWord, setAiWord] = useState(null);
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  // 	=========AI ===============

  const debouncedSearchValue = useDebounce(searchValue, 300);
  const cacheDebounceTimer = useRef(null);
  const aiAbortControllers = useRef(new Map());

  // useEffect for fetching favorites (Logic remains the same, good to leave)
  useEffect(() => {
    const fetchFavorites = async () => {
      //   if (
      //     (!userInfo?.id && userInfo.role !== "basic_user") ||
      //     (!userInfo?.id && userInfo.role !== "admin")
      //   )
      //     return;

      if (!userLoggedIn || !userInfo.id) return;

      try {
        const response = await api.get(`/favorite-words/${userInfo.id}`);
        setFavorites(response.data.data.map((word) => word.id));
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            setFavorites([]);
          }
        }
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [userInfo?.id, userLoggedIn]);

  const toggleFavorite = async (wordId) => {
    // Prevent concurrent requests to the same word
    if (loadingFavorites[wordId]) return;

    const isFavorite = favorites.includes(wordId);
    const previousState = favorites; // Store for rollback

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));

      // Optimistic update - update UI immediately
      if (isFavorite) {
        setFavorites((prev) => prev.filter((id) => id !== wordId));
        await api.delete(`/favorite-words/${wordId}`);
      } else {
        setFavorites((prev) => [...prev, wordId]);
        await api.post("/favorite-words", { wordId });
      }
    } catch (error) {
      // Rollback optimistic update on error
      setFavorites(previousState);

      Swal.fire({
        icon: "error",
        title: "Favorite Update Failed",
        text: error.response?.data?.message || "Could not update favorite",
      });
    } finally {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: false }));
    }
  };

  // ===================

  const [cache, setCache] = useState({
    words: [],
    levels: [],
    topics: [],
    lastUpdated: null,
  });

  // Progressive loading: Load initial batch fast, then fetch all in background
  const fetchInitialWords = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, load just 50 words for fast initial render
      const response = await api.get("/word/all?limit=50&page=1");

      const initialCache = {
        words: response.data.data.words || [],
        levels: response.data.data.levels || [],
        topics: (response.data.data.topics || []).sort((a, b) => a.id - b.id),
        lastUpdated: Date.now(),
        isPartial: true, // Flag to indicate this is not complete data
      };
      setCache(initialCache);
      setLevels(initialCache.levels);
      setTopics(initialCache.topics);
      setFilteredTopics(initialCache.topics);
      setIsLoading(false);

      // Now fetch all words in the background and update cache
      setTimeout(async () => {
        try {
          const fullResponse = await api.get("/word/all?all=true");
          const fullCache = {
            words: fullResponse.data.data.words || [],
            levels: fullResponse.data.data.levels || [],
            topics: (fullResponse.data.data.topics || []).sort(
              (a, b) => a.id - b.id
            ),
            lastUpdated: Date.now(),
            isPartial: false,
          };

          // Store in localStorage for future visits
          setToStorage(CACHE_KEY, fullCache);

          // Update state with full data
          setCache(fullCache);
          setLevels(fullCache.levels);
          setTopics(fullCache.topics);
          setFilteredTopics(fullCache.topics);

          console.log("Background fetch complete: All words loaded and cached");
        } catch (error) {
          console.error("Background fetch failed:", error);
        }
      }, 100); // Small delay to ensure UI renders first
    } catch (error) {
      console.error("Initial fetch failed:", error);
      setIsLoading(false);
    }
  }, []);

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/word/all?all=true");

      const newCache = {
        words: response.data.data.words || [],
        levels: response.data.data.levels || [],
        topics: (response.data.data.topics || []).sort((a, b) => a.id - b.id),
        lastUpdated: Date.now(),
        isPartial: false,
      };
      setCache(newCache);
      setLevels(newCache.levels);
      setTopics(newCache.topics);
      setFilteredTopics(newCache.topics);

      // Store in localStorage
      setToStorage(CACHE_KEY, newCache);
    } catch (error) {
      // Error handled silently; users see empty list if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cache from storage on mount
  useEffect(() => {
    // Check if we have cached data
    const cachedData = getFromStorage(CACHE_KEY);

    if (
      cachedData &&
      !cachedData.isPartial &&
      Date.now() - cachedData.lastUpdated < CACHE_EXPIRY
    ) {
      // Use cached data if it's complete and not expired
      console.log("Using cached data");
      setCache(cachedData);
      setLevels(cachedData.levels);
      setTopics(cachedData.topics);
      setFilteredTopics(cachedData.topics);
      setIsLoading(false);
    } else {
      // No cache or expired - use progressive loading
      console.log("Fetching fresh data with progressive loading");
      fetchInitialWords();
    }
  }, [fetchInitialWords]);

  // Listen for cache invalidation from other tabs/components (MUST be after fetchAllWords definition)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CACHE_KEY && e.newValue === null) {
        // Cache was cleared, refetch data
        console.log("Cache cleared, refetching words...");
        fetchInitialWords();
      }
    };

    const handleCacheInvalidated = () => {
      // Cache was cleared in same tab, refetch data
      console.log("Cache invalidated, refetching words...");
      fetchInitialWords();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cacheInvalidated", handleCacheInvalidated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cacheInvalidated", handleCacheInvalidated);
    };
  }, [fetchInitialWords]);

  // Effect to fetch data if cache is empty
  useEffect(() => {
    if (cache.words.length === 0 && !isLoading) {
      fetchInitialWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.words.length, isLoading]);

  // Force refresh when navigating from word creation
  useEffect(() => {
    if (location.state?.forceRefresh) {
      console.log("Force refresh triggered");
      localStorage.removeItem(CACHE_KEY);
      fetchAllWords();
      // Clear the state to prevent re-fetching on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchAllWords]);

  const allFilteredWords = useMemo(() => {
    const wordsArray = cache.words;
    let filtered = wordsArray.filter((word) => word.value?.trim());
    // Normalize strings for alphabetical sorting:
    // - remove parenthetical content (e.g. "(fast) alle" -> " alle")
    // - strip remaining punctuation/extra characters
    // - collapse spaces and lowercase for consistent comparison
    const normalizeForSort = (str) => {
      if (!str) return "";
      try {
        return String(str)
          .replace(/\(.*?\)/g, "")
          .replace(/[^\p{L}\p{N}\s-]/gu, " ")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      } catch (e) {
        return String(str).toLowerCase();
      }
    };

    const compareNormalized = (a, b) => {
      const na = normalizeForSort(a || "");
      const nb = normalizeForSort(b || "");
      return na.localeCompare(nb, "de", { sensitivity: "base" });
    };
    const defaultTopic = topics.find((topic) => topic.id === UNKNOWN_TOPIC_ID);
    const defaultTopicName = defaultTopic?.name;

    // 1. Level Filter
    if (selectedLevel) {
      filtered = filtered.filter((word) => word.level?.level === selectedLevel);
    }

    // 2. Topic Filter
    if (selectedTopic) {
      filtered = filtered.filter((word) => {
        const hasNoMeaning = !word.meaning?.length;
        const hasNoTopic = !word.topic;
        return (
          word.topic?.name === selectedTopic ||
          (selectedTopic === defaultTopicName && hasNoMeaning && hasNoTopic)
        );
      });
    }

    // 3. Search Filter (Uses the debounced value)
    if (debouncedSearchValue.trim().length > 0) {
      const lower = debouncedSearchValue.trim().toLowerCase();

      filtered = filtered.filter((word) => {
        if (searchType === "word") {
          const lowerWord = lower;

          // Check both singular (value) and plural (pluralForm)
          const singular = word.value?.toLowerCase() || "";
          const plural = word.pluralForm?.toLowerCase() || "";

          return singular.includes(lowerWord) || plural.includes(lowerWord);
        }

        if (searchType === "meaning") {
          return word.meaning?.join(" ").toLowerCase().includes(lower);
        }

        return true;
      });
    }

    // Sort alphabetically by normalized word value so entries starting
    // with punctuation or parentheses don't float to the top.
    filtered.sort((x, y) => compareNormalized(x.value, y.value));

    return filtered;
  }, [
    cache.words,
    selectedLevel,
    selectedTopic,
    debouncedSearchValue,
    searchType,
    topics,
  ]);

  useEffect(() => {
    const totalWords = allFilteredWords.length;
    let newTotalPages = 1;

    if (!showAllData) {
      newTotalPages = Math.ceil(totalWords / WORDS_PER_PAGE);
      if (newTotalPages === 0) newTotalPages = 1;
    }

    setTotalPages(newTotalPages);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [allFilteredWords.length, showAllData, currentPage]);

  // The useMemo for paginatedWords can then be simplified to:
  const paginatedWords = useMemo(() => {
    if (showAllData) return allFilteredWords;
    return allFilteredWords.slice(
      (currentPage - 1) * WORDS_PER_PAGE,
      currentPage * WORDS_PER_PAGE
    );
  }, [allFilteredWords, currentPage, showAllData]);

  // Handlers remain the same, but simplified input handler
  const handleSearchInputChange = useCallback((event) => {
    const value = event.target.value.trim(); // Remove both leading and trailing spaces
    setSearchValue(value);
  }, []);

  // Create a Map for O(1) word lookup by ID (optimized from O(n) find)
  const wordsByIdMap = useMemo(() => {
    const map = new Map();
    cache.words.forEach((word) => map.set(word.id, word));
    return map;
  }, [cache.words]);

  // Memoized modal handlers
  // const openModal = useCallback((word) => {
  //   setSelectedWord(word);
  //   setIsModalOpen(true);
  // }, []);
  // ========================new ============

  const openModal = useCallback((word) => {
    setSelectedWordId(word.id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedWordId(null);
    setIsModalOpen(false);
  }, []);

  const selectedWord = useMemo(() => {
    if (!selectedWordId) return null;
    return wordsByIdMap.get(selectedWordId) || null;
  }, [selectedWordId, wordsByIdMap]);

  // =========================================
  // const closeModal = useCallback(() => {
  //   setSelectedWord(null);
  //   setIsModalOpen(false);
  // }, []);

  const openWordInModal = useCallback(
    (wordValue) => {
      const word = cache.words.find(
        (w) =>
          w.value === wordValue ||
          (w.synonyms && w.synonyms.includes(wordValue))
        // w.synonyms?.some((s) => s.value === wordValue)
      );

      if (word) {
        openModal(word);
      } else {
        Swal.fire("Not Found", "The word or synonym doesn't exist.", "error");
      }
    },
    [cache.words, openModal]
  );

  const levelToTopicsMap = useMemo(() => {
    const map = new Map();
    cache.words.forEach((word) => {
      const levelName = word.level?.level;
      const topicName = word.topic?.name;
      if (levelName && topicName) {
        if (!map.has(levelName)) {
          map.set(levelName, new Set());
        }
        map.get(levelName).add(topicName);
      }
    });
    return map;
  }, [cache.words]);

  const handleLevelChange = useCallback(
    (e) => {
      const selected = e.target.value;
      setSelectedLevel(selected);
      setSelectedTopic("");
      setCurrentPage(1);

      if (selected === "") {
        setFilteredTopics(topics);
      } else {
        const topicNamesForLevel = levelToTopicsMap.get(selected) || new Set();
        const matchedTopics = topics.filter((topic) =>
          topicNamesForLevel.has(topic.name)
        );
        setFilteredTopics(matchedTopics);
      }
    },
    [topics, levelToTopicsMap]
  );

  useEffect(() => {
    if (topics.length > 0) {
      setFilteredTopics(topics);
    }
  }, [topics]);

  const handleTopicChange = useCallback((e) => {
    setSelectedTopic(e.target.value);
    setCurrentPage(1); // Reset page on filter change
  }, []);

  // Learning mode implementation (Logic remains the same, good to leave)
  const handleDelete = useCallback(
    (wordId, wordValue) => {
      if (!userInfo.id) {
        Swal.fire("Error", "User not logged in or user ID missing.", "error");
        return;
      }
      Swal.fire({
        title: "Are you sure?",
        html: `You won't be able to revert this! Delete <strong style="color: #dc2626; font-weight: 800;">"${wordValue}"</strong>?`,
        icon: "warning",
        input: "text",
        inputPlaceholder: "Type password",
        inputValidator: (value) =>
          value === import.meta.env.VITE_DELETE_PASSWORD
            ? null
            : "Wrong Password!",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Delete",
      }).then((result) => {
        if (result.isConfirmed) {
          api
            .delete(`/word/delete/${wordId}`)
            .then(() => {
              // Update cache directly to avoid refetching all data
              setCache((prev) => ({
                ...prev,
                words: prev.words.filter((word) => word.id !== wordId),
                lastUpdated: Date.now(),
              }));

              Swal.fire({
                title: "Deleted!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });
            })
            .catch((error) => {
              Swal.fire("Error!", "Something went wrong.", "error");
            });
        }
      });
    },
    [userInfo.id, setCache]
  );

  //learning mode
  const toggleLearningMode = useCallback(() => {
    setLearningMode((prev) => !prev);
    setRevealedWords([]);
  }, []);

  const revealMeaning = useCallback((wordId) => {
    setRevealedWords((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId]
    );
  }, []);

  const handleArrowKeyPress = useCallback(
    (e, index) => {
      const keyActions = {
        ArrowRight: () => index + 1,
        ArrowDown: () => index + 1,
        ArrowLeft: () => index - 1,
        ArrowUp: () => index - 1,
      };

      const action = keyActions[e.key];
      if (action) {
        e.preventDefault();
        const newIndex = action();
        if (newIndex >= 0 && newIndex < paginatedWords.length) {
          revealMeaning(paginatedWords[newIndex].id);
          setCurrentIndex(newIndex);
        }
      }
    },
    [paginatedWords, revealMeaning]
  );

  // Focus management
  useEffect(() => {
    if (currentIndex !== null && focusElement.current) {
      focusElement.current.focus();
    }
  }, [currentIndex]);

  // Cleanup abort controllers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      aiAbortControllers.current.forEach((controller) => {
        try {
          controller.abort();
        } catch (e) {
          // Ignore errors if already aborted
        }
      });
      aiAbortControllers.current.clear();
    };
  }, []);

  const allowedLevels = useMemo(
    () =>
      levels.filter((level) => {
        if (level.id === RESTRICTED_LEVEL_ID && !isAdmin) {
          return false;
        }
        return true;
      }),
    [levels, isAdmin]
  );

  const levelOptions = useMemo(
    () =>
      allowedLevels.map((level) => (
        <option
          key={level.id}
          value={level.level}
          className="text-md md:text-xl lg:text-lg font-custom1 bg-gray-700 text-white"
        >
          {level.level}
        </option>
      )),
    [allowedLevels]
  );

  // Update the toggleView function

  // Memoize sorted topics separately to avoid recreating JSX on every render
  const sortedTopicData = useMemo(() => {
    const levelIdToLevelMap = new Map(levels.map((level) => [level.id, level]));

    const sorted = [...filteredTopics].sort((a, b) => {
      if (a.id === UNKNOWN_TOPIC_ID) return 1;
      if (b.id === UNKNOWN_TOPIC_ID) return -1;

      const levelA = levelIdToLevelMap.get(a.levelId);
      const levelB = levelIdToLevelMap.get(b.levelId);

      if (levelA && levelB) {
        return levelA.id - levelB.id;
      }
      return 0;
    });

    return { sorted, levelIdToLevelMap };
  }, [filteredTopics, levels]);

  // Create JSX options separately - still memoized but simpler
  const topicOptions = useMemo(() => {
    const { sorted: sortedTopics, levelIdToLevelMap } = sortedTopicData;
    const baseClass =
      "text-md md:text-xl lg:text-lg font-custom1 bg-gray-700 text-white";

    let lastLevelId = null;
    const optionsWithSeparators = [];

    sortedTopics.forEach((topic) => {
      const level = levelIdToLevelMap.get(topic.levelId);

      // Add separator when level changes
      if (level && level.id !== lastLevelId && lastLevelId !== null) {
        optionsWithSeparators.push(
          <option
            key={`separator-${level.id}`}
            disabled
            className="bg-gray-700 text-gray-400 text-center border-t border-gray-500 cursor-default"
          >
            -------------------------------------
          </option>
        );
      }

      lastLevelId = level ? level.id : null;

      // Special handling for Unknown topic
      if (topic.id === UNKNOWN_TOPIC_ID) {
        const displayLevel = selectedLevel ? selectedLevel : "All";
        optionsWithSeparators.push(
          <option key={topic.id} value={topic.name} className={baseClass}>
            {displayLevel} ➡️ {topic.name}
          </option>
        );
        return;
      }

      const levelName = level ? level.level : "Unknown Level";
      optionsWithSeparators.push(
        <option key={topic.id} value={topic.name} className={baseClass}>
          {levelName} {level ? " ➡️" : ""} {topic.name}
        </option>
      );
    });

    // Add spacing option
    if (optionsWithSeparators.length > 0) {
      optionsWithSeparators.push(
        <option
          key="bottom-space"
          disabled
          className="bg-gray-700 h-4 cursor-default"
        >
          &nbsp;
        </option>
      );
    }

    return optionsWithSeparators;
  }, [sortedTopicData, selectedLevel]);

  const toggleView = useCallback(() => {
    setShowAllData((prev) => !prev);
    setCurrentPage(1); // Reset page on view change
  }, []); // Dependencies are removed because useMemo handles the re-filtering

  // 	==============AI===============

  const generateParagraph = async (word) => {
    if (!userInfo?.id) {
      Swal.fire(
        "Not Logged In",
        "You must be logged in to generate paragraphs",
        "warning"
      );
      return;
    }

    // Cancel any existing request for this word
    const existingController = aiAbortControllers.current.get(word.id);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    aiAbortControllers.current.set(word.id, abortController);

    try {
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: true }));

      const response = await aiApi.post(
        `/paragraphs/generate`,
        {
          userId: userInfo.id,
          wordId: word.id,
          word: word.value,
          level: word.level?.level || "A1",
          language: "de",
        },
        {
          signal: abortController.signal,
        }
      );

      const aiMeanings = response.data.meanings || [];
      const sentences = response.data.otherSentences || [];
      const paragraph = response.data.paragraph;
      const wordId = response.data.wordId || word.id; // depends on AI API response

      // 🔑 Find the full word object in your /all words cache
      const fullWord = cache.words.find((w) => w.id === wordId);

      setAiWord({
        ...(fullWord || { id: word.id, value: word.value }),
        aiMeanings,
        sentences:
          sentences.length > 0 ? sentences : paragraph.split(/(?<=[.!?])\s+/),
      });

      setSelectedParagraph(paragraph);
      setIsAIModalOpen(true);
    } catch (error) {
      // Ignore abort errors (user cancelled request or new request initiated)
      if (error.name === "AbortError") {
        return;
      }

      const errorMessage = error.response?.data?.error || error.message;
      if (error.response?.status === 403) {
        Swal.fire("Limit Reached", errorMessage, "warning");
      } else {
        Swal.fire("Error", "Failed to generate paragraph", "error");
      }
    } finally {
      aiAbortControllers.current.delete(word.id);
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: false }));
    }
  };

  // 	==============AI===============
  const handleResetFilters = useCallback(() => {
    // Reset all filter-related states
    setSearchValue("");
    setSelectedLevel("");
    setSelectedTopic("");
    setCurrentPage(1);
    setShowAllData(false);
    setFilteredTopics(topics); // Reset filtered topics back to the full list
  }, [topics]);

  return (
    <Container>
      <h2 className="text-3xl font-bold font-mono text-white my-2 text-center hidden md:block">
        <div className="flex justify-start">
          <Link to="/quiz" className="btn btn-sm btn-info">
            Play Quiz
          </Link>
        </div>
        <p>Vocabulary Library</p> <br />
        <p className="text-xs text-pink-600 ">
          {" "}
          {userLoggedIn &&
            (userInfo.role === "admin" || userInfo.role === "super_admin") &&
            cache.words.length}
        </p>
      </h2>

      {/* =============radio buttons ========== */}
      <div className="flex justify-between text-white">
        <div className="flex gap-4 items-center -mb-3 md:mb-2 lg:mb-2">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="word"
              checked={searchType === "word"}
              onChange={(e) => setSearchType(e.target.value)}
            />
            <span>By Word</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="meaning"
              checked={searchType === "meaning"}
              onChange={(e) => setSearchType(e.target.value)}
            />
            <span>By Meaning</span>
          </label>
        </div>
        {/* ===============showing words by page ==================  */}
        <div className="flex justify-end gap-2 -mb-3 md:mb-2 lg:mb-2">
          <div className="w-full">
            <div className="flex justify-end  mr-0 ">
              {(searchValue || selectedLevel || selectedTopic) && (
                <p
                  onClick={handleResetFilters}
                  className=" text-red-600 font-bold  underline cursor-pointer"
                >
                  Reset Filter
                </p>
              )}
            </div>
          </div>
          {/* ===============showing words by page ==================  */}
          <p className="text-md text-info font-bold whitespace-nowrap md:ml-2 hidden md:block w-36 text-end">
            {paginatedWords.length} words
          </p>
        </div>
      </div>
      {/* =============radio buttons ========== */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4 md:mt-0 ">
        <div className="w-full space-y-2">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder={
                searchType === "word" ? "Search by word" : "Search by meaning"
              }
              value={searchValue}
              onChange={handleSearchInputChange}
              className="border rounded px-2 py-2 w-full pl-10"
            />
            <IoSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={22}
            />
          </div>
        </div>

        {/* =====select search type======== */}

        {/* Level Select */}
        <div className="w-full">
          <div className="flex justify-center md:justify-start">
            <select
              value={selectedLevel}
              onChange={handleLevelChange}
              className="border rounded px-4 py-2 w-full"
            >
              <option value="">All Levels</option>
              {levelOptions}
            </select>
          </div>
        </div>

        {/* Topic Select */}
        <div className="w-full ">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <select
              value={selectedTopic}
              onChange={handleTopicChange}
              className="border rounded px-4 py-2 w-full  "
            >
              {/* <option value=""> `All Topics for {selectedLevel} Level`</option> */}
              <option value="">
                {" "}
                {selectedLevel ? `Topics for  ${selectedLevel} ` : "All Topics"}
              </option>

              {topicOptions}
            </select>
          </div>
        </div>
      </div>

      {/* Pagination and controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        showAllData={showAllData}
        toggleView={toggleView}
        toggleLearningMode={toggleLearningMode}
        learningMode={learningMode}
        setAction={setShowActionColumn}
        showAction={showActionColumn}
        totalWords={paginatedWords.length}
      />

      {/* Table content */}
      {isLoading ? (
        <div className="flex justify-center items-center mt-24 min-h-[45vh] md:min-h-[55vh] lg:min-h-[55vh] ">
          <Loader loading={isLoading} />
        </div>
      ) : (
        <div className="min-h-screen ">
          <div className="overflow-x-auto border-b border-gray-400 ">
            <table className="w-full  border-collapse mt-2 ">
              <thead>
                <tr className="bg-stone-800 text-sm md:text-xl lg:text-xl text-white ">
                  <th className=" border-gray-400  py-2  text-sm md:text-lg lg:text-lg    text-center w-[5%] md:w-[3%] lg:w-[3%] rounded-tl-md">
                    Article
                  </th>
                  <th className="border-l  py-2 border-gray-400 border-dotted   text-center w-[15%] md:w-[10%] lg:w-[10%] ">
                    Word
                  </th>

                  <th className="border-l  py-2 border-gray-400 border-dotted   text-center w-[10%] md:w-[25%] lg:w-[25%]">
                    Meaning
                  </th>
                  <th className="border-l  py-2 border-gray-400 border-dotted  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Synonym
                  </th>
                  <th className="border-l  py-2 border-gray-400 border-dotted   text-center hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Antonym
                  </th>
                  <th className="border-l  py-2 border-gray-400 border-dotted text-center hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Word to Watch
                  </th>
                  <th
                    className={`border-l border-dotted hidden md:table-cell lg:table-cell  py-2 border-gray-400 text-sm md:text-lg lg:text-lg    text-center  w-[3%] md:w-[3%] lg:w-[3%] ${
                      userLoggedIn ? "" : "rounded-tr-md"
                    }`}
                  >
                    Level
                  </th>
                  <th
                    className={`border-l  py-2 border-dotted border-gray-400  text-center ${
                      showActionColumn ? "table-cell" : "hidden"
                    } `}
                  >
                    Action
                  </th>
                  {userLoggedIn && (
                    // (userInfo.role === "basic_user" ||
                    //   userInfo.role === "admin" ||
                    //   userInfo.role === "super_admin") && (
                    <th
                      className={`border-l border-dotted border-gray-400 text-sm md:text-lg lg:text-lg   py-2 text-center  w-[3%] md:w-[3%] lg:w-[3%] ${
                        userInfo.role === "basic_user" ? "rounded-tr-md" : ""
                      }`}
                    >
                      Fav
                    </th>
                  )}
                  {userLoggedIn &&
                    (userInfo.role === "super_admin" ||
                      userInfo.role === "admin") && (
                      <>
                        <th
                          className={`border-l py-2 border-dotted hidden md:table-cell lg:table-cell border-gray-400 text-sm md:text-lg lg:text-lg  text-center   w-[3%] md:w-[3%] lg:w-[3%] ${
                            userInfo.role !== "basic_user"
                              ? "rounded-tr-md"
                              : ""
                          }`}
                        >
                          #
                        </th>
                      </>
                    )}
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {paginatedWords.length > 0 ? (
                  paginatedWords.map((word, index) => (
                    <WordTableRow
                      key={word.id}
                      word={word}
                      index={index}
                      learningMode={learningMode}
                      currentIndex={currentIndex}
                      revealedWords={revealedWords}
                      showActionColumn={showActionColumn}
                      userLoggedIn={userLoggedIn}
                      userInfo={userInfo}
                      favorites={favorites}
                      loadingFavorites={loadingFavorites}
                      loadingParagraphs={loadingParagraphs}
                      focusElement={focusElement}
                      revealMeaning={revealMeaning}
                      openModal={openModal}
                      generateParagraph={generateParagraph}
                      handleArrowKeyPress={handleArrowKeyPress}
                      openWordInModal={openWordInModal}
                      handleDelete={handleDelete}
                      toggleFavorite={toggleFavorite}
                      setSelectedHistory={setSelectedHistory}
                      setIsHistoryModalOpen={setIsHistoryModalOpen}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4 font-bold text-gray-500 h-96 align-middle text-xl sm:text-2xl"
                    >
                      No words available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedWord && (
        <WordListModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          selectedWord={selectedWord}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          loadingFavorites={loadingFavorites}
        />
      )}

      {/* Bottom pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        showAllData={showAllData}
        toggleView={toggleView}
        toggleLearningMode={toggleLearningMode}
        learningMode={learningMode}
        setAction={setShowActionColumn}
        showAction={showActionColumn}
        totalWords={paginatedWords.length}
      />

      {/* ========= */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        creator={selectedHistory.creator}
        modifiers={selectedHistory.modifiers}
      />
      {/* ========= */}
      {/* =======AI modal=============== */}

      <AIModal
        isOpen={isAIModalOpen}
        aiWord={aiWord}
        selectedParagraph={selectedParagraph}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* ===================report========= */}
    </Container>
  );
};

export default React.memo(WordList);
