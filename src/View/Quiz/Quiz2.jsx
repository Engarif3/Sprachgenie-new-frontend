import Container from "../../utils/Container";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getFromStorage, setToStorage } from "../../utils/storage";
import api from "../../axios";
import { pronounceWord } from "../../utils/wordPronounciation";

const CACHE_KEY = "wordListCache";
const QUIZ_STORAGE_KEY = "quizState";
const QUIZ_LENGTH = 30;
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 mins

// Updated Difficulty configuration based on WordList component
const DIFFICULTY_LEVELS = {
  1: { name: "Easy", description: "Level A1 & A2 words (Beginner)" },
  2: {
    name: "Difficult",
    description: "Level B1 & B2 words (Intermediate/Advanced)",
  },
};

const loadWords = async () => {
  try {
    const cachedData = await getFromStorage(CACHE_KEY);

    if (
      cachedData &&
      cachedData.words &&
      Date.now() - cachedData.lastUpdated < CACHE_EXPIRY
    ) {
      console.log("Using cached words");
      return cachedData;
    }

    // Fetch from API if cache empty or expired
    console.log("Fetching fresh data from API");
    const response = await api.get("/word/all?all=true");
    console.log("API response:", response.data);

    const words = response.data.data?.words || [];
    const levels = response.data.data?.levels || [];
    const topics = response.data.data?.topics || [];

    const newCache = {
      words,
      levels,
      topics,
      lastUpdated: Date.now(),
    };

    console.log("Saving to storage:", newCache);
    await setToStorage(CACHE_KEY, newCache);
    return newCache;
  } catch (error) {
    console.error("Error fetching words for quiz:", error);
    return { words: [], levels: [], topics: [] };
  }
};

// Updated filter function based on WordList component structure
// From WordList: A1>level id:1, A2>id:2, B1>id:3, B2>id:4, C1>id:6
const filterWordsByDifficulty = (words, difficulty) => {
  if (!words.length) return [];

  console.log(`Filtering ${words.length} words for difficulty ${difficulty}`);

  switch (difficulty) {
    case 1: // Easy - A1 (id:1) and A2 (id:2)
      const easyWords = words.filter(
        (word) => word.level?.id === 1 || word.level?.id === 2
      );
      console.log(`Found ${easyWords.length} easy words (A1 & A2)`);
      return easyWords;
    case 2: // Difficult - B1 (id:3) and B2 (id:4)
      const hardWords = words.filter(
        (word) => word.level?.id === 3 || word.level?.id === 4
      );
      console.log(`Found ${hardWords.length} hard words (B1 & B2)`);
      return hardWords;
    default:
      return words;
  }
};

