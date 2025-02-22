import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "../axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import Container from "../utils/Container";
import Pagination from "../utils/Pagination";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

// Cache key constants
const CACHE_KEY = "wordListCache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

const WordList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      // Check if userInfo exists and has an id
      if (!userInfo?.id) return;

      try {
        const response = await fetch(
          `https://sprcahgenie-new-backend.vercel.app/api/v1/favorite-words/${userInfo.id}`
        );
        if (response.ok) {
          const result = await response.json();
          setFavorites(result.data.map((word) => word.id));
        } else {
          console.error("Failed to fetch favorites");
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, [userInfo?.id]);

  const toggleFavorite = async (wordId) => {
    const isFavorite = favorites.includes(wordId);
    const url =
      "https://sprcahgenie-new-backend.vercel.app/api/v1/favorite-words";
    const userId = userInfo.id; // Get user ID

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));
      if (isFavorite) {
        // Remove from favorites (DELETE request)
        const response = await fetch(`${url}/${wordId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, wordId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to remove favorite:", errorData);
          return;
        }

        setFavorites((prevFavorites) =>
          prevFavorites.filter((id) => id !== wordId)
        );
      } else {
        // Add to favorites (POST request)
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, wordId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to add favorite:", errorData);
          return;
        }

        setFavorites((prevFavorites) => [...prevFavorites, wordId]);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
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

      if (selectedTopic) {
        filtered = filtered.filter(
          (word) => word.topic?.name === selectedTopic
        );
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
    [currentPage, selectedLevel, selectedTopic, searchValue, showAllData]
  );

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/words?all=true");
      const newCache = {
        words: response.data.words || [],
        levels: response.data.levels || [],
        topics: (response.data.topics || []).sort((a, b) => a.id - b.id),
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

  // Memoized filter handlers
  const handleLevelChange = useCallback((e) => {
    setSelectedLevel(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleTopicChange = useCallback((e) => {
    setSelectedTopic(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(
    (wordId) => {
      // Find the word in cache
      const wordToDelete = cache.words.find((word) => word.id === wordId);

      Swal.fire({
        title: "Are you sure?",
        // text: `You won't be able to revert this!. Delete ${wordToDelete?.value}`,
        html: `You won't be able to revert this! Delete <strong style="color: #dc2626; font-weight: 800;">"${wordToDelete?.value}"</strong>?`,
        icon: "warning",
        input: "text",
        inputPlaceholder: "Type password",
        inputValidator: (value) =>
          value === "aydin45" ? null : "Wrong Password!",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          axios
            .delete(`/word/${wordId}`)
            .then(() => {
              // Update cache directly instead of refetching
              setCache((prev) => ({
                ...prev,
                words: prev.words.filter((word) => word.id !== wordId),
                lastUpdated: Date.now(),
              }));

              // Update filtered words immediately
              setFilteredWords((prev) =>
                prev.filter((word) => word.id !== wordId)
              );
              // localStorage.removeItem("wordListCache");
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
    [] // No dependencies needed now
  );

  // Edit handler
  // const handleEditButtonClick = useCallback(
  //   (wordId) => {
  //     Swal.fire({
  //       title: "Enter password",
  //       input: "password",
  //       inputValidator: (value) =>
  //         value === "aydin2" ? null : "Wrong Password!",
  //       showCancelButton: true,
  //     }).then((result) => {
  //       if (result.isConfirmed) navigate(`/edit-word/${wordId}`);
  //     });
  //   },
  //   [navigate]
  // );

  // Learning mode implementation
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

  // Memoized components
  const levelOptions = useMemo(
    () =>
      levels.map((level) => (
        <option key={level.id} value={level.level}>
          {level.level}
        </option>
      )),
    [levels]
  );

  const topicOptions = useMemo(
    () =>
      topics.map((topic) => (
        <option key={topic.id} value={topic.name}>
          {topic.name}
        </option>
      )),
    [topics]
  );

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
      {/* Header remains the same */}
      <h2 className="text-3xl font-bold font-mono my-8 text-center hidden md:block">
        Words List
      </h2>

      {/* Filters grid */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4 md:mt-0">
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
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner text-accent w-24 h-24"></span>
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-2">
              {/* Table headers remain the same */}
              <thead>
                <tr className="bg-cyan-600 text-xl text-white ">
                  {/* ... existing header cells ... */}
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center w-[15%] md:w-[10%] lg:w-[10%] ">
                    Word
                  </th>
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center w-[10%] md:w-[25%] lg:w-[25%]">
                    Meaning
                  </th>
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Synonym
                  </th>
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Antonym
                  </th>
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1 text-center hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                    Deceptive Word
                  </th>
                  <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[3%] lg:w-[3%]">
                    Level
                  </th>
                  <th
                    className={`border border-gray-600 p-1 text-center ${
                      showActionColumn ? "table-cell" : "hidden"
                    } `}
                  >
                    Action
                  </th>
                  {userLoggedIn && userInfo.role === "basic_user" && (
                    <th className="border border-gray-600 p-0 md:p-1 lg:p-1 text-center  w-[3%] md:w-[3%] lg:w-[3%]">
                      Fav
                    </th>
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
                      <td
                        className="border border-gray-600 p-2 capitalize cursor-pointer text-blue-500 text-base sm:text-lg"
                        onClick={() => openModal(word)}
                      >
                        <span className="font-bold">{word.value}</span>
                      </td>

                      <td
                        className={`border border-gray-600 p-2 text-base sm:text-lg ${
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
                          <span className="line-clamp-2 hover:line-clamp-none">
                            {word.meaning?.join(", ")}
                          </span>
                        )}
                      </td>

                      <td className="border border-gray-600 p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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

                      <td className="border border-gray-600 p-2 text-blue-500 cursor-pointer hidden md:table-cell">
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

                      <td className="border border-gray-600 p-2 text-blue-500 cursor-pointer hidden lg:table-cell">
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

                      <td className="border border-gray-600 p-2 hidden md:table-cell text-center">
                        <span className="text-base sm:text-lg ">
                          {word.level?.level}
                        </span>
                      </td>

                      <td
                        className={`border border-gray-600 p-2 text-center ${
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
                            onClick={() => handleDelete(word.id)}
                            className="btn btn-sm btn-error"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      {/* ======== */}
                      {userLoggedIn && userInfo.role === "basic_user" && (
                        <td className="border border-gray-600 p-1 text-center">
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
        // onEdit={handleEditButtonClick}
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
    </Container>
  );
};

export default React.memo(WordList);
