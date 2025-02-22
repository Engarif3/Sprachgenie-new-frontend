// import React, { useState, useEffect } from "react";
// import axios from "../axios";
// import { Link, useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import WordListModal from "../Modals/WordListModal";
// import Container from "../utils/Container";
// import Pagination from "../utils/Pagination";
// import { getUserInfo, isLoggedIn } from "../services/auth.services";

// const FavoritesList = () => {
//   const navigate = useNavigate();
//   const [selectedWord, setSelectedWord] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [favoriteWords, setFavoriteWords] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const userLoggedIn = isLoggedIn();
//   const userInfo = getUserInfo();

//   useEffect(() => {
//     const fetchFavorites = async () => {
//       if (!userInfo?.id) return;

//       try {
//         const response = await axios.get(`/favorite-words/${userInfo.id}`);
//         if (response.data.success) {
//           setFavoriteWords(response.data.data);
//           setTotalPages(Math.ceil(response.data.data.length / 40));
//         } else {
//           setFavoriteWords([]);
//           setTotalPages(1);
//         }
//       } catch (error) {
//         // Handle 404 as no favorites without showing an error
//         if (error.response?.status === 404) {
//           setFavoriteWords([]);
//           setTotalPages(1);
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
//           timer: 1500, // Auto close after 1.5 seconds
//           showConfirmButton: false, // Hide the "OK" button
//         });
//       } catch (error) {
//         console.error("Error removing favorite:", error);
//         Swal.fire({
//           title: "Error!",
//           text: "Failed to remove favorite.",
//           icon: "error",
//           timer: 2000, // Auto close after 2 seconds
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

//   //   console.log("favorite words:", favoriteWords);
//   //   console.log("selected words:", selectedWord);
//   const paginatedFavorites = favoriteWords.slice(
//     (currentPage - 1) * 40,
//     currentPage * 40
//   );

//   return (
//     <Container>
//       <h2 className="text-3xl font-bold font-mono my-8 text-center">
//         {paginatedFavorites.length} Favorite Words
//       </h2>

//       {isLoading ? (
//         <div className="flex justify-center items-center min-h-screen">
//           <span className="loading loading-spinner text-accent w-24 h-24"></span>
//         </div>
//       ) : (
//         <div className="min-h-screen">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse mt-2">
//               <thead>
//                 <tr className="bg-cyan-600 text-xl text-white">
//                   <th className="border border-gray-600 p-1 text-center">
//                     Word
//                   </th>
//                   <th className="border border-gray-600 p-1 text-center">
//                     Meaning
//                   </th>
//                   {/* <th className="border border-gray-600 p-1 text-center">
//                     Level
//                   </th> */}
//                   <th className="border border-gray-600 p-1 text-center">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedFavorites.length > 0 ? (
//                   paginatedFavorites.map((word) => (
//                     <tr key={word.id} className="bg-white hover:bg-gray-50">
//                       <td
//                         className="border border-gray-600 p-2 text-blue-500 cursor-pointer"
//                         onClick={() => openModal(word)}
//                       >
//                         {word.value}
//                       </td>
//                       <td className="border border-gray-600 p-2">
//                         {word.meaning?.join(", ")}
//                       </td>
//                       {/* <td className="border border-gray-600 p-2 text-center">
//                         {word.level?.level}
//                       </td> */}
//                       <td className="border border-gray-600 p-2 text-center">
//                         <button
//                           onClick={() => handleRemoveFavorite(word.id)}
//                           className="text-red-500 hover:text-red-700 font-bold py-1 px-3 rounded"
//                         >
//                           Remove
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="4" className="text-center py-4">
//                       No favorite words found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
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
//     </Container>
//   );
// };

// export default FavoritesList;
import React, { useState, useEffect } from "react";
import axios from "../axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import WordListModal from "../Modals/WordListModal";
import Container from "../utils/Container";
import { getUserInfo, isLoggedIn } from "../services/auth.services";

const FavoritesList = () => {
  const navigate = useNavigate();
  const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo();

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

  return (
    <Container>
      <h2 className="text-3xl font-bold font-mono my-8 text-center">
        {paginatedFavorites.length} Favorite Words
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner text-accent w-24 h-24"></span>
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-2">
              <thead>
                <tr className="bg-cyan-600 text-xl text-white">
                  <th className="border border-gray-600 p-1 text-center">
                    Word
                  </th>
                  <th className="border border-gray-600 p-1 text-center">
                    Meaning
                  </th>
                  <th className="border border-gray-600 p-1 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedFavorites.length > 0 ? (
                  paginatedFavorites.map((word) => (
                    <tr key={word.id} className="bg-white hover:bg-gray-50">
                      <td
                        className="border border-gray-600 p-2 text-blue-500 cursor-pointer"
                        onClick={() => openModal(word)}
                      >
                        {word.value}
                      </td>
                      <td className="border border-gray-600 p-2">
                        {word.meaning?.join(", ")}
                      </td>
                      <td className="border border-gray-600 p-2 text-center">
                        <button
                          onClick={() => handleRemoveFavorite(word.id)}
                          className="text-red-500 hover:text-red-700 font-bold py-1 px-3 rounded"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No favorite words found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 my-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded transition-colors ${
                      currentPage === page
                        ? "bg-cyan-600 text-white hover:bg-cyan-700"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <WordListModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        selectedWord={selectedWord}
      />
    </Container>
  );
};

export default FavoritesList;
