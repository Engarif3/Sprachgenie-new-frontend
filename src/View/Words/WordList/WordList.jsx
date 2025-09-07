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

// Cache key constants
const CACHE_KEY = "wordListCache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

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
  const [filteredWords, setFilteredWords] = useState([]);
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

  // ===================
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

  // console.log(userInfo);

  const [favorites, setFavorites] = useState([]);

  //   =========AI ===============
  const [aiWord, setAiWord] = useState(null);
  const [generatedParagraphs, setGeneratedParagraphs] = useState({});
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");

  //   =========AI ===============

  useEffect(() => {
    const fetchFavorites = async () => {
      if (
        (!userInfo?.id && userInfo.role !== "basic_user") ||
        (!userInfo?.id && userInfo.role !== "admin")
      )
        return;

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
        // Ensure favorites array is always set
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [userInfo?.id]);

  const toggleFavorite = async (wordId) => {
    const isFavorite = favorites.includes(wordId);
    // const baseURL =
    //   "https://sprcahgenie-new-backend.vercel.app/api/v1/favorite-words";
    const userId = userInfo.id;

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));

      if (isFavorite) {
        // Remove from favorites (DELETE request)
        await api.delete(`/favorite-words/${wordId}`, {
          data: { userId, wordId },
          headers: {
            "Content-Type": "application/json",
          },
        });
        setFavorites((prev) => prev.filter((id) => id !== wordId));
      } else {
        // Add to favorites (POST request)
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
      // Optional: Show error to user
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

  // Initialize cache from localStorage on mount
  //   useEffect(() => {
  //     const savedCache = localStorage.getItem(CACHE_KEY);
  //     if (savedCache) {
  //       const parsedCache = JSON.parse(savedCache);
  //       if (Date.now() - parsedCache.lastUpdated < CACHE_EXPIRY) {
  //         setCache(parsedCache);
  //         setLevels(parsedCache.levels);
  //         setTopics(parsedCache.topics);
  //         applyFilters(parsedCache.words); // Apply filters with cached data
  //       }
  //     }
  //   }, []);

  useEffect(() => {
    (async () => {
      const savedCache = await getFromStorage(CACHE_KEY);
      if (savedCache && Date.now() - savedCache.lastUpdated < CACHE_EXPIRY) {
        setCache(savedCache);
        setLevels(savedCache.levels);
        setTopics(savedCache.topics);
        applyFilters(savedCache.words);
      }
    })();
  }, []);

  // Save cache to localStorage whenever it changes
  //   useEffect(() => {
  //     localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  //   }, [cache]);

  useEffect(() => {
    if (cache.words.length > 0) {
      setToStorage(CACHE_KEY, cache);
    }
  }, [cache]);

  // Memoized fetch functions

  const applyFilters = useCallback(
    (wordsArray) => {
      let filtered = wordsArray.filter((word) => word.value?.trim());

      if (selectedLevel) {
        filtered = filtered.filter(
          (word) => word.level?.level === selectedLevel
        );
      }

      const defaultTopic = topics.find((topic) => topic.id === 1);
      const defaultTopicName = defaultTopic?.name;

      // Enhanced topic filter
      if (selectedTopic) {
        filtered = filtered.filter((word) => {
          const hasNoMeaning = !word.meaning?.length;
          const hasNoTopic = !word.topic;

          // Check if matches selected topic OR is default candidate
          return (
            word.topic?.name === selectedTopic ||
            (selectedTopic === defaultTopicName && hasNoMeaning && hasNoTopic)
          );
        });
      }

      // Modified search filter logic
      if (searchValue.trim().length > 0) {
        filtered = filtered.filter(
          (word) =>
            word.value.toLowerCase().includes(searchValue.toLowerCase()) ||
            word.meaning
              ?.join(" ")
              .toLowerCase()
              .includes(searchValue.toLowerCase())
        );
      }

      if (showAllData) {
        setFilteredWords(filtered);
        setTotalPages(1);
      } else {
        const paginated = filtered.slice(
          (currentPage - 1) * 40,
          currentPage * 40
        );
        setFilteredWords(paginated);
        setTotalPages(Math.ceil(filtered.length / 40));
      }
    },
    [
      currentPage,
      selectedLevel,
      selectedTopic,
      searchValue,
      showAllData,
      topics,
    ]
  );

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      // const response = await axios.get("/words?all=true");
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
      applyFilters(newCache.words); // Apply filters with new data
    } catch (error) {
      console.error("Error fetching all words:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle page changes
  useEffect(() => {
    if (cache.words.length > 0) {
      applyFilters(cache.words);
    }
  }, [currentPage, selectedLevel, selectedTopic, searchValue, showAllData]);

  useEffect(() => {
    if (cache.words.length === 0) {
      fetchAllWords();
    }
  }, []);

  const handleSearchInputChange = useCallback(
    (event) => {
      const query = event.target.value;
      setSearchValue(query);

      // Immediate filter update when clearing search
      if (query.trim() === "") {
        applyFilters(cache.words);
      }
    },
    [applyFilters, cache.words]
  );

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

  const handleLevelChange = useCallback(
    (e) => {
      const selected = e.target.value;
      setSelectedLevel(selected);
      setSelectedTopic(""); // Reset topic to "All Topics"
      setCurrentPage(1);

      if (selected === "") {
        setFilteredTopics(topics); // Show all topics if no level is selected
      } else {
        const relatedTopics = cache.words
          .filter((word) => word.level?.level === selected && word.topic.name)
          .map((word) => word.topic.name);

        const uniqueTopics = Array.from(new Set(relatedTopics));
        const matchedTopics = topics.filter((topic) =>
          uniqueTopics.includes(topic.name)
        );
        setFilteredTopics(matchedTopics);
      }
    },
    [topics, cache.words]
  );

  useEffect(() => {
    if (topics.length > 0) {
      setFilteredTopics(topics);
    }
  }, [topics]);

  const handleTopicChange = useCallback((e) => {
    setSelectedTopic(e.target.value);
    setCurrentPage(1);
  }, []);

  // Learning mode implementation
  const handleDelete = useCallback((wordId, wordValue) => {
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
      inputValidator: (value) => (value === "aydin" ? null : "Wrong Password!"),
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/word/delete/${wordId}`, {
            headers: {
              userid: userInfo.id, // get this from your React state or context
            },
          })
          .then(() => {
            setCache((prev) => ({
              ...prev,
              words: prev.words.filter((word) => word.id !== wordId),
              lastUpdated: Date.now(),
            }));
            setFilteredWords((prev) =>
              prev.filter((word) => word.id !== wordId)
            );
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
  }, []); // Empty dependencies still work as we're not using external values

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
        if (newIndex >= 0 && newIndex < filteredWords.length) {
          revealMeaning(filteredWords[newIndex].id);
          setCurrentIndex(newIndex);
        }
      }
    },
    [filteredWords, revealMeaning]
  );

  // Focus management
  useEffect(() => {
    if (currentIndex !== null && focusElement.current) {
      focusElement.current.focus();
    }
  }, [currentIndex]);

  // A1>level id:1 ... B2> id:4 C1> id:6
  const levelOptions = useMemo(
    () =>
      levels
        // .filter((level) => level.id !== 6) // exclude id 6 for all
        // exclude id:6 for only users and basic users
        .filter((level) => {
          if (
            level.id === 6 &&
            !["admin", "super_admin"].includes(userInfo.role)
          ) {
            return false;
          }
          return true;
        })
        .map((level) => (
          <option
            key={level.id}
            value={level.level}
            className="text-md md:text-xl lg:text-lg font-custom1 bg-gray-700 text-white"
          >
            {level.level}
          </option>
        )),
    [levels]
  );

  const topicOptions = useMemo(() => {
    return filteredTopics.map((topic) => {
      const level = levels.find((lvl) => lvl.id === topic.levelId);
      const levelName = level ? level.level : "N/A";

      // Only show levelName if levelId is not 6
      return (
        <option
          key={topic.id}
          value={topic.name}
          className="text-md md:text-xl lg:text-lg font-custom1 bg-gray-700 text-white"
        >
          {level && level.id !== 6 ? levelName : ""}
          {level && level.id !== 6 ? <> &#128313;</> : ""} {topic.name}
        </option>
      );
    });
  }, [filteredTopics, levels]);

  // Update the toggleView function
  const toggleView = useCallback(() => {
    setShowAllData((prev) => !prev);
    setCurrentPage(1);
    // Force immediate filter update
    if (cache.words.length > 0) {
      applyFilters(cache.words);
    }
  }, [applyFilters, cache.words]);

  //   ==============AI===============

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

  // =============report================

  const handleReportSubmit = async () => {
    if (!aiWord?.id) {
      Swal.fire("Error", "Missing word ID", "error");
      return;
    }

    try {
      const response = await aiApi.post(`/paragraphs/report`, {
        wordId: aiWord.id, // ✅ send wordId instead of paragraphId
        userId: userInfo?.id ?? null, // optional
        message: reportMessage?.trim() || null, // optional
      });

      Swal.fire(
        "Reported",
        response.data.message || "Report submitted",
        "success"
      );

      setIsReportModalOpen(false);
      setReportMessage("");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      Swal.fire("Error", errorMessage, "error");
    }
  };

  //   ==============AI===============

  return (
    <Container>
      <h2 className="text-3xl font-bold font-mono text-white my-8 text-center hidden md:block">
        Vocabulary Library <br />
        <p className="text-xs text-pink-600 ">
          {" "}
          {userLoggedIn &&
            (userInfo.role === "admin" || userInfo.role === "super_admin") &&
            cache.words.length}
        </p>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4 md:mt-0 ">
        {/* Search Input */}
        <div className="w-full">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for a word"
              value={searchValue}
              onChange={handleSearchInputChange}
              className="border rounded-l-lg px-2 py-2 w-full md:w-auto flex-1 "
              // style={{ caretColor: "transparent" }}
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 shrink-0">
              Search
            </button>
          </div>
        </div>

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
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <select
              value={selectedTopic}
              onChange={handleTopicChange}
              className="border rounded px-4 py-2 w-full"
            >
              <option value="">All Topics</option>

              {topicOptions}
            </select>
            <p className="text-lg text-info font-bold whitespace-nowrap md:ml-2 hidden md:block">
              {filteredWords.length} words
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
        totalWords={filteredWords.length}
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
              {/* Table headers remain the same */}
              <thead>
                <tr className="bg-cyan-800 text-md md:text-xl lg:text-lg text-white ">
                  {/* ... existing header cells ... */}
                  <th className=" border-gray-400  text-sm md:text-lg lg:text-lg   p-0 md:p-1 lg:p-1  text-center w-[15%] md:w-[3%] lg:w-[3%] ">
                    Article
                  </th>
                  <th className="border-l border-gray-400 border-dotted p-0 md:p-1 lg:p-1  text-center w-[15%] md:w-[10%] lg:w-[10%] ">
                    Word
                  </th>

                  <th className="border-l border-gray-400 border-dotted  p-0 md:p-1 lg:p-1  text-center w-[10%] md:w-[25%] lg:w-[25%]">
                    Meaning
                  </th>
                  <th className="border-l border-gray-400 border-dotted p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Synonym
                  </th>
                  <th className="border-l border-gray-400 border-dotted  p-0 md:p-1 lg:p-1  text-center hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Antonym
                  </th>
                  <th className="border-l border-gray-400 border-dotted p-0 md:p-1 lg:p-1 text-center hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Word to Watch
                  </th>
                  <th className="border-l border-gray-400 border-dotted  p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[3%] lg:w-[3%]">
                    Level
                  </th>
                  <th
                    className={`border-l border-gray-400 p-1 text-center ${
                      showActionColumn ? "table-cell" : "hidden"
                    } `}
                  >
                    Action
                  </th>
                  {userLoggedIn &&
                    (userInfo.role === "basic_user" ||
                      userInfo.role === "admin" ||
                      userInfo.role === "super_admin") && (
                      <th className="border-l border-gray-400 text-sm md:text-lg lg:text-lg  p-0 md:p-1 lg:p-1 text-center  w-[3%] md:w-[3%] lg:w-[3%]">
                        Fav
                      </th>
                    )}
                  {userLoggedIn &&
                    (userInfo.role === "super_admin" ||
                      userInfo.role === "admin") && (
                      <>
                        <th className="border-l  border-gray-400 p-0 md:p-1 text-xs lg:p-1 text-center w-[15%] md:w-[10%] lg:w-[10%] hidden lg:table-cell">
                          Modified by
                        </th>
                      </>
                    )}
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {filteredWords.length > 0 ? (
                  filteredWords.map((word, index) => (
                    <tr
                      key={word.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-300"}
                    >
                      {/* Table cells remain the same */}
                      <td className=" border-gray-400  p-2 font-semibold text-orange-600 text-center">
                        {word.article?.name}
                      </td>
                      <td className="border-l border-gray-400  p-2 capitalize border-dotted">
                        {/* Move the onClick to the span that contains the word */}
                        <div className="flex justify-between">
                          <span
                            className="cursor-pointer text-blue-500 text-base sm:text-lg font-bold "
                            onClick={() => openModal(word)}
                          >
                            {word.value}
                          </span>

                          <div className="flex gap-4 ">
                            <button
                              onClick={() => pronounceWord(word.value)}
                              className=" text-blue-500 hover:text-blue-700 ml-2 "
                            >
                              🔊
                            </button>
                            {/* <div
                              onClick={() => generateParagraph(word)}
                              className="border-2 bg-green-700 text-white italic px-1 text-sm rounded-full mt-4 cursor-pointer hover:scale-105 hover:bg-green-600 hover:text-white border-orange-500"
                              disabled={loadingParagraphs[word.id]}
                            >
                              {loadingParagraphs[word.id] ? (
                                <PuffLoader
                                  size={24}
                                  className="rounded-full "
                                />
                              ) : (
                                "ai"
                              )}
                            </div> */}
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

                      <td
                        className={`border-l border-gray-400 border-dotted  p-2 text-base sm:text-lg ${
                          learningMode && index === currentIndex
                            ? "bg-sky-400 text-white font-bold"
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
                          <span className="line-clamp-2 hover:line-clamp-none  ">
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
                        <td className="border-l border-r border-gray-400 border-dotted p-1 text-center">
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

      <WordListModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        selectedWord={selectedWord}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        loadingFavorites={loadingFavorites}
      />

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
        totalWords={filteredWords.length}
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
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-1/2 lg:w-1/2  px-4 mx-2">
            <h2 className="text-2xl md:text-5xl lg:text-5xl font-bold  text-center mb-2">
              <span className="text-orange-600">
                {" "}
                {typeof aiWord?.article === "string"
                  ? aiWord.article
                  : aiWord?.article?.name || ""}{" "}
              </span>
              <span className="text-slate-800 capitalize">{aiWord?.value}</span>
            </h2>
            <p className="text-center text-cyan-800 text-2xl mb-6">
              {/* [{aiWord?.meaning || ""}] */}[
              {Array.isArray(aiWord?.meaning)
                ? aiWord.meaning.join(", ")
                : aiWord?.meaning || ""}
              ]
            </p>

            <p className="whitespace-pre-line text-xl md:text-2xl lg:text-2xl  font-mono text-slate900 -md p-2">
              <div>
                {" "}
                {aiWord?.aiMeanings?.length > 0 && (
                  <p className=" text-gray-700 text-lg ml-2">
                    <strong className="text-orange-600">Meanings (AI):</strong>{" "}
                    {aiWord.aiMeanings.join(", ")}
                  </p>
                )}
              </div>
              <div className="border border-cyan-600 rounded p-2">
                <span> {selectedParagraph}</span>
              </div>
              <div className="hidden">
                {aiWord?.sentences?.length > 0 && (
                  <span className="mt-4 text-left text-slate-700 ">
                    {aiWord.sentences.map((s, i) => (
                      <p key={i} className=" text-lg ml-2">
                        <strong className="text-green-700">Sentences:</strong>
                        {s}
                      </p>
                    ))}
                  </span>
                )}
              </div>
            </p>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="btn btn-sm btn-error "
              >
                Report
              </button>
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="btn btn-sm btn-warning"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======AI modal=============== */}

      {/* ===================report========= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-1/3 mx-2">
            <h2 className="text-xl font-bold mb-4 text-center">Report</h2>

            <p className="text-gray-600 text-sm mb-2">
              Reason for reporting this AI generation. (optional)
            </p>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
              rows={4}
              placeholder="Enter a message (optional)"
            />

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="btn btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="btn btn-sm btn-error"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================report========= */}
    </Container>
  );
};

export default React.memo(WordList);
