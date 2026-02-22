import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";

import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../../utils/Container";
import Pagination from "../../../utils/Pagination";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import api from "../../../axios";
import Loader from "../../../utils/Loader";
import { getFromStorage, setToStorage } from "../../../utils/storage";
import aiApi from "../../../AI_axios";
import { IoSearch } from "react-icons/io5";
import useDebounce from "../../../hooks/useDebounce";
import WordTableRow from "./WordTableRow";

// Lazy load modals for better performance
const WordListModal = lazy(() => import("../Modals/WordListModal"));
const HistoryModal = lazy(() => import("../Modals/HistoryModal"));
const AIModal = lazy(() => import("../Modals/AIModal"));

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
    [userInfo.role],
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

      // Store partial cache immediately so it persists on refresh
      setToStorage(CACHE_KEY, initialCache);

      // Now fetch all words in the background and update cache
      setTimeout(async () => {
        try {
          const fullResponse = await api.get("/word/all?all=true");
          const fullCache = {
            words: fullResponse.data.data.words || [],
            levels: fullResponse.data.data.levels || [],
            topics: (fullResponse.data.data.topics || []).sort(
              (a, b) => a.id - b.id,
            ),
            lastUpdated: Date.now(),
            isPartial: false,
          };

          // Store full data in IndexedDB for future visits
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
  // ====================================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        // Attempt to get cached data
        const cachedData = await getFromStorage(CACHE_KEY);

        if (cachedData) {
          const isExpired = Date.now() - cachedData.lastUpdated >= CACHE_EXPIRY;

          if (!isExpired && !cachedData.isPartial) {
            // Fresh complete cache - use it immediately
            console.log("Using fresh cached data");
            setCache(cachedData);
            setLevels(cachedData.levels);
            setTopics(cachedData.topics);
            setFilteredTopics(cachedData.topics);
            setIsLoading(false);
            return;
          }

          if (isExpired && !cachedData.isPartial) {
            console.log("Using stale cache, refreshing in background");
            setCache(cachedData);
            setLevels(cachedData.levels);
            setTopics(cachedData.topics);
            setFilteredTopics(cachedData.topics);
            setIsLoading(false);

            setTimeout(() => fetchAllWords(), 100);
            return;
          }

          if (cachedData.isPartial) {
            console.log("Using partial cache, fetching remaining data");
            setCache(cachedData);
            setLevels(cachedData.levels);
            setTopics(cachedData.topics);
            setFilteredTopics(cachedData.topics);
            setIsLoading(false);

            setTimeout(async () => {
              try {
                const fullResponse = await api.get("/word/all?all=true");
                const fullCache = {
                  words: fullResponse.data.data.words || [],
                  levels: fullResponse.data.data.levels || [],
                  topics: (fullResponse.data.data.topics || []).sort(
                    (a, b) => a.id - b.id,
                  ),
                  lastUpdated: Date.now(),
                  isPartial: false,
                };
                setToStorage(CACHE_KEY, fullCache);
                setCache(fullCache);
                setLevels(fullCache.levels);
                setTopics(fullCache.topics);
                setFilteredTopics(fullCache.topics);
                console.log("Background fetch complete from partial cache");
              } catch (error) {
                console.error("Background fetch failed:", error);
              }
            }, 100);
            return;
          }
        }

        // No cache at all - progressive fetch
        console.log(
          "No cache found, fetching fresh data with progressive loading",
        );
        fetchInitialWords();
      } catch (err) {
        // <-- Catch any errors from getFromStorage
        console.error("Failed to load cached data:", err);
        // Proceed to fetch fresh data anyway
        fetchInitialWords();
      }
    };

    loadData();
  }, [fetchInitialWords, fetchAllWords]);

  // ====================================================================
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
          // Check both singular (value) and plural (pluralForm)
          const singular = word.value?.toLowerCase() || "";
          const plural = word.pluralForm?.toLowerCase() || "";

          return singular.includes(lower) || plural.includes(lower);
        }

        if (searchType === "meaning") {
          // Optimized: Check meanings without joining if possible
          if (!word.meaning?.length) return false;

          // For single word searches, check each meaning individually (faster)
          return word.meaning.some((meaning) =>
            meaning.toLowerCase().includes(lower),
          );
        }

        return true;
      });
    }

    // Sort by relevance when searching, otherwise alphabetically
    if (debouncedSearchValue.trim().length > 0) {
      const query = debouncedSearchValue.trim().toLowerCase();

      filtered.sort((x, y) => {
        const getRelevanceScore = (word) => {
          const singular = word.value?.toLowerCase() || "";
          const plural = word.pluralForm?.toLowerCase() || "";

          // Check exact matches
          if (singular === query || plural === query) return 100;

          // Check starts with
          if (singular.startsWith(query) || plural.startsWith(query)) return 50;

          // Check contains
          if (singular.includes(query) || plural.includes(query)) return 10;

          // If meaning search
          if (
            searchType === "meaning" &&
            word.meaning?.some((m) => m.toLowerCase() === query)
          )
            return 100;
          if (
            searchType === "meaning" &&
            word.meaning?.some((m) => m.toLowerCase().startsWith(query))
          )
            return 50;
          if (
            searchType === "meaning" &&
            word.meaning?.some((m) => m.toLowerCase().includes(query))
          )
            return 10;

          return 0;
        };

        const scoreX = getRelevanceScore(x);
        const scoreY = getRelevanceScore(y);

        // Higher score first
        if (scoreX !== scoreY) return scoreY - scoreX;

        // If same score, sort alphabetically
        return compareNormalized(x.value, y.value);
      });
    } else {
      // Sort alphabetically by normalized word value so entries starting
      // with punctuation or parentheses don't float to the top.
      filtered.sort((x, y) => compareNormalized(x.value, y.value));
    }

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
    const newTotalPages = Math.max(1, Math.ceil(totalWords / WORDS_PER_PAGE));
    setTotalPages(newTotalPages);
  }, [allFilteredWords.length]);

  // The useMemo for paginatedWords can then be simplified to:
  const paginatedWords = useMemo(() => {
    return allFilteredWords.slice(
      (currentPage - 1) * WORDS_PER_PAGE,
      currentPage * WORDS_PER_PAGE,
    );
  }, [allFilteredWords, currentPage]);

  // Handlers remain the same, but simplified input handler
  const handleSearchInputChange = useCallback((event) => {
    const value = event.target.value; // Allow spaces for multi-word searches
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
          (w.synonyms && w.synonyms.includes(wordValue)) ||
          (w.antonyms && w.antonyms.includes(wordValue)) ||
          (w.similarWords && w.similarWords.includes(wordValue)),
      );

      if (word) {
        openModal(word);
      } else {
        Swal.fire(
          "Not Found",
          "The word doesn't exist in your word list.",
          "error",
        );
      }
    },
    [cache.words, openModal],
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
          topicNamesForLevel.has(topic.name),
        );
        setFilteredTopics(matchedTopics);
      }
    },
    [topics, levelToTopicsMap],
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
    [userInfo.id, setCache],
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
        : [...prev, wordId],
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
    [paginatedWords, revealMeaning],
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
    [levels, isAdmin],
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
    [allowedLevels],
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
          </option>,
        );
      }

      lastLevelId = level ? level.id : null;

      // Special handling for Unknown topic
      if (topic.id === UNKNOWN_TOPIC_ID) {
        const displayLevel = selectedLevel ? selectedLevel : "All";
        optionsWithSeparators.push(
          <option key={topic.id} value={topic.name} className={baseClass}>
            {displayLevel} ➡️ {topic.name}
          </option>,
        );
        return;
      }

      const levelName = level ? level.level : "Unknown Level";
      optionsWithSeparators.push(
        <option key={topic.id} value={topic.name} className={baseClass}>
          {levelName} {level ? " ➡️" : ""} {topic.name}
        </option>,
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
        </option>,
      );
    }

    return optionsWithSeparators;
  }, [sortedTopicData, selectedLevel]);

  // 	==============AI===============

  const generateParagraph = async (word) => {
    if (!userInfo?.id) {
      Swal.fire(
        "Not Logged In",
        "You must be logged in to generate paragraphs",
        "warning",
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
        },
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
      const isLimitError =
        error.response?.status === 403 ||
        errorMessage?.toLowerCase().includes("limit") ||
        errorMessage?.toLowerCase().includes("exceeded");
      const isServiceError =
        (error.response?.status === 500 ||
          error.response?.status === 429 ||
          error.response?.status === 503) &&
        !isLimitError;

      if (isLimitError) {
        Swal.fire("Limit Reached", errorMessage, "warning");
      } else if (isServiceError) {
        Swal.fire(
          "Service Temporarily Unavailable",
          errorMessage || "AI service is busy. Please try again in a moment.",
          "info",
        );
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
    setFilteredTopics(topics); // Reset filtered topics back to the full list
  }, [topics]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchValue, selectedLevel, selectedTopic]);

  return (
    <Container>
      {/* Modern Header Section */}
      <div className="text-center mb-8 mt-8">
        <div className="flex justify-between items-center mb-6 ml-2">
          <Link
            to="/quiz"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-2 md:px-6 lg:px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/50"
          >
            🎮 Play Quiz
          </Link>
          {userLoggedIn &&
            (userInfo.role === "admin" || userInfo.role === "super_admin") && (
              <span className="text-sm text-pink-400 font-bold mr-2">
                Total: {cache.words.length} words
              </span>
            )}
        </div>
        <div className="mb-4">
          <span className="hidden md:inline-block lg:inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
            📚 Learn Vocabulary
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-4">
          Vocabulary Library
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto hidden md:inline-block lg:inline-block">
          Explore and master German vocabulary with interactive learning tools
        </p>
        <div className="hidden md:flex lg:flex justify-center mt-6">
          <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* =============radio buttons ========== */}
      <div className="flex justify-between text-white mb-4 bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-2 px-4 mx-0 md:mx-2 lg:mx-2">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors">
            <input
              type="radio"
              name="searchType"
              value="word"
              checked={searchType === "word"}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="font-medium">By Word</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors">
            <input
              type="radio"
              name="searchType"
              value="meaning"
              checked={searchType === "meaning"}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-4 h-4 accent-purple-500"
            />
            <span className="font-medium">By Meaning</span>
          </label>
        </div>
        {/* ===============showing words by page ==================  */}
        <div className="flex items-center gap-4">
          {(searchValue || selectedLevel || selectedTopic) && (
            <button
              onClick={handleResetFilters}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Reset Filters
            </button>
          )}
          {/* ===============showing words by page ==================  */}
          <p className="text-md font-bold whitespace-nowrap hidden md:block px-4 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-full">
            {paginatedWords.length} words
          </p>
        </div>
      </div>
      {/* =============radio buttons ========== */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6 mx-0 md:mx-2 lg:mx-2">
        <div className="w-full space-y-2">
          {/* Search input */}
          <div className="relative">
            <label htmlFor="word-search" className="sr-only">
              {searchType === "word" ? "Search by word" : "Search by meaning"}
            </label>
            <input
              id="word-search"
              type="text"
              placeholder={
                searchType === "word" ? "Search by word" : "Search by meaning"
              }
              value={searchValue}
              onChange={handleSearchInputChange}
              className="border border-gray-600 bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 w-full pl-12 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
              aria-label={
                searchType === "word" ? "Search by word" : "Search by meaning "
              }
            />
            <IoSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
              size={22}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* =====select search type======== */}

        {/* Level Select */}
        <div className="w-full ">
          <div className="flex justify-center md:justify-start">
            <label htmlFor="level-select" className="sr-only">
              Filter by level
            </label>
            <select
              id="level-select"
              value={selectedLevel}
              onChange={handleLevelChange}
              className="border border-gray-600 bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 w-full text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
              aria-label="Filter words by level"
            >
              <option value="">All Levels</option>
              {levelOptions}
            </select>
          </div>
        </div>

        {/* Topic Select */}
        <div className="w-full ">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <label htmlFor="topic-select" className="sr-only">
              Filter by topic
            </label>
            <select
              id="topic-select"
              value={selectedTopic}
              onChange={handleTopicChange}
              className="border border-gray-600 bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 w-full text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all"
              aria-label="Filter words by topic"
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/30 rounded-2xl p-0 md:p-4 lg:p-4">
          <div className="overflow-x-auto border border-gray-700/50 rounded-2xl shadow-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-sm md:text-xl lg:text-xl text-white">
                  <th className="py-3 text-sm md:text-lg lg:text-lg text-center text-orange-400 font-bold w-[5%] md:w-[3%] lg:w-[3%] rounded-tl-xl border-b border-gray-700">
                    Art.
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-blue-400 font-bold w-[15%] md:w-[10%] lg:w-[10%] border-b">
                    Word
                  </th>

                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-purple-400 font-bold w-[10%] md:w-[25%] lg:w-[25%] border-b">
                    Meaning
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-cyan-400 font-bold hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Synonym
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-pink-400 font-bold hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Antonym
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-green-400 font-bold hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Word to Watch
                  </th>
                  <th
                    className={`border-l border-dotted hidden md:table-cell lg:table-cell py-3 border-gray-700 text-sm md:text-lg lg:text-lg text-center text-yellow-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b ${
                      userLoggedIn ? "" : "rounded-tr-xl"
                    }`}
                  >
                    Level
                  </th>
                  <th
                    className={`border-l py-3 border-dotted border-gray-700 text-center text-indigo-400 font-bold border-b ${
                      showActionColumn ? "table-cell" : "hidden"
                    } `}
                  >
                    Action
                  </th>
                  <th
                    className={`border-l border-dotted border-gray-700 text-sm md:text-lg lg:text-lg py-3 text-center text-red-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b ${
                      !userLoggedIn ? "rounded-tr-xl" : ""
                    }`}
                  >
                    ❤️
                  </th>
                  {userLoggedIn &&
                    (userInfo.role === "super_admin" ||
                      userInfo.role === "admin") && (
                      <>
                        <th
                          className={`border-l py-3 border-dotted hidden md:table-cell lg:table-cell border-gray-700 text-sm md:text-lg lg:text-lg text-center text-teal-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b ${
                            userInfo.role !== "basic_user"
                              ? "rounded-tr-xl"
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
        <Suspense fallback={<div />}>
          <WordListModal
            isOpen={isModalOpen}
            closeModal={closeModal}
            selectedWord={selectedWord}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            loadingFavorites={loadingFavorites}
          />
        </Suspense>
      )}

      {/* Bottom pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        toggleLearningMode={toggleLearningMode}
        learningMode={learningMode}
        setAction={setShowActionColumn}
        showAction={showActionColumn}
        totalWords={paginatedWords.length}
      />

      {/* ========= */}
      {isHistoryModalOpen && (
        <Suspense fallback={<div />}>
          <HistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            creator={selectedHistory.creator}
            modifiers={selectedHistory.modifiers}
          />
        </Suspense>
      )}
      {/* ========= */}
      {/* =======AI modal=============== */}
      {isAIModalOpen && (
        <Suspense fallback={<div />}>
          <AIModal
            isOpen={isAIModalOpen}
            aiWord={aiWord}
            selectedParagraph={selectedParagraph}
            onClose={() => setIsAIModalOpen(false)}
          />
        </Suspense>
      )}

      {/* ===================report========= */}
    </Container>
  );
};

export default WordList;
