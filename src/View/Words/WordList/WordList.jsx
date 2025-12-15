import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../../utils/Container";
import Pagination from "../../../utils/Pagination";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import api from "../../../axios";
import Loader from "../../../utils/Loader";
import { pronounceWord } from "../../../utils/wordPronounciation";
import WordListModal from "../Modals/WordListModal";
import HistoryModal from "../Modals/HistoryModal";
import { getFromStorage, setToStorage } from "../../../utils/storage";
import FavoriteButton from "../Modals/FavoriteButton";
import aiApi from "../../../AI_axios";
import { PuffLoader } from "react-spinners";
import { IoSearch } from "react-icons/io5";
import AIModal from "../Modals/AIModal";
import useDebounce from "../../../hooks/useDebounce";

// Cache key constants
const CACHE_KEY = "wordListCache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const WORDS_PER_PAGE = 40;

const UNKNOWN_TOPIC_ID = 1;
const RESTRICTED_LEVEL_ID = 6;

const WordList = () => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState({
    creator: "",
    modifiers: [],
  });
  // ===
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
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
  const [generatedParagraphs, setGeneratedParagraphs] = useState({});
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // 	=========AI ===============

  const debouncedSearchValue = useDebounce(searchValue, 300);

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
          } else {
            console.error("Error fetching favorites:", error.response.data);
          }
        } else {
          console.error("Error fetching favorites:", error.message);
        }
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [userInfo?.id, userLoggedIn]);

  const toggleFavorite = async (wordId) => {
    const isFavorite = favorites.includes(wordId);
    const userId = userInfo.id;

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));
      if (isFavorite) {
        await api.delete(`/favorite-words/${wordId}`, {
          data: { userId, wordId },
          headers: {
            "Content-Type": "application/json",
          },
        });
        setFavorites((prev) => prev.filter((id) => id !== wordId));
      } else {
        await api.post(
          "/favorite-words",
          { userId, wordId },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setFavorites((prev) => [...prev, wordId]);
      }
    } catch (error) {
      console.error(
        "Error updating favorites:",
        error.response?.data || error.message
      );
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

  // Load cache from storage on mount
  useEffect(() => {
    (async () => {
      const savedCache = await getFromStorage(CACHE_KEY);
      if (savedCache && Date.now() - savedCache.lastUpdated < CACHE_EXPIRY) {
        setCache(savedCache);
        setLevels(savedCache.levels);
        const loadedTopics = savedCache.topics; // Get the loaded topics
        setTopics(loadedTopics);
        setFilteredTopics(loadedTopics);
        // NO NEED to call applyFilters here, useMemo handles initial filter
      }
    })();
  }, []);

  // Save cache to storage whenever it changes (Logic remains the same, good to leave)
  useEffect(() => {
    if (cache.words.length > 0) {
      setToStorage(CACHE_KEY, cache);
    }
  }, [cache]);

  // REMOVED: The old applyFilters useCallback.
  // The filtering logic is now split into two useMemo blocks.

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/word/all?all=true");

      const newCache = {
        words: response.data.data.words || [],
        levels: response.data.data.levels || [],
        topics: (response.data.data.topics || []).sort((a, b) => a.id - b.id),
        lastUpdated: Date.now(),
      };
      setCache(newCache);
      setLevels(newCache.levels);
      setTopics(newCache.topics);
      // NO NEED to call applyFilters here anymore
      setFilteredTopics(newCache.topics);
    } catch (error) {
      console.error("Error fetching all words:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch data if cache is empty
  useEffect(() => {
    if (cache.words.length === 0) {
      fetchAllWords();
    }
  }, [fetchAllWords, cache.words.length]);

  const allFilteredWords = useMemo(() => {
    const wordsArray = cache.words;
    let filtered = wordsArray.filter((word) => word.value?.trim());
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
      const lower = debouncedSearchValue.toLowerCase();

      filtered = filtered.filter((word) => {
        if (searchType === "word") {
          return word.value?.toLowerCase().includes(lower);
        }

        if (searchType === "meaning") {
          return word.meaning?.join(" ").toLowerCase().includes(lower);
        }

        return true;
      });
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
    const value = event.target.value.replace(/^\s+/, ""); // Remove leading spaces
    setSearchValue(value);
  }, []);

  // Memoized modal handlers
  const openModal = useCallback((word) => {
    setSelectedWord(word);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedWord(null);
    setIsModalOpen(false);
  }, []);

  const openWordInModal = useCallback(
    (wordValue) => {
      const word = cache.words.find(
        (w) =>
          w.value === wordValue ||
          (w.synonyms && w.synonyms.includes(wordValue))
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
          value === "aydin" ? null : "Wrong Password!",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Delete",
      }).then((result) => {
        if (result.isConfirmed) {
          api
            .delete(`/word/delete/${wordId}`, {
              headers: {
                userid: userInfo.id,
              },
            })
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
              console.error("Error deleting word:", error);
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

  const topicOptions = useMemo(() => {
    const levelIdToLevelMap = new Map(levels.map((level) => [level.id, level]));

    const sortedTopics = [...filteredTopics].sort((a, b) => {
      if (a.id === UNKNOWN_TOPIC_ID) return 1;
      if (b.id === UNKNOWN_TOPIC_ID) return -1;

      const levelA = levelIdToLevelMap.get(a.levelId);
      const levelB = levelIdToLevelMap.get(b.levelId);

      if (levelA && levelB) {
        return levelA.id - levelB.id;
      }
      return 0;
    });

    let lastLevelId = null;
    const optionsWithSeparators = [];
    const baseClass =
      "text-md md:text-xl lg:text-lg font-custom1 bg-gray-700 text-white";

    sortedTopics.forEach((topic) => {
      const level = levelIdToLevelMap.get(topic.levelId);

      // Add horizontal line when level changes
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

      // Special handling for Unknown topic (ID: 1)
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
          {levelName} {level ? <> ➡️</> : ""} {topic.name}
        </option>
      );
    });

    // Add space after the last topic
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
  }, [filteredTopics, levels, selectedLevel]);

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

    try {
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: true }));

      const response = await aiApi.post(`/paragraphs/generate`, {
        userId: userInfo.id,
        wordId: word.id,
        word: word.value,
        level: word.level?.level || "A1",
        language: "de",
      });

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

      setGeneratedParagraphs((prev) => ({
        ...prev,
        [wordId]: paragraph,
      }));

      setSelectedParagraph(paragraph);
      setIsAIModalOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      if (error.response?.status === 403) {
        Swal.fire("Limit Reached", errorMessage, "warning");
      } else {
        console.error("Error generating paragraph:", errorMessage);
        Swal.fire("Error", "Failed to generate paragraph", "error");
      }
    } finally {
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
      <h2 className="text-3xl font-bold font-mono text-white my-8 text-center hidden md:block">
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

      <div className="w-full">
        <div className="flex justify-end my-1 mr-0 md:mr-24 lg:mr-24">
          {(searchValue || selectedLevel || selectedTopic) && (
            <button
              onClick={handleResetFilters}
              className="btn btn-error btn-sm  text-white font-bold  "
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4 md:mt-0 ">
        {/* Search Input */}
        {/* <div className="w-full relative group ">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for a word"
              value={searchValue}
              onChange={handleSearchInputChange}
              className="border rounded px-2 py-2 w-full md:w-auto flex-1 pl-12 "
            />
            {/* <button className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 shrink-0">
              Search
            </button> */}
        {/* <IoSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 scale-x-[-1] text-gray-500 group-focus-within:hidden"
              size={30}
            />
          </div>
        </div> */}

        {/* =====select search type======== */}
        <div className="flex gap-2 w-full relative group">
          {/* Search Type */}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="border rounded px-2 py-2"
          >
            <option value="word">Word</option>
            <option value="meaning">Meaning</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1">
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
            <p className="text-lg text-info font-bold whitespace-nowrap md:ml-2 hidden md:block">
              {paginatedWords.length} words
            </p>
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
                    <tr
                      key={word.id}
                      className={index % 2 === 0 ? "bg-white " : "bg-gray-300"}
                    >
                      {/* Table cells remain the same */}
                      <td className=" border-gray-400 p-0 md:p-2 lg:p-2 font-semibold text-orange-600 text-center text-sm md:text-lg lg:text-lg">
                        {word.article?.name}
                      </td>

                      {/* word value starts here */}
                      <td className="border-l border-gray-400  p-2 capitalize border-dotted">
                        {/* Move the onClick to the span that contains the word */}
                        <div className="flex justify-between">
                          <span
                            tabIndex={learningMode ? 0 : -1}
                            ref={
                              learningMode && index === currentIndex
                                ? focusElement
                                : null
                            }
                            // className="cursor-pointer text-blue-500  text-sm md:text-lg lg:text-lg  font-bold "
                            className="cursor-pointer p-0 md:p-2 lg:p-2 text-blue-500 text-sm md:text-lg lg:text-lg font-bold break-words max-w-[120px] md:max-w-full"
                            onClick={() => openModal(word)}
                          >
                            {word.value}
                          </span>

                          <div className="flex gap-1 md:gap-4 lg:gap-4 ">
                            <button
                              onClick={() => pronounceWord(word.value)}
                              className=" text-blue-500 hover:text-blue-700 ml-0 md:ml-2 lg:ml-2 "
                            >
                              🔊
                            </button>

                            {userLoggedIn && (
                              <div
                                onClick={() => generateParagraph(word)}
                                className="relative border-2 bg-green-700 text-white italic px-2 py-1 text-sm rounded-full mt-4 h-6 w-6 cursor-pointer hover:scale-105 hover:bg-green-600 hover:text-white border-orange-500 "
                                disabled={loadingParagraphs[word.id]}
                              >
                                {/* Spinner overlay */}
                                {loadingParagraphs[word.id] && (
                                  <span className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <PuffLoader size={20} color="#FF0000" />
                                  </span>
                                )}

                                {/* Button text underneath */}
                                <span
                                  className={`${
                                    loadingParagraphs[word.id]
                                      ? "invisible"
                                      : "flex items-center justify-center relative bottom-1"
                                  }`}
                                >
                                  ai
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* word meaning starts here */}
                      <td
                        className={`border-l border-gray-400 border-dotted pl-1  p-0 md:p-2 lg:p-2 text-sm md:text-lg lg:text-lg ${
                          learningMode && index === currentIndex
                            ? "bg-sky-700 text-white font-bold "
                            : "text-sky-800 font-serif"
                        }`}
                        onClick={() => learningMode && revealMeaning(word.id)}
                        tabIndex="0"
                        onKeyDown={(e) => handleArrowKeyPress(e, index)}
                        ref={currentIndex === index ? focusElement : null}
                      >
                        {learningMode && !revealedWords.includes(word.id) ? (
                          <span className="opacity-0">Hidden</span>
                        ) : (
                          // <span className="line-clamp-2 hover:line-clamp-none  ">
                          <span className="line-clamp-2 hover:line-clamp-none break-words max-w-[120px] md:max-w-full">
                            {word.meaning?.join(", ")}
                          </span>
                        )}
                      </td>

                      <td className="border-l border-gray-400 border-dotted p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
                        <div className="flex flex-wrap gap-1">
                          {word.synonyms?.map((synonym, index) => (
                            <span
                              key={index}
                              onClick={() => openWordInModal(synonym.value)}
                              // className="text-sm sm:text-base hover:underline"
                              className="text-sm sm:text-base btn btn-sm btn-info"
                            >
                              {synonym.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="border-l border-gray-400 border-dotted p-2 text-blue-500 cursor-pointer hidden lg:table-cell xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {word.antonyms?.map((antonym, index) => (
                            <span
                              key={index}
                              onClick={() => openWordInModal(antonym.value)}
                              // className="text-sm sm:text-base hover:underline"
                              className="text-sm sm:text-base btn btn-sm btn-info "
                            >
                              {antonym.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="border-l border-gray-400 border-dotted  p-2 text-blue-500 cursor-pointer hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {word.similarWords?.map((similarword, index) => (
                            <span
                              key={index}
                              onClick={() => openWordInModal(similarword.value)}
                              // className="text-sm sm:text-base hover:underline"
                              className="text-sm sm:text-base btn btn-sm btn-info"
                            >
                              {similarword.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="border-l border-r border-gray-400 border-dotted  p-2 hidden md:table-cell text-center">
                        <span className="text-base sm:text-lg ">
                          {word.level?.level}
                        </span>
                      </td>

                      <td
                        className={`border-l border-r border-gray-400  p-2 text-center ${
                          showActionColumn ? "table-cell" : "hidden"
                        } `}
                      >
                        <div className="flex  gap-1 justify-center">
                          <Link
                            // onClick={() => handleEditButtonClick(word.id)}
                            to={`/edit-word/${word.id}`}
                            className="btn btn-sm btn-warning "
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(word.id, word.value)}
                            className="btn btn-sm btn-error"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      {/* ======== */}
                      {/* // favorites */}
                      {userLoggedIn && (
                        <td className="border-l border-r border-gray-400 border-dotted p-0 md:p-1 lg:p-1 text-center ">
                          <FavoriteButton
                            isFavorite={favorites.includes(word.id)}
                            loading={loadingFavorites[word.id]}
                            onClick={() => toggleFavorite(word.id)}
                          />
                        </td>
                      )}

                      {/* ======== */}
                      {/* modified by */}
                      {/* ========== */}
                      {userLoggedIn &&
                        (userInfo.role === "super_admin" ||
                          userInfo.role === "admin") && (
                          <td className="border-l border-gray-400 border-dotted p-2 text-center hidden lg:table-cell">
                            <button
                              onClick={() => {
                                setSelectedHistory({
                                  creator: {
                                    name: word.creator?.name,
                                    email: word.creator?.email,
                                  },
                                  modifiers:
                                    word.history?.map((h) => ({
                                      name: h.user?.name,
                                      email: h.user?.email,
                                    })) || [],
                                });
                                setIsHistoryModalOpen(true);
                              }}
                              className={`hover:text-blue-700 ${
                                word.history?.some(
                                  (h) =>
                                    h.user?.email !==
                                      "arif.aust.eng@gmail.com" &&
                                    h.user?.email !== "almon.arif@gmail.com"
                                )
                                  ? "text-red-500"
                                  : "text-blue-500"
                              }`}
                              aria-label="View history"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          </td>
                        )}
                      {/* ========== */}
                    </tr>
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
