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
      Date.now() - cachedData.lastUpdated < CACHE_EXPIRY
    ) {
      return cachedData;
    }

    // Fetch from API if cache empty or expired
    const response = await api.get("/word/all?all=true");

    const words = response.data.data?.words || [];
    const levels = response.data.data?.levels || [];
    const topics = response.data.data?.topics || [];

    const newCache = {
      words,
      levels,
      topics,
      lastUpdated: Date.now(),
    };

    await setToStorage(CACHE_KEY, newCache);
    return newCache;
  } catch (error) {
    return { words: [], levels: [], topics: [] };
  }
};

// Updated filter function with 3 difficulty levels
// From WordList: A1>level id:1, A2>id:2, B1>id:3, B2>id:4, C1>id:6
const filterWordsByDifficulty = (words, difficulty) => {
  if (!words.length) return [];

  switch (difficulty) {
    case 1: // Easy - A1 (id:1) and A2 (id:2)
      return words.filter(
        (word) => word.level?.id === 1 || word.level?.id === 2
      );
    case 2: // Difficult - B1 (id:3) and B2 (id:4)
      return words.filter(
        (word) => word.level?.id === 3 || word.level?.id === 4
      );
    case 3: // Easy + Difficult - All levels (A1, A2, B1, B2, C1)
      return words.filter(
        (word) =>
          word.level?.id === 1 ||
          word.level?.id === 2 ||
          word.level?.id === 3 ||
          word.level?.id === 4 ||
          word.level?.id === 6
      );
    default:
      return words;
  }
};

