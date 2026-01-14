import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../../../axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import Container from "../../../utils/Container";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import Pagination from "./Pagination";
import { pronounceWord } from "../../../utils/wordPronounciation";
import { ImBin } from "react-icons/im";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "../../../utils/local-storage";
import aiApi from "../../../AI_axios";
import { PuffLoader } from "react-spinners";
import AIModal from "../Modals/AIModal";

const FavoritesList = () => {
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const userInfo = getUserInfo();
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState({});

  // =================ai===========================
  const [aiWord, setAiWord] = useState(null);
  const [generatedParagraphs, setGeneratedParagraphs] = useState({});
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // =================ai===========================

  // Initialize favorites from localStorage on mount
  useEffect(() => {
    const cachedFavorites = getFromLocalStorage("favorites");
    if (cachedFavorites && Array.isArray(cachedFavorites)) {
      // Ensure all required fields exist
      const sanitizedFavorites = cachedFavorites.map((w) => ({
        ...w,
        sentences: w.sentences || [],
        meaning: w.meaning || [],
        synonyms: w.synonyms || [],
        antonyms: w.antonyms || [],
        similarWords: w.similarWords || [],
        pluralForm: w.pluralForm || "",
      }));
      setFavoriteWords(sanitizedFavorites);
      setFavorites(sanitizedFavorites.map((w) => w.id));
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userInfo?.id) return;

      try {
        const response = await axios.get(`/favorite-words/${userInfo.id}`);
        if (response.data.success) {
          const sanitizedData = response.data.data.map((w) => ({
            ...w,
            sentences: w.sentences || [],
            meaning: w.meaning || [],
            synonyms: w.synonyms || [],
            antonyms: w.antonyms || [],
            similarWords: w.similarWords || [],
            pluralForm: w.pluralForm || "",
          }));
          setFavoriteWords(sanitizedData);
          setFavorites(sanitizedData.map((w) => w.id));
          setToLocalStorage("favorites", sanitizedData);
        } else {
          setFavoriteWords([]);
          setFavorites([]);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setFavoriteWords([]);
          setFavorites([]);
        } else {
          Swal.fire("Error", "Failed to load favorites", "error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [userInfo?.id]);

  // Create Map for O(1) word lookups
  const wordsByIdMap = useMemo(() => {
    const map = new Map();
    favoriteWords.forEach((word) => map.set(word.id, word));
    return map;
  }, [favoriteWords]);

  // Derive selectedWord from ID
  const selectedWord = useMemo(() => {
    if (!selectedWordId) return null;
    return wordsByIdMap.get(selectedWordId) || null;
  }, [selectedWordId, wordsByIdMap]);

  useEffect(() => {
    const newTotalPages = Math.ceil(favoriteWords.length / 40);
    setTotalPages(newTotalPages);

    // Adjust current page if it's now out of bounds
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [favoriteWords]);

  const openWordInModal = useCallback(
    (wordValue) => {
      const word = favoriteWords.find(
        (w) =>
          w.value === wordValue ||
          (w.synonyms && w.synonyms.includes(wordValue)) ||
          (w.antonyms && w.antonyms.includes(wordValue)) ||
          (w.similarWords && w.similarWords.includes(wordValue))
      );

      if (!word) {
        Swal.fire(
          "Not Found",
          "The word or synonym/antonym/similar word doesn't exist.",
          "error"
        );
        return;
      }

      const isParent = word.value === wordValue;
      const isSynonym =
        !isParent &&
        word.synonyms &&
        word.synonyms.some((syn) => syn.value === wordValue);
      const isAntonym =
        !isParent &&
        word.antonyms &&
        word.antonyms.some((ant) => ant.value === wordValue);
      const isSimilar =
        !isParent &&
        word.similarWords &&
        word.similarWords.some((sim) => sim.value === wordValue);

      const clickedWord = isParent
        ? word
        : isSynonym
        ? word.synonyms.find((syn) => syn.value === wordValue)
        : isAntonym
        ? word.antonyms.find((ant) => ant.value === wordValue)
        : word.similarWords.find((sim) => sim.value === wordValue);

      const enrichedSynonyms = isParent
        ? word.synonyms || []
        : isSynonym
        ? [
            { value: word.value }, // original favorite word included here
            ...word.synonyms.filter((syn) => syn.value !== wordValue),
          ]
        : [];

      const enrichedAntonyms = isParent
        ? word.antonyms || []
        : isSynonym
        ? word.antonyms || []
        : isAntonym
        ? [{ value: word.value }, ...(word.synonyms || [])].filter(
            (entry) => entry.value !== wordValue
          )
        : [];

      const enrichedSimilarWords = isParent
        ? word.similarWords || []
        : isSimilar
        ? [
            { value: word.value },
            ...word.similarWords.filter((sim) => sim.value !== wordValue),
          ]
        : [];

      const enriched = {
        ...word,
        ...clickedWord,
        id: word.id,
        level: word.level,
        topic: word.topic,
        article: word.article,
        sentences: word.sentences || [],
        meaning: word.meaning || [],
        pluralForm: word.pluralForm || "",
        synonyms: enrichedSynonyms,
        antonyms: enrichedAntonyms,
        similarWords: enrichedSimilarWords,
      };

      openModal(enriched);
    },
    [favoriteWords]
  );

  const handleRemoveFavorite = async (wordId) => {
    const result = await Swal.fire({
      title: "Remove from Favorites?",
      text: "Are you sure you want to remove this word from your favorites?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/favorite-words/${wordId}`);

        setFavoriteWords((prev) => prev.filter((word) => word.id !== wordId));

        Swal.fire({
          title: "Removed!",
          text: "The word has been removed from favorites.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to remove favorite.",
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  const openModal = (word) => {
    setSelectedWordId(word.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedWordId(null);
    setIsModalOpen(false);
  };

  const toggleFavorite = async (wordId) => {
    // Prevent concurrent requests to the same word
    if (loadingFavorites[wordId]) return;

    const previousFavorites = favoriteWords;
    const previousIds = favorites;

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));

      if (favorites.includes(wordId)) {
        // Optimistic update - remove immediately
        const updatedFavorites = favoriteWords.filter((w) => w.id !== wordId);
        setFavorites(updatedFavorites.map((w) => w.id));
        setFavoriteWords(updatedFavorites);
        setToLocalStorage("favorites", updatedFavorites);

        // API call
        await axios.delete(`/favorite-words/${wordId}`);

        Swal.fire({
          title: "Removed!",
          text: "The word has been removed from favorites.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        // Add favorite
        const response = await axios.post(`/favorite-words`, { wordId });

        if (response.data.success) {
          // Fetch updated favorites list
          const favResponse = await axios.get(`/favorite-words/${userInfo.id}`);
          if (favResponse.data.success) {
            setFavoriteWords(favResponse.data.data);
            setFavorites(favResponse.data.data.map((w) => w.id));
            setToLocalStorage("favorites", favResponse.data.data);
          }

          Swal.fire({
            title: "Added!",
            text: "The word has been added to favorites.",
            icon: "success",
            timer: 1000,
            showConfirmButton: false,
          });
        }
      }
    } catch (err) {
      // Rollback on error
      setFavoriteWords(previousFavorites);
      setFavorites(previousIds);
      setToLocalStorage("favorites", previousFavorites);

      Swal.fire("Error", "Failed to update favorites", "error");
    } finally {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: false }));
    }
  };

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

      const splitSentences = (text) =>
        text
          .split(/(?<=[.!?])\s+/) // split after ., !, ?
          .map((s) => s.trim())
          .filter(Boolean);

      const aiMeanings = response.data.meanings || [];
      const otherSentences = response.data.otherSentences || [];
      const paragraph = response.data.paragraph;
      const wordId = response.data.wordId || word.id; // depends on AI API response

      // Always split paragraph into sentences
      let sentences = splitSentences(paragraph);

      // Optionally add unique otherSentences
      otherSentences.forEach((s) => {
        if (!sentences.includes(s)) sentences.push(s);
      });

      const fullWord = favoriteWords.find((w) => w.id === wordId);

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
        Swal.fire("Error", "Failed to generate paragraph", "error");
      }
    } finally {
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: false }));
    }
  };

  //   ==============AI===============

  const paginatedFavorites = favoriteWords.slice(
    (currentPage - 1) * 40,
    currentPage * 40
  );

  return (
    // <Container>
    <Container>
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 mb-3">
          ❤️ Favorite Words
        </h2>
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/50 rounded-full">
          <span className="text-2xl font-bold text-white">
            {favoriteWords.length}
          </span>
          <span className="text-gray-300 ml-2">words saved</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen ">
          <span className="loading loading-spinner text-accent w-24 h-24"></span>
        </div>
      ) : (
        <div className="min-h-screen mb-12">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
          <div className="min-h-screen bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/30 rounded-2xl p-1 md:p-4">
            <div className="overflow-x-auto">
              {paginatedFavorites.length > 0 ? (
                <>
                  <div className="flex justify-end items-center mb-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full text-green-400 font-semibold">
                      <span className="text-xl">👀</span> Showing{" "}
                      {paginatedFavorites.length}
                    </span>
                  </div>

                  <div className="border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
                    <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-sm md:text-xl lg:text-xl text-white">
                          <th className="py-3 text-sm md:text-lg lg:text-lg text-center text-orange-400 font-bold w-[5%] md:w-[3%] lg:w-[3%] rounded-tl-xl border-b border-gray-700">
                            Article
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
                          <th className="border-l py-3 border-dotted border-gray-700 text-sm md:text-lg lg:text-lg text-center text-red-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b rounded-tr-xl">
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFavorites.map((word, index) => (
                          <tr
                            key={word.id}
                            className={`${
                              index % 2 === 0
                                ? "bg-gray-800/40 hover:bg-gray-800/60"
                                : "bg-gray-900/40 hover:bg-gray-900/60"
                            } transition-all duration-300`}
                          >
                            <td className="border border-gray-700 border-dotted p-0 md:p-2 lg:p-2 font-semibold text-orange-400 text-center">
                              {word.article?.name}
                            </td>
                            <td className="border border-gray-700 border-dotted p-1 md:p-2 lg:p-2">
                              <div className="flex justify-between items-center">
                                <span
                                  className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm md:text-lg lg:text-lg font-bold pl-1 md:pl-0 lg:pl-0 line-clamp-2 hover:line-clamp-none hover:max-w-full break-words max-w-[120px] md:max-w-full hover:scale-105 transition-all duration-300"
                                  onClick={() => openModal(word)}
                                >
                                  {word.value.charAt(0).toUpperCase() +
                                    word.value.slice(1)}
                                </span>

                                <div className="flex gap-1 md:gap-2 lg:gap-2">
                                  <button
                                    onClick={() => pronounceWord(word.value)}
                                    className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/40 hover:to-cyan-500/40 border border-blue-500/50 text-white px-2 py-1 rounded-full hover:scale-110 transition-all duration-300 shadow-md"
                                  >
                                    🔊
                                  </button>

                                  <div
                                    onClick={() => generateParagraph(word)}
                                    className="relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500 hover:to-emerald-500 border-2 border-green-500/50 hover:border-green-400 text-white italic px-2 py-1 text-sm rounded-full h-7 w-7 cursor-pointer hover:scale-110 transition-all duration-300 shadow-md flex items-center justify-center"
                                  >
                                    {loadingParagraphs[word.id] && (
                                      <span className="absolute inset-0 flex items-center justify-center z-10">
                                        <PuffLoader size={20} color="#10b981" />
                                      </span>
                                    )}
                                    <span
                                      className={`${
                                        loadingParagraphs[word.id]
                                          ? "invisible"
                                          : "text-xs font-bold uppercase"
                                      }`}
                                    >
                                      ai
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="border border-gray-700 border-dotted pl-2 p-0 md:p-2 lg:p-2">
                              <span className="text-sm md:text-base lg:text-base line-clamp-2 hover:line-clamp-none break-words max-w-[120px] md:max-w-full text-white font-medium">
                                {word.meaning?.join(", ")}
                              </span>
                            </td>
                            <td className="border border-gray-700 border-dotted p-1 md:p-2 lg:p-2 hidden md:table-cell">
                              <div className="flex flex-wrap gap-1.5">
                                {word.synonyms?.map((synonym, index) => (
                                  <span
                                    key={index}
                                    onClick={() =>
                                      openWordInModal(synonym.value)
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/40 hover:to-purple-500/40 border border-blue-500/50 rounded-full text-blue-300 text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-300 hover:scale-105 shadow-md hover:shadow-blue-500/50"
                                  >
                                    {synonym.value}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="border border-gray-700/50 p-1 md:p-2 lg:p-2 hidden md:table-cell">
                              <div className="flex flex-wrap gap-1.5">
                                {word.antonyms?.map((antonym, index) => (
                                  <span
                                    key={index}
                                    onClick={() =>
                                      openWordInModal(antonym.value)
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/40 hover:to-pink-500/40 border border-red-500/50 rounded-full text-red-300 text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-300 hover:scale-105 shadow-md hover:shadow-red-500/50"
                                  >
                                    {antonym.value}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-700 border-dotted p-1 md:p-2 lg:p-2 hidden lg:table-cell">
                              <div className="flex flex-wrap gap-1.5">
                                {word.similarWords?.map(
                                  (similarWord, index) => (
                                    <span
                                      key={index}
                                      onClick={() =>
                                        openWordInModal(similarWord.value)
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 rounded-full text-purple-300 text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-300 hover:scale-105 shadow-md hover:shadow-purple-500/50"
                                    >
                                      {similarWord.value}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>

                            <td className="border border-gray-700 border-dotted p-1 md:p-2 lg:p-2 text-center">
                              <button
                                onClick={() => handleRemoveFavorite(word.id)}
                                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-600 hover:to-pink-600 border border-red-500/50 text-red-300 hover:text-white font-bold p-2.5 rounded-xl hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-red-500/50"
                              >
                                <ImBin size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="min-h-screen flex justify-center items-center">
                  <div className="text-center bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-gray-700/50 rounded-3xl p-12 shadow-2xl">
                    <div className="text-6xl mb-6">💔</div>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400 mb-4">
                      No Favorite Words Yet
                    </p>
                    <p className="text-gray-300 mb-6">
                      Start building your vocabulary collection!
                    </p>
                    <Link
                      to="/words"
                      className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                    >
                      📚 Browse Words
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
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

      {/* =======AI modal=============== */}
      <AIModal
        isOpen={isAIModalOpen}
        aiWord={aiWord}
        selectedParagraph={selectedParagraph}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* =================ai modal ===================== */}
    </Container>
  );
};

export default FavoritesList;
