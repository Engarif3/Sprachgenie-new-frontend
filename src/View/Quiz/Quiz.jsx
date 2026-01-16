import Container from "../../utils/Container";
import { useState, useEffect, useReducer } from "react";
import Swal from "sweetalert2";
import { getFromStorage, setToStorage } from "../../utils/storage";
import api from "../../axios";
import { pronounceWord } from "../../utils/wordPronounciation";

const CACHE_KEY = "wordListCache";
const QUIZ_STORAGE_KEY = "quizState";
const QUIZ_LENGTH = 30;
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 mins

const DIFFICULTY_LEVELS = {
  1: { name: "Easy", description: "Level A1 & A2 words (Beginner)" },
  2: {
    name: "Difficult",
    description: "Level B1 & B2 words (Intermediate/Advanced)",
  },
  3: {
    name: "Easy + Difficult",
    description: "All levels mixed together",
  },
};

const loadWords = async () => {
  try {
    const cachedData = await getFromStorage(CACHE_KEY);
    if (
      cachedData &&
      cachedData.words &&
      cachedData.lastUpdated &&
      Date.now() - cachedData.lastUpdated < CACHE_EXPIRY
    ) {
      return cachedData;
    }
  } catch (err) {
    // Cache retrieval failed
  }

  try {
    const response = await api.get("/word/all?all=true");
    const words = response.data.data?.words || [];
    const levels = response.data.data?.levels || [];
    const topics = response.data.data?.topics || [];

    const newCache = { words, levels, topics, lastUpdated: Date.now() };
    try {
      await setToStorage(CACHE_KEY, newCache);
    } catch (err) {
      // Storage failed
    }
    return newCache;
  } catch (error) {
    return { words: [], levels: [], topics: [] };
  }
};

const filterWordsByDifficulty = (words, difficulty) => {
  if (!words.length) return [];
  switch (difficulty) {
    case 1:
      return words.filter(
        (word) => word.level?.id === 1 || word.level?.id === 2
      );
    case 2:
      return words.filter(
        (word) => word.level?.id === 3 || word.level?.id === 4
      );
    case 3:
      return words.filter((word) => [1, 2, 3, 4, 6].includes(word.level?.id));
    default:
      return words;
  }
};