const Quiz = () => {
  // Initial state for all quiz-related variables
  const initialState = {
    mode: "", // "single" or "multi"
    difficulty: 1, // Default to easy
    player1: "",
    player2: "",
    words: [],
    allWords: [], // Store all words for filtering
    quizWords: [],
    currentIndex: 0,
    showMeaning: false,
    scores: { player1: 0, player2: 0 },
    quizStarted: false,
    loading: true,
    usedScores: { player1: false, player2: false },
  };

  // Reducer function
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

  useEffect(() => {
    const init = async () => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        // Load words (from cache or API)
        const cachedData = await loadWords();

        dispatch({ type: "SET_ALL_WORDS", payload: cachedData.words || [] });

        // Apply initial difficulty filter
        const initialWords = filterWordsByDifficulty(
          cachedData.words || [],
          state.difficulty
        );
        dispatch({ type: "SET_WORDS", payload: initialWords });

        // Load previous quiz state if exists
        const savedState = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
        if (savedState) {
          dispatch({ type: "LOAD_STATE", payload: savedState });
        }
      } catch (error) {
        dispatch({ type: "SET_ALL_WORDS", payload: [] });
        dispatch({ type: "SET_WORDS", payload: [] });
      }

      setLoading(false);
    };

    init();
  }, []);

  // Update words when difficulty changes
  useEffect(() => {
    if (state.allWords.length > 0) {
      const filteredWords = filterWordsByDifficulty(
        state.allWords,
        state.difficulty
      );
      dispatch({ type: "SET_WORDS", payload: filteredWords });
    }
  }, [state.difficulty, state.allWords]);

  // Save quiz state
  useEffect(() => {
    if (state.quizStarted) {
      const stateToSave = {
        mode: state.mode,
        difficulty: state.difficulty,
        player1: state.player1,
        player2: state.player2,
        quizWords: state.quizWords,
        currentIndex: state.currentIndex,
        scores: state.scores,
        quizStarted: state.quizStarted,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [
    state.mode,
    state.difficulty,
    state.player1,
    state.player2,
    state.quizWords,
    state.currentIndex,
    state.scores,
    state.quizStarted,
  ]);

  // Start quiz
  const startQuiz = () => {
    // Set default player name for single player
    const actualPlayer1 = state.mode === "single" ? "YOU" : state.player1;

    const shuffled = [...state.words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(
      0,
      Math.min(QUIZ_LENGTH, state.words.length)
    );

    dispatch({ type: "SET_PLAYER1", payload: actualPlayer1 });
    dispatch({ type: "SET_QUIZ_WORDS", payload: selectedWords });
    dispatch({ type: "SET_CURRENT_INDEX", payload: 0 });
    dispatch({ type: "SET_SCORES", payload: { player1: 0, player2: 0 } });
    dispatch({ type: "SET_SHOW_MEANING", payload: false });
    dispatch({ type: "SET_QUIZ_STARTED", payload: true });

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
    if (state.usedScores[player]) return;

    const newScores = {
      ...state.scores,
      [player]: (state.scores[player] || 0) + delta,
    };
    dispatch({ type: "SET_SCORES", payload: newScores });
    dispatch({
      type: "SET_USED_SCORES",
      payload: { ...state.usedScores, [player]: true },
    });
  };

  const nextWord = () => {
    if (state.currentIndex + 1 < state.quizWords.length) {
      dispatch({ type: "SET_CURRENT_INDEX", payload: state.currentIndex + 1 });
      dispatch({ type: "SET_SHOW_MEANING", payload: false });
      dispatch({
        type: "SET_USED_SCORES",
        payload: { player1: false, player2: false },
      });
    } else {
      const finalScores = { ...state.scores };
      const winner =
        state.mode === "single"
          ? `${state.player1}'s Score: ${finalScores.player1}`
          : finalScores.player1 === finalScores.player2
          ? "It's a tie!"
          : finalScores.player1 > finalScores.player2
          ? state.player1
          : state.player2;

      Swal.fire({
        title: "Quiz Finished!",
        html:
          state.mode === "single"
            ? `<p>${state.player1}: ${finalScores.player1}</p><p>Difficulty: ${
                DIFFICULTY_LEVELS[state.difficulty].name
              }</p>`
            : `<p>${state.player1}: ${finalScores.player1}</p><p>${
                state.player2
              }: ${finalScores.player2}</p><p>Difficulty: ${
                DIFFICULTY_LEVELS[state.difficulty].name
              }</p><p>Winner: <strong>${winner}</strong></p>`,
        icon: "success",
      });

      const history = JSON.parse(localStorage.getItem("quizScores") || "[]");
      history.push({
        mode: state.mode,
        difficulty: DIFFICULTY_LEVELS[state.difficulty].name,
        player1: { name: state.player1, score: finalScores.player1 },
        ...(state.mode === "multi" && {
          player2: { name: state.player2, score: finalScores.player2 },
        }),
        date: new Date().toISOString(),
      });
      localStorage.setItem("quizScores", JSON.stringify(history));

      // Reset quiz
      dispatch({
        type: "SET_USED_SCORES",
        payload: { player1: false, player2: false },
      });
      dispatch({ type: "SET_QUIZ_STARTED", payload: false });
      dispatch({ type: "SET_QUIZ_WORDS", payload: [] });
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
        dispatch({ type: "SET_QUIZ_WORDS", payload: [] });
        dispatch({ type: "SET_CURRENT_INDEX", payload: 0 });
        dispatch({
          type: "SET_SCORES",
          payload: { player1: 0, player2: 0 },
        });
        dispatch({ type: "SET_SHOW_MEANING", payload: false });
        dispatch({ type: "SET_QUIZ_STARTED", payload: false });
        dispatch({
          type: "SET_USED_SCORES",
          payload: { player1: false, player2: false },
        });
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      }
    });
  };

  if (state.loading) {
    return (
      <Container>
        <div className="p-4 bg-gray-800 text-white rounded min-h-screen flex justify-center items-center">
          <p>Loading Quiz Data...</p>
        </div>
      </Container>
    );
  }

  if (!state.quizStarted) {
    if (!state.mode) {
      // Mode selection screen
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
                  onClick={() =>
                    dispatch({
                      type: "SET_DIFFICULTY",
                      payload: parseInt(level),
                    })
                  }
                  className={`p-3 rounded text-left ${
                    state.difficulty === parseInt(level)
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
              Available words for {DIFFICULTY_LEVELS[state.difficulty].name}:{" "}
              {state.words.length}
            </p>
            {state.words.length < QUIZ_LENGTH && (
              <p className="text-sm text-yellow-400 mt-1">
                Not enough words for a full quiz. Quiz will use{" "}
                {Math.min(state.words.length, QUIZ_LENGTH)} words.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 mb-4 w-full max-w-sm">
            {state.mode === "multi" ? (
              <>
                <input
                  type="text"
                  placeholder="Player 1: Name"
                  value={state.player1}
                  onChange={(e) =>
                    dispatch({ type: "SET_PLAYER1", payload: e.target.value })
                  }
                  className="p-2 rounded text-black"
                />
                <input
                  type="text"
                  placeholder="Player 2: Name"
                  value={state.player2}
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
                state.mode === "multi"
                  ? !state.player1 || !state.player2 || state.words.length === 0
                  : state.words.length === 0
              }
              onClick={startQuiz}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
          {state.words.length === 0 && (
            <div className="mt-4 text-red-400 text-center">
              <p>No words available for the selected difficulty level.</p>
              <p className="text-sm">
                Total words loaded: {state.allWords.length}
              </p>
            </div>
          )}
        </div>
      </Container>
    );
  }

  const currentWord = state.quizWords[state.currentIndex];

  return (
    <Container>
      <div className="p-2 bg-gray-800 text-white rounded min-h-screen flex flex-col items-center mt-4 mb-12">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm bg-gray-700 px-2 py-1 rounded">
            Difficulty:{" "}
            <span className="font-bold">
              {DIFFICULTY_LEVELS[state.difficulty].name}
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
          Word {state.currentIndex + 1} / {state.quizWords.length}
        </h2>

        <div className="text-xl md:text-3xl lg:text-3xl font-bold mb-4 text-orange-600 text-center">
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

        <div className=" h-40">
          {state.showMeaning && (
            <div className=" text-yellow-300 text-center">
              {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
                "No meaning available"}
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch({ type: "SET_SHOW_MEANING", payload: true })}
          className="btn btn-sm btn-primary rounded "
        >
          Reveal Meaning
        </button>

        <div className="flex justify-center w-10/12 md:w-8/12 lg:w-8/12 gap-8 mt-6 p-4">
          {/* Player 1 */}
          <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24 lg:p-24">
            <div className="font-bold">{state.player1}</div>
            <div className="text-xl">{state.scores.player1}</div>
            <div className="flex gap-3">
              <button
                onClick={() => handleScore("player1", -1)}
                disabled={state.usedScores.player1}
                className={`bg-red-500 px-4 rounded ${
                  state.usedScores.player1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                -
              </button>
              <button
                onClick={() => handleScore("player1", 1)}
                disabled={state.usedScores.player1}
                className={`bg-green-500 px-4 rounded ${
                  state.usedScores.player1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Player 2 (only for multi) */}
          {state.mode === "multi" && (
            <div className="flex flex-col items-center gap-2 border rounded-md p-8 md:p-24 lg:p-24">
              <div className="font-bold">{state.player2}</div>
              <div className="text-xl">{state.scores.player2}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleScore("player2", -1)}
                  disabled={state.usedScores.player2}
                  className={`bg-red-500 px-4 rounded ${
                    state.usedScores.player2
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleScore("player2", 1)}
                  disabled={state.usedScores.player2}
                  className={`bg-green-500 px-4 rounded ${
                    state.usedScores.player2
                      ? "opacity-50 cursor-not-allowed"
                      : ""
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
