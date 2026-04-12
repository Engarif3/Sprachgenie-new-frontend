import { useState, useEffect, useCallback } from "react";
import axios from "../../../axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import Container from "../../../utils/Container";
import { useAuth } from "../../../services/auth.services";
import Pagination from "./Pagination";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "../../../utils/local-storage";
import aiApi from "../../../AI_axios";
import AIModal from "../Modals/AIModal";
import FavoriteWordsTable from "./FavoriteWordsTable";

const FavoritesList = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    inputValue: "",
  });

  const { userId } = useAuth();

  // =================ai===========================
  const [aiWord, setAiWord] = useState(null);
  const [, setGeneratedParagraphs] = useState({});
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // =================ai===========================

  const handleAiWordUpdated = useCallback((updatedWord, updatedParagraph) => {
    setFavoriteWords((prev) => {
      const nextWords = prev.map((word) =>
        word.id === updatedWord.id
          ? {
              ...word,
              meaning: updatedWord.meaning,
            }
          : word,
      );
      setToLocalStorage("favorites", nextWords);
      return nextWords;
    });
    setAiWord(updatedWord);
    if (typeof updatedParagraph === "string") {
      setSelectedParagraph(updatedParagraph);
    }
  }, []);

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
      if (!userId) return;

      try {
        const response = await axios.get(`/favorite-words/${userId}`);
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
  }, [userId]);

  useEffect(() => {
    const newTotalPages = Math.ceil(favoriteWords.length / 40);
    setTotalPages(newTotalPages);

    // Adjust current page if it's now out of bounds
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, favoriteWords]);

  const openWordInModal = useCallback(
    async (wordValue) => {
      const exactWordMatch = favoriteWords.find(
        (word) => word.value === wordValue,
      );

      if (exactWordMatch) {
        openModal(exactWordMatch);
        return;
      }

      try {
        const response = await axios.get(
          `/word/${encodeURIComponent(wordValue)}`,
        );
        const fetchedWord = response.data?.data;

        if (fetchedWord?.id) {
          openModal({
            ...fetchedWord,
            sentences: fetchedWord.sentences || [],
            meaning: fetchedWord.meaning || [],
            synonyms: fetchedWord.synonyms || [],
            antonyms: fetchedWord.antonyms || [],
            similarWords: fetchedWord.similarWords || [],
            pluralForm: fetchedWord.pluralForm || "",
          });
          return;
        }
      } catch (error) {
        console.error("Failed to fetch linked favorite word:", error);
      }

      const word = favoriteWords.find(
        (w) =>
          (w.synonyms && w.synonyms.some((syn) => syn.value === wordValue)) ||
          (w.antonyms && w.antonyms.some((ant) => ant.value === wordValue)) ||
          (w.similarWords &&
            w.similarWords.some((sim) => sim.value === wordValue)),
      );

      if (!word) {
        Swal.fire(
          "Not Found",
          "The word or synonym/antonym/similar word doesn't exist.",
          "error",
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
              { value: word.value },
              ...word.synonyms.filter((syn) => syn.value !== wordValue),
            ]
          : [];

      const enrichedAntonyms = isParent
        ? word.antonyms || []
        : isSynonym
          ? word.antonyms || []
          : isAntonym
            ? [{ value: word.value }, ...(word.synonyms || [])].filter(
                (entry) => entry.value !== wordValue,
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
    [favoriteWords],
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
      } catch {
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

  const handleDeleteAllFavorites = async () => {
    if (deleteConfirmation.inputValue !== "ok") {
      Swal.fire("Error", "Please type 'ok' to confirm deletion", "error");
      return;
    }

    try {
      await axios.delete(`/favorite-words/delete-all/${userId}`);
      setFavoriteWords([]);
      setFavorites([]);
      setToLocalStorage("favorites", []);
      setDeleteConfirmation({ show: false, inputValue: "" });

      Swal.fire({
        title: "Deleted!",
        text: "All favorite words have been removed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        title: "Error!",
        text: "Failed to delete all favorites.",
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const openModal = (word) => {
    setSelectedWord(word);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedWord(null);
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
          const favResponse = await axios.get(`/favorite-words/${userId}`);
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
    } catch {
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
    if (!userId) {
      Swal.fire(
        "Not Logged In",
        "You must be logged in to generate paragraphs",
        "warning",
      );
      return;
    }

    try {
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: true }));

      const response = await aiApi.post(`/paragraphs/generate`, {
        userId,
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
      const otherSentences =
        response.data.otherSentences || response.data.sentences || [];
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
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: false }));
    }
  };

  //   ==============AI===============

  const paginatedFavorites = favoriteWords.slice(
    (currentPage - 1) * 40,
    currentPage * 40,
  );

  return (
    // <Container>
    <Container>
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-red-400 to-orange-400 mb-3">
          ❤️ Favorite Words
        </h2>
        <div className="inline-flex gap-4 items-center">
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/50 rounded-full">
            <span className="text-sm md:text-2xl lg:text-2xl font-bold dark:text-white">
              {favoriteWords.length}
            </span>
            <span className="dark:text-gray-300 ml-2">words saved</span>
          </div>
          {favoriteWords.length > 0 && (
            <button
              onClick={() =>
                setDeleteConfirmation({ show: true, inputValue: "" })
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors"
            >
              🗑️ Delete All
            </button>
          )}
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
          <div className="min-h-screen rounded-2xl bg-slate-50/80 p-1 md:p-4 lg:p-4 dark:bg-transparent">
            <div className="overflow-x-auto">
              {paginatedFavorites.length > 0 ? (
                <>
                  <div className="flex justify-end items-center mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 font-semibold text-emerald-700 dark:border-green-500/50 dark:from-green-500/20 dark:to-emerald-500/20 dark:text-green-400">
                      <span className="text-xl">👀</span> Showing{" "}
                      {paginatedFavorites.length}
                    </span>
                  </div>

                  <FavoriteWordsTable
                    paginatedFavorites={paginatedFavorites}
                    openModal={openModal}
                    openWordInModal={openWordInModal}
                    generateParagraph={generateParagraph}
                    loadingParagraphs={loadingParagraphs}
                    handleRemoveFavorite={handleRemoveFavorite}
                    variant="page"
                  />
                </>
              ) : (
                <div className="min-h-screen flex justify-center items-center">
                  <div className="rounded-3xl border-2 border-slate-200 bg-white p-12 text-center shadow-xl dark:border-gray-700/50 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-black dark:shadow-2xl">
                    <div className="text-6xl mb-6">💔</div>
                    <p className="mb-4 bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-2xl font-bold text-transparent dark:from-pink-400 dark:to-red-400">
                      No Favorite Words Yet
                    </p>
                    <p className="mb-6 text-slate-600 dark:text-gray-300">
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
        onWordUpdated={handleAiWordUpdated}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Delete All Favorites Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-600 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              ⚠️ Confirm Deletion
            </h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete ALL favorite words? This action
              cannot be undone.
            </p>
            <div className="mb-6">
              <label
                htmlFor="favorites-delete-confirm"
                className="block text-gray-400 text-sm mb-2"
              >
                Type "ok" to confirm:
              </label>
              <input
                id="favorites-delete-confirm"
                type="text"
                value={deleteConfirmation.inputValue}
                onChange={(e) =>
                  setDeleteConfirmation({
                    ...deleteConfirmation,
                    inputValue: e.target.value,
                  })
                }
                placeholder="Type 'ok' to confirm"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-500"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    deleteConfirmation.inputValue === "ok"
                  ) {
                    handleDeleteAllFavorites();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirmation({ show: false, inputValue: "" })
                }
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllFavorites}
                disabled={deleteConfirmation.inputValue !== "ok"}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================ai modal ===================== */}
    </Container>
  );
};

export default FavoritesList;