const Quiz = () => {
  const initialState = {
    mode: "",
    difficulty: 1,
    player1: "",
    player2: "",
    words: [],
    allWords: [],
    quizWords: [],
    currentIndex: 0,
    showMeaning: false,
    scores: { player1: 0, player2: 0 },
    quizStarted: false,
    loading: true,
    usedScores: { player1: false, player2: false },
  };

  const quizReducer = (state, action) => {
    switch (action.type) {
      case "SET_MODE":
        return { ...state, mode: action.payload };
      case "SET_DIFFICULTY":
        return { ...state, difficulty: action.payload };
      case "SET_PLAYER1":
        return { ...state, player1: action.payload };
      case "SET_PLAYER2":
        return { ...state, player2: action.payload };
      case "SET_WORDS":
        return { ...state, words: action.payload };
      case "SET_ALL_WORDS":
        return { ...state, allWords: action.payload };
      case "SET_QUIZ_WORDS":
        return { ...state, quizWords: action.payload };
      case "SET_CURRENT_INDEX":
        return { ...state, currentIndex: action.payload };
      case "SET_SHOW_MEANING":
        return { ...state, showMeaning: action.payload };
      case "SET_SCORES":
        return { ...state, scores: action.payload };
      case "SET_QUIZ_STARTED":
        return { ...state, quizStarted: action.payload };
      case "SET_LOADING":
        return { ...state, loading: action.payload };
      case "SET_USED_SCORES":
        return { ...state, usedScores: action.payload };
      case "RESET_QUIZ":
        return initialState;
      case "LOAD_STATE":
        return { ...state, ...action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Destructure for cleaner JSX
  const {
    mode,
    difficulty,
    player1,
    player2,
    words,
    allWords,
    quizWords,
    currentIndex,
    showMeaning,
    scores,
    quizStarted,
    loading,
    usedScores,
  } = state;

  useEffect(() => {
    const init = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await loadWords();
        dispatch({ type: "SET_ALL_WORDS", payload: data.words || [] });
        const initialFiltered = filterWordsByDifficulty(
          data.words || [],
          difficulty
        );
        dispatch({ type: "SET_WORDS", payload: initialFiltered });

        const saved = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
        if (saved) dispatch({ type: "LOAD_STATE", payload: saved });
      } catch (error) {
        console.error(error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false }); // Corrected from setLoading(false)
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (allWords.length > 0) {
      dispatch({
        type: "SET_WORDS",
        payload: filterWordsByDifficulty(allWords, difficulty),
      });
    }
  }, [difficulty, allWords]);

  useEffect(() => {
    if (quizStarted) {
      const save = {
        mode,
        difficulty,
        player1,
        player2,
        quizWords,
        currentIndex,
        scores,
        quizStarted,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(save));
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

  const startQuiz = () => {
    const actualP1 = mode === "single" ? "YOU" : player1;
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(QUIZ_LENGTH, words.length));

    dispatch({ type: "SET_PLAYER1", payload: actualP1 });
    dispatch({ type: "SET_QUIZ_WORDS", payload: selected });
    dispatch({ type: "SET_CURRENT_INDEX", payload: 0 });
    dispatch({ type: "SET_SCORES", payload: { player1: 0, player2: 0 } });
    dispatch({ type: "SET_SHOW_MEANING", payload: false });
    dispatch({ type: "SET_QUIZ_STARTED", payload: true });
  };

  const handleScore = (player, delta) => {
    if (usedScores[player]) return;
    dispatch({
      type: "SET_SCORES",
      payload: { ...scores, [player]: (scores[player] || 0) + delta },
    });
    dispatch({
      type: "SET_USED_SCORES",
      payload: { ...usedScores, [player]: true },
    });
  };

  const nextWord = () => {
    if (currentIndex + 1 < quizWords.length) {
      dispatch({ type: "SET_CURRENT_INDEX", payload: currentIndex + 1 });
      dispatch({ type: "SET_SHOW_MEANING", payload: false });
      dispatch({
        type: "SET_USED_SCORES",
        payload: { player1: false, player2: false },
      });
    } else {
      const winner =
        mode === "single"
          ? `${player1}: ${scores.player1}`
          : scores.player1 === scores.player2
          ? "Tie"
          : scores.player1 > scores.player2
          ? player1
          : player2;
      Swal.fire({
        title: "Finished!",
        icon: "success",
        html: `Winner/Score: <b>${winner}</b>`,
      });
      dispatch({ type: "SET_QUIZ_STARTED", payload: false });
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    }
  };

  const resetQuiz = () => {
    Swal.fire({
      title: "Reset Quiz?",
      text: "All progress will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, reset",
    }).then((res) => {
      if (res.isConfirmed) {
        dispatch({ type: "SET_QUIZ_STARTED", payload: false });
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      }
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="p-4 bg-gray-800 text-white rounded min-h-screen flex justify-center items-center">
          <p>Loading Quiz Data....</p>
        </div>
      </Container>
    );
  }

  if (!quizStarted) {
    if (!mode) {
      return (
        <Container>
          <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="mb-4">
                <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
                  🎮 Test Your Knowledge
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-4">
                Choose Quiz Mode
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Test your German vocabulary knowledge with interactive quizzes
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <button
                onClick={() =>
                  dispatch({ type: "SET_MODE", payload: "single" })
                }
                className="group relative bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-blue-500/50 hover:border-blue-500 p-8 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] min-w-[250px]"
              >
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Play Yourself
                </h3>
                <p className="text-gray-300">
                  Challenge yourself and track your progress
                </p>
              </button>
              <button
                onClick={() => dispatch({ type: "SET_MODE", payload: "multi" })}
                className="group relative bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-green-500/50 hover:border-green-500 p-8 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] min-w-[250px]"
              >
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Play with a Friend
                </h3>
                <p className="text-gray-300">
                  Compete with a friend in vocabulary battle
                </p>
              </button>
            </div>
          </div>
        </Container>
      );
    }

    return (
      <Container>
        <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold mb-4 text-center">Start Quiz</h2>
          <div className="mb-6 w-full max-w-sm">
            <label className="block text-center mb-2 font-bold">
              Select Difficulty:
            </label>
            <div className="flex flex-col gap-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([level, config]) => (
                <button
                  key={level}
                  onClick={() =>
                    dispatch({
                      type: "SET_DIFFICULTY",
                      payload: parseInt(level),
                    })
                  }
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
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-300">
              Available words: {words.length}
            </p>
          </div>
          <div className="flex flex-col gap-2 mb-4 w-full max-w-sm">
            {mode === "multi" ? (
              <>
                <input
                  type="text"
                  placeholder="Player 1"
                  value={player1}
                  onChange={(e) =>
                    dispatch({ type: "SET_PLAYER1", payload: e.target.value })
                  }
                  className="p-2 rounded text-black"
                />
                <input
                  type="text"
                  placeholder="Player 2"
                  value={player2}
                  onChange={(e) =>
                    dispatch({ type: "SET_PLAYER2", payload: e.target.value })
                  }
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
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold disabled:opacity-50"
            >
              Start Quiz
            </button>
            <button
              onClick={() => dispatch({ type: "SET_MODE", payload: "" })}
              className="bg-red-600 hover:bg-red-700 p-2 rounded font-bold"
            >
              Back
            </button>
          </div>
        </div>
      </Container>
    );
  }

  const currentWord = quizWords[currentIndex];

  return (
    <Container>
      <div className="relative p-8 text-white rounded-2xl min-h-screen flex flex-col items-center mt-4 mb-12 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 rounded-2xl"></div>
        <div className="absolute inset-0 backdrop-blur-3xl opacity-30 rounded-2xl"></div>

        <div className="relative z-10 w-full max-w-6xl">
          {/* Header with difficulty and reset */}
          <div className="w-full flex justify-between items-center mb-8">
            <div className="text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 px-4 py-2 rounded-full backdrop-blur-sm">
              Difficulty:{" "}
              <span className="font-bold text-blue-400">
                {DIFFICULTY_LEVELS[difficulty].name}
              </span>
            </div>
            <button
              onClick={resetQuiz}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-500/50"
            >
              Reset Quiz
            </button>
          </div>

          {/* Word counter */}
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-full backdrop-blur-sm">
              <span className="text-gray-300">Question</span>{" "}
              <span className="font-bold text-white text-xl">
                {currentIndex + 1}
              </span>
              <span className="text-gray-400"> of </span>
              <span className="font-bold text-white text-xl">
                {quizWords.length}
              </span>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-center text-pink-400 italic mb-8 text-lg">
            💡 Guess the meaning of the word
          </p>

          {/* Main word display */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border-2 border-purple-500/30 rounded-3xl p-12 mb-8 shadow-2xl hover:border-purple-500/50 transition-all duration-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() =>
                    pronounceWord(
                      `${currentWord?.article?.name ?? ""} ${
                        currentWord?.value ?? ""
                      }`.trim()
                    )
                  }
                  className="text-5xl hover:scale-110 transition-transform duration-300 hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                  title="Pronounce word"
                >
                  🔊
                </button>
                <div className="text-4xl md:text-6xl font-bold">
                  <span className="text-orange-400 mr-3">
                    {currentWord?.article?.name || ""}
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                    {currentWord?.value
                      ? currentWord.value.charAt(0).toUpperCase() +
                        currentWord.value.slice(1)
                      : "No word"}
                  </span>
                </div>
              </div>

              {/* Meaning reveal area */}
              <div className="min-h-[120px] flex items-center justify-center">
                {showMeaning ? (
                  <div className="text-2xl text-yellow-300 font-semibold animate-fade-in bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl px-8 py-4">
                    {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
                      "No meaning"}
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      dispatch({ type: "SET_SHOW_MEANING", payload: true })
                    }
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-blue-500/50"
                  >
                    🔍 Reveal Meaning
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Player score cards */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex-1 max-w-sm bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md border-2 border-blue-500/30 rounded-2xl p-8 shadow-xl hover:border-blue-500/50 transition-all duration-300">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {player1}
                </div>
                <div className="text-5xl font-bold text-white">
                  {scores.player1}
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleScore("player1", -1)}
                  disabled={usedScores.player1}
                  className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-8 py-3 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 shadow-lg ${
                    usedScores.player1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-red-500/50"
                  }`}
                >
                  ❌
                </button>
                <button
                  onClick={() => handleScore("player1", 1)}
                  disabled={usedScores.player1}
                  className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-3 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 shadow-lg ${
                    usedScores.player1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-green-500/50"
                  }`}
                >
                  ✓
                </button>
              </div>
            </div>

            {mode === "multi" && (
              <div className="flex-1 max-w-sm bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-8 shadow-xl hover:border-purple-500/50 transition-all duration-300">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {player2}
                  </div>
                  <div className="text-5xl font-bold text-white">
                    {scores.player2}
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleScore("player2", -1)}
                    disabled={usedScores.player2}
                    className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-8 py-3 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 shadow-lg ${
                      usedScores.player2
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-red-500/50"
                    }`}
                  >
                    ❌
                  </button>
                  <button
                    onClick={() => handleScore("player2", 1)}
                    disabled={usedScores.player2}
                    className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-3 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 shadow-lg ${
                      usedScores.player2
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-green-500/50"
                    }`}
                  >
                    ✓
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Next button */}
          <div className="text-center">
            <button
              onClick={nextWord}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-cyan-500/50"
            >
              Next Word →
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Quiz;
