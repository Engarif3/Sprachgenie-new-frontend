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
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    inputValue: "",
  });

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
          (w.similarWords && w.similarWords.includes(wordValue)),
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

  const handleDeleteAllFavorites = async () => {
    if (deleteConfirmation.inputValue !== "ok") {
      Swal.fire("Error", "Please type 'ok' to confirm deletion", "error");
      return;
    }

    try {
      await axios.delete(`/favorite-words/delete-all/${userInfo.id}`);
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
    } catch (error) {
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
        "warning",
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

                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-gray-700/50 dark:shadow-2xl">
                    <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
                      <thead>
                        <tr className="bg-slate-900 text-sm text-white md:text-xl lg:text-xl dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                          <th className="rounded-tl-xl border-b border-l border-slate-200 py-3 text-center text-sm font-bold text-orange-400 md:text-lg lg:text-lg dark:border-gray-700 w-[5%] md:w-[3%] lg:w-[3%]">
                            Article
                          </th>
                          <th className="border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-blue-400 dark:border-gray-700 w-[15%] md:w-[10%] lg:w-[10%]">
                            Word
                          </th>
                          <th className="border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-purple-400 dark:border-gray-700 w-[10%] md:w-[25%] lg:w-[25%]">
                            Meaning
                          </th>
                          <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-cyan-400 dark:border-gray-700 md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                            Synonym
                          </th>
                          <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-pink-400 dark:border-gray-700 lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                            Antonym
                          </th>
                          <th className="hidden border-b border-l border-dotted border-slate-200 py-3 text-center font-bold text-green-400 dark:border-gray-700 lg:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                            Word to Watch
                          </th>
                          <th className="rounded-tr-xl border-b border-l border-dotted border-slate-200 py-3 text-center text-sm font-bold text-red-400 dark:border-gray-700 md:text-lg lg:text-lg w-[3%] md:w-[3%] lg:w-[3%]">
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
                                ? "bg-white hover:bg-sky-50/70 dark:bg-gray-800 dark:hover:bg-gray-700"
                                : "bg-slate-50/80 hover:bg-sky-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                            } border-b border-slate-200 transition-all duration-300 dark:border-gray-700`}
                          >
                            <td className="border border-slate-200 border-dotted p-0 text-center font-semibold text-orange-500 dark:border-gray-700 dark:text-orange-400 md:p-2 lg:p-2">
                              {word.article?.name}
                            </td>
                            <td className="border border-slate-200 border-dotted p-1 dark:border-gray-700 md:p-2 lg:p-2">
                              <div className="flex justify-between items-center">
                                <span
                                  className="max-w-[120px] cursor-pointer break-words pl-1 text-sm font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:text-blue-700 line-clamp-2 hover:line-clamp-none hover:max-w-full dark:text-blue-400 dark:hover:text-blue-300 md:max-w-full md:pl-0 md:text-lg lg:pl-0 lg:text-lg"
                                  onClick={() => openModal(word)}
                                >
                                  {word.value.charAt(0).toUpperCase() +
                                    word.value.slice(1)}
                                </span>

                                <div className="flex gap-1 md:gap-2 lg:gap-2">
                                  <button
                                    onClick={() => pronounceWord(word.value)}
                                    className="rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 px-2 py-1 text-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-blue-100 hover:to-cyan-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-white dark:hover:from-blue-500/40 dark:hover:to-cyan-500/40"
                                  >
                                    🔊
                                  </button>

                                  <div
                                    onClick={() => generateParagraph(word)}
                                    className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 px-2 py-1 text-sm italic text-emerald-700 shadow-sm transition-all duration-300 hover:scale-110 hover:border-emerald-400 hover:from-emerald-500 hover:to-green-500 hover:text-white dark:border-green-500/50 dark:from-green-500/20 dark:to-emerald-500/20 dark:text-white dark:hover:border-green-400 dark:hover:from-green-500 dark:hover:to-emerald-500"
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
                            <td className="border border-slate-200 border-dotted p-0 pl-2 dark:border-gray-700 md:p-2 lg:p-2">
                              <span className="max-w-[120px] break-words text-sm font-medium text-slate-700 line-clamp-2 hover:line-clamp-none dark:text-white md:max-w-full md:text-base lg:text-base">
                                {word.meaning?.join(", ")}
                              </span>
                            </td>
                            <td className="hidden border border-slate-200 border-dotted p-1 dark:border-gray-700 md:table-cell md:p-2 lg:p-2">
                              <div className="flex flex-wrap gap-1.5">
                                {word.synonyms?.map((synonym, index) => (
                                  <span
                                    key={index}
                                    onClick={() =>
                                      openWordInModal(synonym.value)
                                    }
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-md font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-blue-100 hover:to-indigo-100 dark:border-blue-500/50 dark:from-blue-500/20 dark:to-purple-500/20 dark:text-blue-300 dark:hover:from-blue-500/40 dark:hover:to-purple-500/40 dark:hover:shadow-blue-500/50"
                                  >
                                    {synonym.value}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="hidden border border-slate-200 p-1 dark:border-gray-700/50 md:table-cell md:p-2 lg:p-2">
                              <div className="flex flex-wrap gap-1.5">
                                {word.antonyms?.map((antonym, index) => (
                                  <span
                                    key={index}
                                    onClick={() =>
                                      openWordInModal(antonym.value)
                                    }
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1.5 text-md font-semibold text-rose-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-rose-100 hover:to-pink-100 dark:border-red-500/50 dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-300 dark:hover:from-red-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-red-500/50"
                                  >
                                    {antonym.value}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="hidden border border-slate-200 border-dotted p-1 dark:border-gray-700 lg:table-cell md:p-2 lg:p-2">
                              <div className="flex flex-wrap gap-1.5">
                                {word.similarWords?.map(
                                  (similarWord, index) => (
                                    <span
                                      key={index}
                                      onClick={() =>
                                        openWordInModal(similarWord.value)
                                      }
                                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-1.5 text-md font-semibold text-violet-700 shadow-sm transition-all duration-300 hover:scale-105 hover:from-violet-100 hover:to-fuchsia-100 dark:border-purple-500/50 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-300 dark:hover:from-purple-500/40 dark:hover:to-pink-500/40 dark:hover:shadow-purple-500/50"
                                    >
                                      {similarWord.value}
                                    </span>
                                  ),
                                )}
                              </div>
                            </td>

                            <td className="border border-slate-200 border-dotted p-1 text-center dark:border-gray-700 md:p-2 lg:p-2">
                              <button
                                onClick={() => handleRemoveFavorite(word.id)}
                                className="rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 p-2.5 font-bold text-rose-700 shadow-sm transition-all duration-300 hover:scale-110 hover:from-red-600 hover:to-pink-600 hover:text-white dark:border-red-500/50 dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-300 dark:shadow-lg dark:hover:shadow-red-500/50"
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
              <label className="block text-gray-400 text-sm mb-2">
                Type "ok" to confirm:
              </label>
              <input
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
                onKeyPress={(e) => {
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