const Quiz = () => {
  const [mode, setMode] = useState(""); // "single" or "multi"
  const [difficulty, setDifficulty] = useState(1); // Default to easy
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [words, setWords] = useState([]);
  const [allWords, setAllWords] = useState([]); // Store all words for filtering
  const [quizWords, setQuizWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usedScores, setUsedScores] = useState({
    player1: false,
    player2: false,
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      try {
        // Load words (from cache or API)
        const cachedData = await loadWords();
        console.log("Loaded cached data:", cachedData);

        setAllWords(cachedData.words || []);

        // Apply initial difficulty filter
        const initialWords = filterWordsByDifficulty(
          cachedData.words || [],
          difficulty
        );
        setWords(initialWords);

        // Load previous quiz state if exists
        const savedState = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
        if (savedState) {
          setMode(savedState.mode || "");
          setDifficulty(savedState.difficulty || 1);
          setPlayer1(savedState.player1);
          setPlayer2(savedState.player2);
          setQuizWords(savedState.quizWords);
          setCurrentIndex(savedState.currentIndex);
          setScores(savedState.scores);
          setQuizStarted(savedState.quizStarted);
        }
      } catch (error) {
        console.error("Error initializing quiz:", error);
        setAllWords([]);
        setWords([]);
      }

      setLoading(false);
    };

    init();
  }, []);

  // Update words when difficulty changes
  useEffect(() => {
    if (allWords.length > 0) {
      console.log(`Difficulty changed to ${difficulty}, filtering words...`);
      const filteredWords = filterWordsByDifficulty(allWords, difficulty);
      setWords(filteredWords);
    }
  }, [difficulty, allWords]);

  // Save quiz state
  useEffect(() => {
    if (quizStarted) {
      const stateToSave = {
        mode,
        difficulty,
        player1,
        player2,
        quizWords,
        currentIndex,
        scores,
        quizStarted,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [
    mode,
    difficulty,
    player1,
    player2,
    quizWords,
    currentIndex,
    scores,
    quizStarted,
  ]);

  // Start quiz
  const startQuiz = () => {
    // Set default player name for single player
    const actualPlayer1 = mode === "single" ? "YOU" : player1;
    setPlayer1(actualPlayer1);

    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(
      0,
      Math.min(QUIZ_LENGTH, words.length)
    );

    console.log(
      `Starting quiz with ${selectedWords.length} words for difficulty ${difficulty}`
    );

    setQuizWords(selectedWords);
    setCurrentIndex(0);
    setScores({ player1: 0, player2: 0 });
    setShowMeaning(false);
    setQuizStarted(true);

    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        mode,
        difficulty,
        player1: actualPlayer1,
        player2,
        quizWords: selectedWords,
        currentIndex: 0,
        scores: { player1: 0, player2: 0 },
        quizStarted: true,
      })
    );
  };

  const handleScore = (player, delta) => {
    // Prevent double scoring for same word
    if (usedScores[player]) return;

    setScores((prev) => ({ ...prev, [player]: (prev[player] || 0) + delta }));
    setUsedScores((prev) => ({ ...prev, [player]: true }));
  };

  const nextWord = () => {
    if (currentIndex + 1 < quizWords.length) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
      setUsedScores({ player1: false, player2: false });
    } else {
      const finalScores = { ...scores };
      const winner =
        mode === "single"
          ? `${player1}'s Score: ${finalScores.player1}`
          : finalScores.player1 === finalScores.player2
          ? "It's a tie!"
          : finalScores.player1 > finalScores.player2
          ? player1
          : player2;

      Swal.fire({
        title: "Quiz Finished!",
        html:
          mode === "single"
            ? `<p>${player1}: ${finalScores.player1}</p><p>Difficulty: ${DIFFICULTY_LEVELS[difficulty].name}</p>`
            : `<p>${player1}: ${finalScores.player1}</p><p>${player2}: ${finalScores.player2}</p><p>Difficulty: ${DIFFICULTY_LEVELS[difficulty].name}</p><p>Winner: <strong>${winner}</strong></p>`,
        icon: "success",
      });

      const history = JSON.parse(localStorage.getItem("quizScores") || "[]");
      history.push({
        mode,
        difficulty: DIFFICULTY_LEVELS[difficulty].name,
        player1: { name: player1, score: finalScores.player1 },
        ...(mode === "multi" && {
          player2: { name: player2, score: finalScores.player2 },
        }),
        date: new Date().toISOString(),
      });
      localStorage.setItem("quizScores", JSON.stringify(history));

      // Reset quiz
      setUsedScores({ player1: false, player2: false });
      setQuizStarted(false);
      setQuizWords([]);
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    }
  };

  const resetQuiz = () => {
    Swal.fire({
      title: "Reset Quiz?",
      text: "All progress will be lost. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reset",
    }).then((result) => {
      if (result.isConfirmed) {
        setQuizWords([]);
        setCurrentIndex(0);
        setScores({ player1: 0, player2: 0 });
        setShowMeaning(false);
        setQuizStarted(false);
        setUsedScores({ player1: false, player2: false });
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      }
    });
  };

  // Debug function to check storage and word levels
  //   const debugStorage = async () => {
  //     const cached = await getFromStorage(CACHE_KEY);
  //     console.log("Current cache:", cached);
  //     console.log("All words:", allWords);
  //     console.log("Filtered words:", words);

  //     // Log level distribution for debugging
  //     if (allWords.length > 0) {
  //       const levelDistribution = allWords.reduce((acc, word) => {
  //         const levelId = word.level?.id;
  //         const levelName = word.level?.level || "Unknown";
  //         if (levelId) {
  //           acc[levelId] = acc[levelId] || { count: 0, name: levelName };
  //           acc[levelId].count++;
  //         }
  //         return acc;
  //       }, {});
  //       console.log("Level distribution:", levelDistribution);
  //     }
  //   };

  if (loading) {
    return (
      <Container>
        <div className="p-4 bg-gray-800 text-white rounded min-h-screen flex justify-center items-center">
          <p>Loading game data...</p>
        </div>
      </Container>
    );
  }

  if (!quizStarted) {
    if (!mode) {
      // Mode selection screen
      return (
        <Container>
          <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Mode</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setMode("single")}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
              >
                Play Yourself
              </button>
              <button
                onClick={() => setMode("multi")}
                className="bg-green-600 hover:bg-green-700 p-2 rounded font-bold"
              >
                Play with a Friend
              </button>
            </div>
            {/* Debug button - remove in production */}
            {/* <button
              onClick={debugStorage}
              className="mt-4 text-xs bg-gray-600 p-1 rounded"
            >
              Debug Storage
            </button> */}
          </div>
        </Container>
      );
    }

    // Player name input screen with difficulty selection
    return (
      <Container>
        <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold mb-4 text-center">Start Quiz</h2>

          {/* Difficulty Selection */}
          <div className="mb-6 w-full max-w-sm">
            <label className="block text-center mb-2 font-bold">
              Select Difficulty:
            </label>
            <div className="flex flex-col gap-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([level, config]) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(parseInt(level))}
                  className={`p-3 rounded text-left ${
                    difficulty === parseInt(level)
                      ? "bg-blue-600 border-2 border-blue-400"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-bold">
                    Level {level}: {config.name}
                  </div>
                  <div className="text-sm text-gray-300">
                    {config.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Available words count */}
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-300">
              Available words for {DIFFICULTY_LEVELS[difficulty].name}:{" "}
              {words.length}
            </p>
            {words.length < QUIZ_LENGTH && (
              <p className="text-sm text-yellow-400 mt-1">
                Not enough words for a full quiz. Quiz will use{" "}
                {Math.min(words.length, QUIZ_LENGTH)} words.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 mb-4 w-full max-w-sm">
            {mode === "multi" ? (
              <>
                <input
                  type="text"
                  placeholder="Player 1: Name"
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  className="p-2 rounded text-black"
                />
                <input
                  type="text"
                  placeholder="Player 2: Name"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  className="p-2 rounded text-black"
                />
              </>
            ) : (
              <div className="text-center p-4 bg-gray-700 rounded">
                <p>
                  Playing as: <strong>YOU</strong>
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              disabled={
                mode === "multi"
                  ? !player1 || !player2 || words.length === 0
                  : words.length === 0
              }
              onClick={startQuiz}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Quiz
            </button>
            <button
              onClick={() => setMode("")}
              className="bg-red-600 hover:bg-red-700 p-2 rounded font-bold"
            >
              Back
            </button>
          </div>
          {words.length === 0 && (
            <div className="mt-4 text-red-400 text-center">
              <p>No words available for the selected difficulty level.</p>
              <p className="text-sm">Total words loaded: {allWords.length}</p>
            </div>
          )}

          {/* Debug info - remove in production */}
          {/* <button
            onClick={debugStorage}
            className="mt-4 text-xs bg-gray-600 p-1 rounded"
          >
            Debug Storage
          </button> */}
        </div>
      </Container>
    );
  }

  const currentWord = quizWords[currentIndex];

  return (
    <Container>
      <div className="p-2 bg-gray-800 text-white rounded min-h-screen flex flex-col items-center mt-4 mb-12">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm bg-gray-700 px-3 py-1 rounded">
            Difficulty:{" "}
            <span className="font-bold">
              {DIFFICULTY_LEVELS[difficulty].name}
            </span>
          </div>
          <button
            onClick={resetQuiz}
            className="btn btn-sm btn-warning mb-4 mt-4"
          >
            Reset
          </button>
        </div>
        <p className="text-sm italic text-pink-600 mb-2">Guess the meaning</p>
        <h2 className="text-md font-bold mb-0 md:mb-12 lg:mb-12 text-center">
          Word {currentIndex + 1} / {quizWords.length}
        </h2>

        <div className="text-3xl font-bold mb-4 text-orange-600 text-center">
          <button
            onClick={() =>
              pronounceWord(
                `${currentWord?.article?.name ?? ""} ${
                  currentWord?.value ?? ""
                }`.trim()
              )
            }
            className=" text-blue-500 hover:text-blue-700 ml-0 md:ml-2 lg:ml-2 "
          >
            🔊
          </button>
          <span className="text-white mr-2">
            {" "}
            {currentWord?.article?.name || ""}
          </span>
          {currentWord?.value || "No word available"}
        </div>

        <div className=" h-20">
          {showMeaning && (
            <div className=" text-yellow-300 text-center">
              {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
                "No meaning available"}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowMeaning(true)}
          className="btn btn-sm btn-primary rounded "
        >
          Reveal Meaning
        </button>

        <div className="flex justify-center w-10/12 md:w-8/12 lg:w-8/12 gap-8 mt-8 p-4">
          {/* Player 1 */}
          <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24 lg:p-24">
            <div className="font-bold">{player1}</div>
            <div className="text-xl">{scores.player1}</div>
            <div className="flex gap-3">
              <button
                onClick={() => handleScore("player1", -1)}
                disabled={usedScores.player1}
                className={`bg-red-500 px-4 rounded ${
                  usedScores.player1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                -
              </button>
              <button
                onClick={() => handleScore("player1", 1)}
                disabled={usedScores.player1}
                className={`bg-green-500 px-4 rounded ${
                  usedScores.player1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Player 2 (only for multi) */}
          {mode === "multi" && (
            <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24 lg:p-24">
              <div className="font-bold">{player2}</div>
              <div className="text-xl">{scores.player2}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleScore("player2", -1)}
                  disabled={usedScores.player2}
                  className={`bg-red-500 px-4 rounded ${
                    usedScores.player2 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleScore("player2", 1)}
                  disabled={usedScores.player2}
                  className={`bg-green-500 px-4 rounded ${
                    usedScores.player2 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={nextWord}
          className="btn btn-sm btn-info mt-4 md:mt-12 lg:mt-12"
        >
          Next Word
        </button>
      </div>
    </Container>
  );
};

export default Quiz;
