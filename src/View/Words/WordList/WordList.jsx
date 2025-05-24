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

  const [favorites, setFavorites] = useState([]);

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
  useEffect(() => {
    const savedCache = localStorage.getItem(CACHE_KEY);
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache);
      if (Date.now() - parsedCache.lastUpdated < CACHE_EXPIRY) {
        setCache(parsedCache);
        setLevels(parsedCache.levels);
        setTopics(parsedCache.topics);
        applyFilters(parsedCache.words); // Apply filters with cached data
      }
    }
  }, []);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
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

  const levelOptions = useMemo(
    () =>
      levels.map((level) => (
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

  return (
    <Container>
      <h2 className="text-3xl font-bold font-mono text-sky-700 my-8 text-center hidden md:block">
        Words List
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
              className="border rounded-l-lg px-4 py-2 w-full md:w-auto flex-1"
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
                <tr className="bg-cyan-600 text-md md:text-xl lg:text-lg text-white ">
                  {/* ... existing header cells ... */}
                  <th className="border-l border-gray-400 text-sm md:text-lg lg:text-lg   p-0 md:p-1 lg:p-1  text-center w-[15%] md:w-[3%] lg:w-[3%] ">
                    Article
                  </th>
                  <th className="border-l border-gray-400  p-0 md:p-1 lg:p-1  text-center w-[15%] md:w-[10%] lg:w-[10%] ">
                    Word
                  </th>

                  <th className="border-l border-gray-400  p-0 md:p-1 lg:p-1  text-center w-[10%] md:w-[25%] lg:w-[25%]">
                    Meaning
                  </th>
                  <th className="border-l border-gray-400 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Synonym
                  </th>
                  <th className="border-l border-gray-400  p-0 md:p-1 lg:p-1  text-center hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Antonym
                  </th>
                  <th className="border-l border-gray-400  p-0 md:p-1 lg:p-1 text-center hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Deceptive Word
                  </th>
                  <th className="border-l border-gray-400  p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[3%] lg:w-[3%]">
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
                        <th className="border-l border-gray-400 p-0 md:p-1 text-xs lg:p-1 text-center w-[15%] md:w-[10%] lg:w-[10%] hidden lg:table-cell">
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
                      className={index % 2 === 0 ? "bg-white " : "bg-gray-300"}
                    >
                      {/* Table cells remain the same */}
                      <td className="border-l border-gray-400  p-2 capitalize font-bold text-rose-500">
                        {word.article?.name}
                      </td>
                      <td className="border-l border-gray-400  p-2 capitalize">
                        {/* Move the onClick to the span that contains the word */}
                        <div className="flex justify-between">
                          <span
                            className="cursor-pointer text-blue-500 text-base sm:text-lg font-bold "
                            onClick={() => openModal(word)}
                          >
                            {word.value}
                          </span>

                          <button
                            onClick={() => pronounceWord(word.value)}
                            className=" text-blue-500 hover:text-blue-700 ml-2"
                          >
                            🔊
                          </button>
                        </div>
                      </td>

                      <td
                        className={`border-l border-gray-400  p-2 text-base sm:text-lg ${
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

                      <td className="border-l border-gray-400  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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

                      <td className="border-l border-gray-400  p-2 text-blue-500 cursor-pointer hidden lg:table-cell xl:table-cell">
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

                      <td className="border-l border-gray-400  p-2 text-blue-500 cursor-pointer hidden lg:table-cell">
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

                      <td className="border-l border-r border-gray-400  p-2 hidden md:table-cell text-center">
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
                      {userLoggedIn &&
                        (userInfo.role === "basic_user" ||
                          userInfo.role === "admin" ||
                          userInfo.role === "super_admin") && (
                          <td className="border-l border-r border-gray-400  p-1 text-center">
                            <button
                              onClick={() => toggleFavorite(word.id)}
                              className="hover:opacity-80 transition-opacity"
                              disabled={loadingFavorites[word.id]}
                            >
                              {loadingFavorites[word.id] ? (
                                // Loading spinner
                                <svg
                                  className="w-6 h-6 animate-spin text-gray-400"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              ) : favorites.includes(word.id) ? (
                                // Filled Heart
                                <svg
                                  className="w-6 h-6"
                                  viewBox="0 0 122.88 107.39"
                                >
                                  <path
                                    style={{
                                      fill: "#ed1b24",
                                      fillRule: "evenodd",
                                    }}
                                    d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
                                  />
                                </svg>
                              ) : (
                                // Outline Heart
                                <svg
                                  className="w-6 h-6 text-gray-400"
                                  viewBox="0 0 122.88 107.39"
                                >
                                  <path
                                    style={{
                                      fill: "transparent",
                                      stroke: "currentColor",
                                      strokeWidth: "3",
                                      fillRule: "evenodd",
                                    }}
                                    d="M60.83,17.18c8-8.35,13.62-15.57,26-17C110-2.46,131.27,21.26,119.57,44.61c-3.33,6.65-10.11,14.56-17.61,22.32-8.23,8.52-17.34,16.87-23.72,23.2l-17.4,17.26L46.46,93.55C29.16,76.89,1,55.92,0,29.94-.63,11.74,13.73.08,30.25.29c14.76.2,21,7.54,30.58,16.89Z"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        )}
                      {/* ======== */}
                      {/* modified by */}
                      {/* ========== */}
                      {userLoggedIn &&
                        (userInfo.role === "super_admin" ||
                          userInfo.role === "admin") && (
                          <td className="border-l border-gray-400 p-2 text-center hidden lg:table-cell">
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
    </Container>
  );
};

export default React.memo(WordList);
