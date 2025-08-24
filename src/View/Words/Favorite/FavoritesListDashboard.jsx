// import React, { useState, useEffect, useCallback } from "react";
// import axios from "../../../axios";
// import { Link, useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import WordListModal from "../Modals/WordListModal";
// import Container from "../../../utils/Container";
// import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
// import Pagination from "./Pagination";

// const FavoritesListDashboard = () => {
//   const [selectedWord, setSelectedWord] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [favoriteWords, setFavoriteWords] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const userInfo = getUserInfo();

//   useEffect(() => {
//     const fetchFavorites = async () => {
//       if (!userInfo?.id) return;

//       try {
//         const response = await axios.get(`/favorite-words/${userInfo.id}`);
//         if (response.data.success) {
//           setFavoriteWords(response.data.data);
//         } else {
//           setFavoriteWords([]);
//         }
//       } catch (error) {
//         if (error.response?.status === 404) {
//           setFavoriteWords([]);
//         } else {
//           console.error("Error fetching favorites:", error);
//           Swal.fire("Error", "Failed to load favorites", "error");
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchFavorites();
//   }, [userInfo?.id]);

//   useEffect(() => {
//     const newTotalPages = Math.ceil(favoriteWords.length / 40);
//     setTotalPages(newTotalPages);

//     // Adjust current page if it's now out of bounds
//     if (currentPage > newTotalPages && newTotalPages > 0) {
//       setCurrentPage(newTotalPages);
//     } else if (newTotalPages === 0) {
//       setCurrentPage(1);
//     }
//   }, [favoriteWords]);

//   const openWordInModal = useCallback(
//     (wordValue) => {
//       const word = favoriteWords.find(
//         (w) =>
//           w.value === wordValue ||
//           (w.synonyms && w.synonyms.some((syn) => syn.value === wordValue)) ||
//           (w.antonyms && w.antonyms.some((ant) => ant.value === wordValue)) ||
//           (w.similarWords &&
//             w.similarWords.some((sim) => sim.value === wordValue))
//       );

//       if (!word) {
//         Swal.fire(
//           "Not Found",
//           "The word or synonym/antonym/similar word doesn't exist.",
//           "error"
//         );
//         return;
//       }

//       const isParent = word.value === wordValue;
//       const isSynonym =
//         !isParent &&
//         word.synonyms &&
//         word.synonyms.some((syn) => syn.value === wordValue);
//       const isAntonym =
//         !isParent &&
//         word.antonyms &&
//         word.antonyms.some((ant) => ant.value === wordValue);
//       const isSimilar =
//         !isParent &&
//         word.similarWords &&
//         word.similarWords.some((sim) => sim.value === wordValue);

//       const clickedWord = isParent
//         ? word
//         : isSynonym
//         ? word.synonyms.find((syn) => syn.value === wordValue)
//         : isAntonym
//         ? word.antonyms.find((ant) => ant.value === wordValue)
//         : word.similarWords.find((sim) => sim.value === wordValue);

//       const enrichedSynonyms = isParent
//         ? word.synonyms || []
//         : isSynonym
//         ? [
//             { value: word.value }, // original favorite word included here
//             ...word.synonyms.filter((syn) => syn.value !== wordValue),
//           ]
//         : [];

//       const enrichedAntonyms = isParent
//         ? word.antonyms || []
//         : isSynonym
//         ? word.antonyms || []
//         : isAntonym
//         ? [{ value: word.value }, ...(word.synonyms || [])].filter(
//             (entry) => entry.value !== wordValue
//           )
//         : [];

//       const enrichedSimilarWords = isParent
//         ? word.similarWords || []
//         : isSimilar
//         ? [
//             { value: word.value },
//             ...word.similarWords.filter((sim) => sim.value !== wordValue),
//           ]
//         : [];

//       const enriched = {
//         ...clickedWord,
//         level: word.level,
//         topic: word.topic,
//         article: word.article,
//         synonyms: enrichedSynonyms,
//         antonyms: enrichedAntonyms,
//         similarWords: enrichedSimilarWords,
//       };

//       openModal(enriched);
//     },
//     [favoriteWords]
//   );

//   const handleRemoveFavorite = async (wordId) => {
//     const result = await Swal.fire({
//       title: "Remove from Favorites?",
//       text: "Are you sure you want to remove this word from your favorites?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, remove it!",
//     });

