import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import Container from "../../../utils/Container";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import Pagination from "./Pagination";
import { pronounceWord } from "../../../utils/wordPronounciation";
import { IoTrashBin } from "react-icons/io5";
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  setToLocalStorage,
} from "../../../utils/local-storage";
import aiApi from "../../../AI_axios";
import { PuffLoader } from "react-spinners";

const FavoritesList = () => {
  const [selectedWord, setSelectedWord] = useState(null);
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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");

  // =================ai===========================

  useEffect(() => {
    setFavorites(favoriteWords.map((w) => w.id));
  }, [favoriteWords]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userInfo?.id) return;

      try {
        const response = await axios.get(`/favorite-words/${userInfo.id}`);
        if (response.data.success) {
          setFavoriteWords(response.data.data);
        } else {
          setFavoriteWords([]);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setFavoriteWords([]);
        } else {
          console.error("Error fetching favorites:", error);
          Swal.fire("Error", "Failed to load favorites", "error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [userInfo?.id]);

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
          (w.synonyms && w.synonyms.some((syn) => syn.value === wordValue)) ||
          (w.antonyms && w.antonyms.some((ant) => ant.value === wordValue)) ||
          (w.similarWords &&
            w.similarWords.some((sim) => sim.value === wordValue))
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
        ...clickedWord,
        level: word.level,
        topic: word.topic,
        article: word.article,
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
        await axios.delete(`/favorite-words/${wordId}`, {
          data: { userId: userInfo.id },
        });

        setFavoriteWords((prev) => prev.filter((word) => word.id !== wordId));

        Swal.fire({
          title: "Removed!",
          text: "The word has been removed from favorites.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error removing favorite:", error);
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
    setSelectedWord(word);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedWord(null);
    setIsModalOpen(false);
  };

  const paginatedFavorites = favoriteWords.slice(
    (currentPage - 1) * 40,
    currentPage * 40
  );

  //favorites in modal
  useEffect(() => {
    const loadFavoritesFromDB = async () => {
      // Get all favorites as a single array
      const cachedFavorites = getFromLocalStorage("favorites");

      if (cachedFavorites && Array.isArray(cachedFavorites)) {
        setFavoriteWords(cachedFavorites);
        setFavorites(cachedFavorites.map((w) => w.id));
      }
    };

    loadFavoritesFromDB();
  }, []);

  useEffect(() => {
    setFavorites(favoriteWords.map((w) => w.id));
  }, [favoriteWords]);

  const toggleFavorite = async (wordId) => {
    setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));

    try {
      if (favorites.includes(wordId)) {
        // Remove favorite
        await axios.delete(`/favorite-words/${wordId}`, {
          data: { userId: userInfo.id },
        });

        const updatedFavorites = favoriteWords.filter((w) => w.id !== wordId);
        setFavorites(updatedFavorites.map((w) => w.id));
        setFavoriteWords(updatedFavorites);

        // Store updated array in localStorage
        setToLocalStorage("favorites", updatedFavorites);

        Swal.fire({
          title: "Removed!",
          text: "The word has been removed from favorites.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        // Add favorite
        const response = await axios.post(`/favorite-words`, {
          userId: userInfo.id,
          wordId,
        });

        if (response.data.success) {
          // Fetch updated favorites list
          const favResponse = await axios.get(`/favorite-words/${userInfo.id}`);
          if (favResponse.data.success) {
            setFavoriteWords(favResponse.data.data);
            setFavorites(favResponse.data.data.map((w) => w.id));

            // Store all favorites as a single array in localStorage
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
      console.error("Error toggling favorite:", err);
      Swal.fire("Error", "Failed to update favorites", "error");
    } finally {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: false }));
    }
  };

  //   // const toggleFavorite = async (wordId) => {
  //   //   setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));
  //   //   try {
  //   //     if (favorites.includes(wordId)) {
  //   //       // Remove favorite
  //   //       await axios.delete(`/favorite-words/${wordId}`, {
  //   //         data: { userId: userInfo.id },
  //   //       });
  //   //       setFavorites((prev) => prev.filter((id) => id !== wordId));
  //   //       setFavoriteWords((prev) => prev.filter((w) => w.id !== wordId));
  //   //     } else {
  //   //       // Add favorite
  //   //       const response = await axios.post(`/favorite-words`, {
  //   //         userId: userInfo.id,
  //   //         wordId,
  //   //       });
  //   //       if (response.data.success) {
  //   //         setFavorites((prev) => [...prev, wordId]);
  //   //       }
  //   //     }
  //   //   } catch (err) {
  //   //     console.error(err);
  //   //     Swal.fire("Error", "Failed to update favorites", "error");
  //   //   } finally {
  //   //     setLoadingFavorites((prev) => ({ ...prev, [wordId]: false }));
  //   //   }
  //   // };

  // // ==========================ai ===============================
  // const generateParagraph = async (word) => {
  //   if (!userInfo?.id) {
  //     Swal.fire(
  //       "Not Logged In",
  //       "You must be logged in to generate paragraphs",
  //       "warning"
  //     );
  //     return;
  //   }

  //   try {
  //     setLoadingParagraphs((prev) => ({ ...prev, [word.id]: true }));

  //     const response = await aiApi.post(`/paragraphs/generate`, {
  //       userId: userInfo.id,
  //       word: word.value,
  //       wordId: word.id,
  //       level: word.level?.level || "A1",
  //       language: "de",
  //     });

  //     const paragraph = response.data.paragraph;
  //     const wordId = response.data.wordId || word.id;

  //     const fullWord = favoriteWords.find((w) => w.id === wordId);

  //     setAiWord(fullWord || { id: wordId, value: word.value });
  //     setGeneratedParagraphs((prev) => ({ ...prev, [wordId]: paragraph }));
  //     setSelectedParagraph(paragraph);
  //     setIsAIModalOpen(true);
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.error || error.message;
  //     if (error.response?.status === 403) {
  //       Swal.fire("Limit Reached", errorMessage, "warning");
  //     } else {
  //       console.error("Error generating paragraph:", errorMessage);
  //       Swal.fire("Error", "Failed to generate paragraph", "error");
  //     }
  //   } finally {
  //     setLoadingParagraphs((prev) => ({ ...prev, [word.id]: false }));
  //   }
  // };

  // // =============report================

  // const handleReportSubmit = async () => {
  //   if (!aiWord?.id) {
  //     Swal.fire("Error", "Missing word ID", "error");
  //     return;
  //   }

  //   try {
  //     const response = await aiApi.post(`/paragraphs/report`, {
  //       wordId: aiWord.id, // ✅ send wordId instead of paragraphId
  //       userId: userInfo?.id ?? null, // optional
  //       message: reportMessage?.trim() || null, // optional
  //     });

  //     Swal.fire(
  //       "Reported",
  //       response.data.message || "Report submitted",
  //       "success"
  //     );

  //     setIsReportModalOpen(false);
  //     setReportMessage("");
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.error || error.message;
  //     Swal.fire("Error", errorMessage, "error");
  //   }
  // };

  // // ==========================ai ===============================

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
    // <Container>
    <Container>
      <h2 className="text-3xl text-white font-bold font-mono my-8 text-center">
        Favorite Words - {favoriteWords.length}
      </h2>

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
          <div className="overflow-x-auto ">
            {paginatedFavorites.length > 0 ? (
              <>
                <h2 className="text-md  font-mono  text-right mt-6 mb-2">
                  <span className="bg-green-700 px-1 rounded text-white ">
                    Showing-{paginatedFavorites.length}
                  </span>
                </h2>

                <table className="w-full border-collapse ">
                  <thead>
                    <tr className="bg-stone-800 text-sm md:text-xl lg:text-xl text-white py-2">
                      <th className="   p-1 text-center rounded-tl-md">
                        Article
                      </th>
                      <th className=" border-l border-gray-600 border-dotted py-2 text-center">
                        Word
                      </th>
                      <th className=" border-l border-gray-600 border-dotted py-2 text-center">
                        Meaning
                      </th>
                      <th className=" border-l border-gray-600 border-dotted py-2  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Synonym
                      </th>
                      <th className=" border-l border-gray-600 border-dotted py-2 text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Antonym
                      </th>
                      <th className=" border-l border-gray-600 border-dotted py-2  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Word to Watch
                      </th>
                      <th className="border-l border-gray-600 border-dotted py-2 text-center rounded-tr-md"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFavorites.map((word) => (
                      <tr key={word.id} className="bg-white hover:bg-gray-50">
                        <td className=" border border-gray-600 border-dotted p-0 md:p-2 lg:p-2   font-semibold text-orange-600 text-center">
                          {word.article?.name}
                        </td>
                        <td
                          className="border border-gray-600 border-dotted p-1 md:p-2 lg:p-2 text-blue-500 cursor-pointer
                         font-bold text-lg "
                        >
                          <div className="flex justify-between">
                            <span
                              // className="cursor-pointer text-blue-500 text-base sm:text-lg font-bold p-1 md:p-2 lg:p-2 break-words max-w-[120px] md:max-w-full"
                              className="cursor-pointer text-blue-500 text-sm md:text-lg lg:text-lg font-bold pl-1 md:pl-0 lg:pl-0  p-0 md:p-2 lg:p-2 line-clamp-2 hover:line-clamp-none hover:max-w-full break-words max-w-[120px] md:max-w-full"
                              onClick={() => openModal(word)}
                            >
                              {" "}
                              {word.value}
                            </span>

                            <div className="flex gap-1 md:gap-2 lg:gap-2">
                              <button
                                onClick={() => pronounceWord(word.value)}
                                className="text-blue-500 hover:text-blue-700 ml-0 md:ml-2 lg:ml-2 "
                              >
                                🔊
                              </button>

                              <div
                                onClick={() => generateParagraph(word)}
                                className="relative border-2 bg-green-700 text-white italic px-2 py-1 text-sm rounded-full h-6 w-6 cursor-pointer hover:scale-105 hover:bg-green-600 hover:text-white border-orange-500"
                                disabled={loadingParagraphs[word.id]}
                              >
                                {loadingParagraphs[word.id] && (
                                  <span className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <PuffLoader size={20} color="#FF0000" />
                                  </span>
                                )}
                                <span
                                  className={`${
                                    loadingParagraphs[word.id]
                                      ? "invisible"
                                      : "flex items-center justify-center relative bottom-1 capitalize"
                                  }`}
                                >
                                  ai
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-600 border-dotted pl-1 p-0 md:p-2 lg:p-2">
                          {/* {word.meaning?.join(", ")} */}
                          <span className="text-sm md:text-lg lg:text-lg line-clamp-2 hover:line-clamp-none break-words max-w-[120px] md:max-w-full">
                            {word.meaning?.join(", ")}
                          </span>
                        </td>
                        <td className="border border-gray-600 border-dotted  p-1 md:p-2 lg:p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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

                        <td className="border border-gray-600 border-dotted  p-1 md:p-2 lg:p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
                          <div className="flex flex-wrap gap-1">
                            {word.antonyms?.map((antonym, index) => (
                              <span
                                key={index}
                                onClick={() => openWordInModal(antonym.value)}
                                className="text-sm sm:text-base btn btn-sm btn-info"
                              >
                                {antonym.value}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="border border-gray-600 border-dotted  p-1 md:p-2 lg:p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
                          <div className="flex flex-wrap gap-1">
                            {word.similarWords?.map((similarWord, index) => (
                              <span
                                key={index}
                                onClick={() =>
                                  openWordInModal(similarWord.value)
                                }
                                className="text-sm sm:text-base btn btn-sm btn-info"
                              >
                                {similarWord.value}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="border border-gray-600 border-dotted p-1 md:p-2 lg:p-2 text-center">
                          <button
                            onClick={() => handleRemoveFavorite(word.id)}
                            className="text-red-700 hover:text-red-500 font-bold py-1 px-1 rounded"
                          >
                            <IoTrashBin size={24} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="min-h-screen flex justify-center items-center  ">
                <p className="text-xl text-center mb-52">
                  No favorite words found. <br /> Add some first. <br />
                  <Link
                    to="/words"
                    // className="btn btn-sm btn-warning  flex items-center justify-center md:hidden lg:hidden"
                    className="hover:scale-105 px-1 mt-2"
                  >
                    <button className=" btn btn-sm btn-secondary ml-2 text-xl  text-white mt-2">
                      Words
                    </button>
                  </Link>
                </p>
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* <WordListModal
         isOpen={isModalOpen}
         closeModal={closeModal}
         selectedWord={selectedWord}
       /> */}
      <WordListModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        selectedWord={selectedWord}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        loadingFavorites={loadingFavorites}
      />

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
                    <strong className="text-green-700">Meanings (AI):</strong>{" "}
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

      {/* =================ai modal ===================== */}
    </Container>
  );
};

export default FavoritesList;
