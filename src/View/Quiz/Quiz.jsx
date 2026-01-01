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
          <p>Loading Quiz Data...</p>
        </div>
      </Container>
    );
  }

  if (!quizStarted) {
    if (!mode) {
      return (
        <Container>
          <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Mode</h2>
            <div className="flex gap-4">
              <button
                onClick={() =>
                  dispatch({ type: "SET_MODE", payload: "single" })
                }
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
              >
                Play Yourself
              </button>
              <button
                onClick={() => dispatch({ type: "SET_MODE", payload: "multi" })}
                className="bg-green-600 hover:bg-green-700 p-2 rounded font-bold"
              >
                Play with a Friend
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
      <div className="p-2 bg-gray-800 text-white rounded min-h-screen flex flex-col items-center mt-4 mb-12">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm bg-gray-700 px-2 py-1 rounded">
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
        <h2 className="text-md font-bold mb-0 md:mb-12 text-center">
          Word {currentIndex + 1} / {quizWords.length}
        </h2>
        <div className="text-xl md:text-3xl font-bold mb-4 text-orange-600 text-center">
          <button
            onClick={() =>
              pronounceWord(
                `${currentWord?.article?.name ?? ""} ${
                  currentWord?.value ?? ""
                }`.trim()
              )
            }
            className="text-blue-500 hover:text-blue-700 mr-2"
          >
            🔊
          </button>
          <span className="text-white mr-2">
            {currentWord?.article?.name || ""}
          </span>
          {currentWord?.value || "No word"}
        </div>
        <div className="h-40">
          {showMeaning && (
            <div className="text-yellow-300 text-center">
              {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
                "No meaning"}
            </div>
          )}
        </div>
        <button
          onClick={() => dispatch({ type: "SET_SHOW_MEANING", payload: true })}
          className="btn btn-sm btn-primary rounded"
        >
          Reveal Meaning
        </button>
        <div className="flex justify-center w-10/12 md:w-8/12 gap-8 mt-6 p-4">
          <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24">
            <div className="font-bold">{player1}</div>
            <div className="text-xl">{scores.player1}</div>
            <div className="flex gap-3">
              <button
                onClick={() => handleScore("player1", -1)}
                disabled={usedScores.player1}
                className={`bg-red-500 px-4 rounded ${
                  usedScores.player1 ? "opacity-50" : ""
                }`}
              >
                -
              </button>
              <button
                onClick={() => handleScore("player1", 1)}
                disabled={usedScores.player1}
                className={`bg-green-500 px-4 rounded ${
                  usedScores.player1 ? "opacity-50" : ""
                }`}
              >
                +
              </button>
            </div>
          </div>
          {mode === "multi" && (
            <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24">
              <div className="font-bold">{player2}</div>
              <div className="text-xl">{scores.player2}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleScore("player2", -1)}
                  disabled={usedScores.player2}
                  className={`bg-red-500 px-4 rounded ${
                    usedScores.player2 ? "opacity-50" : ""
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleScore("player2", 1)}
                  disabled={usedScores.player2}
                  className={`bg-green-500 px-4 rounded ${
                    usedScores.player2 ? "opacity-50" : ""
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
          className="btn btn-sm btn-info mt-4 md:mt-12"
        >
          Next Word
        </button>
      </div>
    </Container>
  );
};

export default Quiz;