//     if (result.isConfirmed) {
//       try {
//         await axios.delete(`/favorite-words/${wordId}`, {
//           data: { userId: userInfo.id },
//         });

//         setFavoriteWords((prev) => prev.filter((word) => word.id !== wordId));

//         Swal.fire({
//           title: "Removed!",
//           text: "The word has been removed from favorites.",
//           icon: "success",
//           timer: 1000,
//           showConfirmButton: false,
//         });
//       } catch (error) {
//         console.error("Error removing favorite:", error);
//         Swal.fire({
//           title: "Error!",
//           text: "Failed to remove favorite.",
//           icon: "error",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }
//     }
//   };

//   const openModal = (word) => {
//     setSelectedWord(word);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setSelectedWord(null);
//     setIsModalOpen(false);
//   };

//   const paginatedFavorites = favoriteWords.slice(
//     (currentPage - 1) * 40,
//     currentPage * 40
//   );

//   return (
//     // <Container>
//     <>
//       <h2 className="text-3xl text-white font-bold font-mono my-8 text-center">
//         {favoriteWords.length} Favorite Words
//       </h2>

//       {isLoading ? (
//         <div className="flex justify-center items-center min-h-screen ">
//           <span className="loading loading-spinner text-accent w-24 h-24"></span>
//         </div>
//       ) : (
//         <div className="min-h-screen mb-12">
//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//           />
//           <div className="overflow-x-auto">
//             {paginatedFavorites.length > 0 ? (
//               <>
//                 <h2 className="text-md  font-mono  text-right  ">
//                   <span className="bg-green-700 px-1 rounded text-white ">
//                     Showing-{paginatedFavorites.length}
//                   </span>
//                 </h2>

//                 <table className="w-full border-collapse ">
//                   <thead>
//                     <tr className="bg-cyan-600 text-xl text-white">
//                       <th className="border border-gray-600 p-1 text-center">
//                         Word
//                       </th>
//                       <th className="border border-gray-600 p-1 text-center">
//                         Meaning
//                       </th>
//                       <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
//                         Synonym
//                       </th>
//                       <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
//                         Antonym
//                       </th>
//                       <th className="border border-gray-600 p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
//                         Deceptive
//                       </th>
//                       <th className="border border-gray-600 p-1 text-center">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {paginatedFavorites.map((word) => (
//                       <tr key={word.id} className="bg-white hover:bg-gray-50">
//                         <td
//                           className="border border-gray-600 p-2 text-blue-500 cursor-pointer
//                         font-bold text-lg"
//                           onClick={() => openModal(word)}
//                         >
//                           {word.value}
//                         </td>
//                         <td className="border border-gray-600 p-2">
//                           {word.meaning?.join(", ")}
//                         </td>
//                         <td className="border border-gray-600  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
//                           <div className="flex flex-wrap gap-1">
//                             {word.synonyms?.map((synonym, index) => (
//                               <span
//                                 key={index}
//                                 onClick={() => openWordInModal(synonym.value)}
//                                 // className="text-sm sm:text-base hover:underline"
//                                 className="text-sm sm:text-base btn btn-sm btn-info"
//                               >
//                                 {synonym.value}
//                               </span>
//                             ))}
//                           </div>
//                         </td>

//                         <td className="border border-gray-600  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
//                           <div className="flex flex-wrap gap-1">
//                             {word.antonyms?.map((antonym, index) => (
//                               <span
//                                 key={index}
//                                 onClick={() => openWordInModal(antonym.value)}
//                                 className="text-sm sm:text-base btn btn-sm btn-info"
//                               >
//                                 {antonym.value}
//                               </span>
//                             ))}
//                           </div>
//                         </td>
//                         <td className="border border-gray-600  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
//                           <div className="flex flex-wrap gap-1">
//                             {word.similarWords?.map((similarWord, index) => (
//                               <span
//                                 key={index}
//                                 onClick={() =>
//                                   openWordInModal(similarWord.value)
//                                 }
//                                 className="text-sm sm:text-base btn btn-sm btn-info"
//                               >
//                                 {similarWord.value}
//                               </span>
//                             ))}
//                           </div>
//                         </td>

//                         <td className="border border-gray-600 p-2 text-center">
//                           <button
//                             onClick={() => handleRemoveFavorite(word.id)}
//                             className="text-red-500 hover:text-red-700 font-bold py-1 px-3 rounded"
//                           >
//                             Remove
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </>
//             ) : (
//               <div className="min-h-screen flex justify-center items-center  ">
//                 <p className="text-xl text-center mb-52">
//                   No favorite words found. <br /> Add some first. <br />
//                   <Link
//                     to="/words"
//                     // className="btn btn-sm btn-warning  flex items-center justify-center md:hidden lg:hidden"
//                     className="hover:scale-105 px-1 mt-2"
//                   >
//                     <button className=" btn btn-sm btn-secondary ml-2 text-xl  text-white mt-2">
//                       Words
//                     </button>
//                   </Link>
//                 </p>
//               </div>
//             )}
//           </div>

//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//           />
//         </div>
//       )}

//       <WordListModal
//         isOpen={isModalOpen}
//         closeModal={closeModal}
//         selectedWord={selectedWord}
//       />
//       {/* </Container> */}
//     </>
//   );
// };

// export default FavoritesListDashboard;

import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import { getUserInfo, isLoggedIn } from "../../../services/auth.services";
import Pagination from "./Pagination";
import { pronounceWord } from "../../../utils/wordPronounciation";
import { IoTrashBin } from "react-icons/io5";
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  setToLocalStorage,
} from "../../../utils/local-storage";

const FavoritesListDashboard = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const userInfo = getUserInfo();
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState({});

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
      const keys = favoriteWords.map((w) => `favorite-${w.id}`);
      const cachedFavorites = await Promise.all(
        keys.map((key) => getFromLocalStorage(key))
      );

      const validFavorites = cachedFavorites.filter(Boolean);
      if (validFavorites.length > 0) {
        setFavoriteWords(validFavorites);
        setFavorites(validFavorites.map((w) => w.id));
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

        setFavorites((prev) => prev.filter((id) => id !== wordId));
        setFavoriteWords((prev) => prev.filter((w) => w.id !== wordId));

        Swal.fire({
          title: "Removed!",
          text: "The word has been removed from favorites.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });

        await removeFromLocalStorage(`favorite-${wordId}`);
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

            // Optional: update IndexedDB cache
            for (let word of favResponse.data.data) {
              await setToLocalStorage(`favorite-${word.id}`, word);
            }
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

  return (
    <>
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
          <div className="overflow-x-auto">
            {paginatedFavorites.length > 0 ? (
              <>
                <h2 className="text-md  font-mono  text-right  ">
                  <span className="bg-green-700 px-1 rounded text-white ">
                    Showing-{paginatedFavorites.length}
                  </span>
                </h2>

                <table className="w-full border-collapse ">
                  <thead>
                    <tr className="bg-cyan-600 text-xl text-white">
                      <th className="border border-gray-600 border-dotted p-1 text-center">
                        Article
                      </th>
                      <th className="border border-gray-600 border-dotted p-1 text-center">
                        Word
                      </th>
                      <th className="border border-gray-600 border-dotted p-1 text-center">
                        Meaning
                      </th>
                      <th className="border border-gray-600 border-dotted p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Synonym
                      </th>
                      <th className="border border-gray-600 border-dotted p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Antonym
                      </th>
                      <th className="border border-gray-600 border-dotted p-0 md:p-1 lg:p-1  text-center hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%]">
                        Deceptive
                      </th>
                      <th className="border border-gray-600 border-dotted p-1 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFavorites.map((word) => (
                      <tr key={word.id} className="bg-white hover:bg-gray-50">
                        <td className=" border border-gray-600 border-dotted p-2  font-semibold text-orange-600 text-center">
                          {word.article?.name}
                        </td>
                        <td
                          className="border border-gray-600 border-dotted p-2 text-blue-500 cursor-pointer
                        font-bold text-lg "
                        >
                          <div className="flex justify-between">
                            <span
                              className="cursor-pointer text-blue-500 text-base sm:text-lg font-bold "
                              onClick={() => openModal(word)}
                            >
                              {" "}
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
                        <td className="border border-gray-600 border-dotted p-2">
                          {word.meaning?.join(", ")}
                        </td>
                        <td className="border border-gray-600 border-dotted  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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

                        <td className="border border-gray-600 border-dotted  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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
                        <td className="border border-gray-600 border-dotted  p-2 text-blue-500 cursor-pointer hidden md:table-cell ">
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

                        <td className="border border-gray-600 border-dotted p-2 text-center">
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
    </>
  );
};

export default FavoritesListDashboard;
