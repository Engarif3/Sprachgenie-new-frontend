import Container from "../../utils/Container";
import { useState, useEffect, useReducer } from "react";
import Swal from "sweetalert2";
import api from "../../axios";
import { pronounceWord } from "../../utils/wordPronounciation";
import { useAuth } from "../../services/auth.services";
import Button from "../../components/UI/Button";
import {
  IoVolumeHighOutline,
  IoCheckmark,
  IoClose,
  IoHeart,
  IoHeartOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoBulbOutline,
  IoSearchOutline,
} from "react-icons/io5";

const QUIZ_STORAGE_KEY = "quizState";

// Admin-configurable now (see Dashboard > Settings > Difficulty Settings >
// Quiz) — this is only the fallback used before that fetch resolves (or if
// it fails), same pattern as DIFFICULTY_LEVELS_FALLBACK below.
const QUIZ_LENGTH_FALLBACK = 30;

// Admin-configurable now (see Dashboard > Settings > Difficulty Settings) —
// this is only the fallback shown before that fetch resolves (or if it
// fails), so the picker isn't ever fully blank.
const DIFFICULTY_LEVELS_FALLBACK = {
  1: { name: "Easy", description: "Level A1 & A2 words (Beginner)" },
  2: {
    name: "Difficult",
    description: "Level B1 & B2 words (Intermediate/Advanced)",
  },
  3: {
    name: "Mixed",
    description: "All levels mixed together",
  },
};

// Builds "{name}: Level A1, A2 words" style descriptions from the real,
// currently-configured levels, so this never goes stale the moment an
// admin changes which levels a tier draws from.
const buildDifficultyLevels = (tiers, levels) => {
  const levelNameById = new Map(levels.map((lvl) => [lvl.id, lvl.level]));
  const result = {};

  tiers.forEach(({ tier, label, levelIds }) => {
    const names = levelIds
      .map((id) => levelNameById.get(id))
      .filter(Boolean);
    result[tier] = {
      name: label,
      description:
        names.length > 0
          ? `Level ${names.join(names.length <= 2 ? " & " : ", ")} words`
          : DIFFICULTY_LEVELS_FALLBACK[tier]?.description || "",
    };
  });

  return result;
};

const loadQuizWords = async (source, difficulty, quizLength) => {
  const query =
    source === "favorites"
      ? `source=favorites&limit=${quizLength}`
      : `difficulty=${difficulty}&limit=${quizLength}`;
  const response = await api.get(`/word/quiz?${query}`);

  return {
    words: response.data?.data?.words || [],
    availableCount: response.data?.data?.availableCount || 0,
  };
};

const Quiz = () => {
  const initialState = {
    source: "difficulty",
    difficulty: 1,
    availableWordsCount: 0,
    preparedQuizWords: [],
    quizWords: [],
    currentIndex: 0,
    showMeaning: false,
    score: 0,
    quizStarted: false,
    loading: true,
    usedScore: false,
  };

  const quizReducer = (state, action) => {
    switch (action.type) {
      case "SET_DIFFICULTY":
        return { ...state, difficulty: action.payload };
      case "SET_SOURCE":
        return { ...state, source: action.payload };
      case "SET_AVAILABLE_WORDS_COUNT":
        return { ...state, availableWordsCount: action.payload };
      case "SET_PREPARED_QUIZ_WORDS":
        return { ...state, preparedQuizWords: action.payload };
      case "SET_QUIZ_WORDS":
        return { ...state, quizWords: action.payload };
      case "SET_CURRENT_INDEX":
        return { ...state, currentIndex: action.payload };
      case "SET_SHOW_MEANING":
        return { ...state, showMeaning: action.payload };
      case "SET_SCORE":
        return { ...state, score: action.payload };
      case "SET_QUIZ_STARTED":
        return { ...state, quizStarted: action.payload };
      case "SET_LOADING":
        return { ...state, loading: action.payload };
      case "SET_USED_SCORE":
        return { ...state, usedScore: action.payload };
      case "RESET_QUIZ":
        return initialState;
      case "LOAD_STATE":
        return { ...state, ...action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [difficultyLevels, setDifficultyLevels] = useState(
    DIFFICULTY_LEVELS_FALLBACK,
  );
  const [quizLength, setQuizLength] = useState(QUIZ_LENGTH_FALLBACK);

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const loadDifficultyLevels = async () => {
      try {
        const [settingsRes, levelsRes, quizSettingsRes] = await Promise.all([
          api.get("/difficulty-settings/quiz"),
          api.get("/level/all"),
          api.get("/quiz-settings"),
        ]);
        const tiers = settingsRes.data?.data?.tiers || [];
        const levels = levelsRes.data?.data || [];
        if (tiers.length > 0) {
          setDifficultyLevels(buildDifficultyLevels(tiers, levels));
        }
        const questionCount = quizSettingsRes.data?.data?.questionCount;
        if (typeof questionCount === "number") {
          setQuizLength(questionCount);
        }
      } catch (error) {
        console.error("Error loading difficulty settings:", error);
      }
    };

    void loadDifficultyLevels();
  }, []);

  // Destructure for cleaner JSX
  const {
    source,
    difficulty,
    availableWordsCount,
    preparedQuizWords,
    quizWords,
    currentIndex,
    showMeaning,
    score,
    quizStarted,
    loading,
    usedScore,
  } = state;

  useEffect(() => {
    const init = async () => {
      const saved = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));

      if (saved?.quizStarted && Array.isArray(saved.quizWords)) {
        dispatch({ type: "LOAD_STATE", payload: saved });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await loadQuizWords("difficulty", difficulty, quizLength);
        dispatch({ type: "SET_PREPARED_QUIZ_WORDS", payload: data.words });
        dispatch({
          type: "SET_AVAILABLE_WORDS_COUNT",
          payload: data.availableCount,
        });
      } catch (error) {
        console.error(error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    void init();
    // Mount-only by design — the loadForSelection effect below re-fires on
    // mount too (and again once quizLength resolves from its fallback), so
    // it's the one responsible for keeping the prepared word list in sync;
    // this initial call just gets something on screen immediately.
  }, []);

  useEffect(() => {
    if (quizStarted) {
      return;
    }
    if (source === "favorites" && !isLoggedIn) {
      return;
    }

    const loadForSelection = async () => {
      // Clear stale counts so the existing inline loading states (the
      // "Available Words" figure and the disabled Start Quiz button)
      // reflect the new selection — without hiding the whole level
      // picker behind the full-page loader, which looked like a reload.
      dispatch({ type: "SET_PREPARED_QUIZ_WORDS", payload: [] });
      dispatch({ type: "SET_AVAILABLE_WORDS_COUNT", payload: 0 });
      try {
        const data = await loadQuizWords(source, difficulty, quizLength);
        dispatch({ type: "SET_PREPARED_QUIZ_WORDS", payload: data.words });
        dispatch({
          type: "SET_AVAILABLE_WORDS_COUNT",
          payload: data.availableCount,
        });

        if (source === "favorites" && data.availableCount < quizLength) {
          const missing = quizLength - data.availableCount;
          Swal.fire({
            icon: "warning",
            title: "You are not eligible",
            text: `Add ${missing} more favorite word${missing === 1 ? "" : "s"} to play this quiz.`,
            confirmButtonText: "Got it",
          });
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: "SET_PREPARED_QUIZ_WORDS", payload: [] });
        dispatch({ type: "SET_AVAILABLE_WORDS_COUNT", payload: 0 });
      }
    };

    void loadForSelection();
  }, [difficulty, source, isLoggedIn, quizStarted, quizLength]);

  useEffect(() => {
    if (quizStarted) {
      const save = {
        source,
        difficulty,
        quizWords,
        currentIndex,
        score,
        quizStarted,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(save));
    }
  }, [source, difficulty, quizWords, currentIndex, score, quizStarted]);

  const handleSelectDifficulty = (level) => {
    dispatch({ type: "SET_SOURCE", payload: "difficulty" });
    dispatch({ type: "SET_DIFFICULTY", payload: level });
  };

  const handleSelectFavorites = () => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: "info",
        title: "Login to enjoy this feature",
        text: "Sign in to quiz yourself on your favorite words",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#123456",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    dispatch({ type: "SET_SOURCE", payload: "favorites" });
  };

  const missingFavoritesCount = Math.max(quizLength - availableWordsCount, 0);
  const notEligibleForFavorites =
    source === "favorites" && missingFavoritesCount > 0;
  const canStartQuiz = preparedQuizWords.length > 0 && !notEligibleForFavorites;

  const startQuiz = () => {
    const selected = preparedQuizWords.slice(
      0,
      Math.min(quizLength, preparedQuizWords.length),
    );

    dispatch({ type: "SET_QUIZ_WORDS", payload: selected });
    dispatch({ type: "SET_CURRENT_INDEX", payload: 0 });
    dispatch({ type: "SET_SCORE", payload: 0 });
    dispatch({ type: "SET_SHOW_MEANING", payload: false });
    dispatch({ type: "SET_QUIZ_STARTED", payload: true });
  };

  const handleScoreAndNext = (isCorrect) => {
    if (usedScore) return;

    const newScore = isCorrect ? score + 1 : score;
    dispatch({
      type: "SET_SCORE",
      payload: newScore,
    });

    // Move to next word or finish quiz
    if (currentIndex + 1 < quizWords.length) {
      dispatch({ type: "SET_CURRENT_INDEX", payload: currentIndex + 1 });
      dispatch({ type: "SET_SHOW_MEANING", payload: false });
      dispatch({ type: "SET_USED_SCORE", payload: false });
    } else {
      Swal.fire({
        title: "Finished!",
        icon: "success",
        html: `Your Score: <b>${newScore} / ${quizWords.length}</b>`,
        confirmButtonText: "Back to Home",
        allowOutsideClick: false,
        allowEscapeKey: false,
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
        <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <p>Loading Quiz Data....</p>
        </div>
      </Container>
    );
  }

  if (!quizStarted) {
    return (
      <Container>
        <div className="mx-auto w-full max-w-xl px-2 pt-1 pb-6 md:pb-8">
          {/* Main Title */}
          <div className="text-center mb-3 mt-4">
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
                <IoBulbOutline size={16} aria-hidden="true" />
                Test Your Skills
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-2">
              Quiz
            </h1>
            <p className="text-xl max-w-2xl mx-auto text-slate-500 dark:text-slate-400">
              Test your vocabulary and improve your German skills
            </p>
            <div className="flex justify-center mt-3">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-4">
            <h2 className="mb-3 text-center text-lg font-bold text-blue-600 dark:text-blue-400">
              Select Your Level
            </h2>

            <div className="flex flex-col gap-3">
              {Object.entries(difficultyLevels).map(([level, config]) => {
                const isSelected =
                  source === "difficulty" && difficulty === parseInt(level);
                return (
                  <button
                    key={level}
                    onClick={() => handleSelectDifficulty(parseInt(level))}
                    className={`group relative overflow-hidden rounded-2xl border-2 py-3 pl-6 pr-4 transition-all duration-300 ${
                      isSelected
                        ? "scale-105 border-blue-400 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-left">
                        <div className="mb-0.5 flex items-center gap-2 text-lg font-bold md:text-xl">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              level === "1"
                                ? "bg-green-500"
                                : level === "2"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                            aria-hidden="true"
                          />
                          {config.name}
                        </div>
                        <div
                          className={`text-sm md:text-base ${
                            isSelected
                              ? "text-white"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {config.description}
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl">
                        {isSelected ? (
                          <IoCheckmark aria-hidden="true" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Favorites — visible to guests too; clicking without being
                  logged in prompts a login instead of hiding the option. */}
              <button
                onClick={handleSelectFavorites}
                className={`group relative overflow-hidden rounded-2xl border-2 py-3 pl-6 pr-4 transition-all duration-300 ${
                  source === "favorites"
                    ? "scale-105 border-pink-400 bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/50"
                    : "border-slate-200 bg-white text-slate-700 hover:border-pink-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-pink-500 dark:hover:bg-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <div className="mb-0.5 flex items-center gap-2 text-lg font-bold md:text-xl">
                      <IoHeartOutline aria-hidden="true" />
                      My Favorites
                    </div>
                    <div
                      className={`text-sm md:text-base ${
                        source === "favorites"
                          ? "text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {isLoggedIn
                        ? "Revise the words you've favorited"
                        : "Sign in to quiz yourself on your favorites"}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl">
                    {source === "favorites" ? (
                      <IoCheckmark aria-hidden="true" />
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-3 rounded-2xl border-2 border-blue-200 bg-white p-2 shadow-sm transition-all duration-300 hover:border-blue-300 dark:border-blue-500/30 dark:bg-slate-900 dark:shadow-xl dark:hover:border-blue-500/50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                  Quiz Length
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {quizLength}
                </div>
                <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Questions
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                  Available Words
                </div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {availableWordsCount > 0
                    ? availableWordsCount.toLocaleString()
                    : source === "favorites"
                      ? "0"
                      : "Loading..."}
                </div>
                <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {source === "favorites"
                    ? "In Your Favorites"
                    : `For ${difficultyLevels[difficulty]?.name}`}
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              variant="success"
              size="lg"
              disabled={!canStartQuiz}
              onClick={startQuiz}
            >
              Start Quiz
            </Button>

            {!notEligibleForFavorites && preparedQuizWords.length === 0 && (
              <p className="mt-2 flex items-center justify-center gap-1.5 animate-pulse text-xs text-orange-500 dark:text-orange-400">
                <IoWarningOutline size={14} aria-hidden="true" />
                Loading words... Please wait
              </p>
            )}
          </div>

          {/* Info Footer */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
            <IoTimeOutline size={14} aria-hidden="true" />
            No time limit
            <span aria-hidden="true">·</span>
            <IoTrendingUpOutline size={14} aria-hidden="true" />
            Track your progress
          </p>
        </div>
      </Container>
    );
  }

  const currentWord = quizWords[currentIndex];

  return (
    <Container>
      <div className="mx-auto w-full max-w-2xl px-2 py-6 md:py-8">
        {/* Header with difficulty and reset */}
        <div className="mb-4 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {source === "favorites" ? (
              <>
                Source:
                <span className="inline-flex items-center gap-1.5 font-bold text-pink-600 dark:text-pink-400">
                  <IoHeart size={14} aria-hidden="true" />
                  My Favorites
                </span>
              </>
            ) : (
              <>
                Difficulty:
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {difficultyLevels[difficulty]?.name}
                </span>
              </>
            )}
          </p>
          <Button variant="danger" size="sm" onClick={resetQuiz}>
            Reset Quiz
          </Button>
        </div>

        {/* Word counter */}
        <p className="mb-3 text-center text-slate-500 dark:text-slate-400">
          Question{" "}
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {currentIndex + 1}
          </span>{" "}
          of{" "}
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {quizWords.length}
          </span>
        </p>

        {/* Instruction */}
        <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-base italic text-pink-600 dark:text-pink-400">
          <IoBulbOutline size={16} aria-hidden="true" />
          Guess the meaning of the word
        </p>

        {/* Main word display */}
        <div className="mb-4 min-h-[220px] md:min-h-[260px] rounded-3xl border border-purple-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-purple-300 dark:border-purple-500/30 dark:bg-slate-900 dark:shadow-2xl dark:hover:border-purple-500/50 md:p-5">
          <div className="text-center">
            <div className="mb-2 flex min-h-[70px] items-center justify-start gap-2 md:mb-3 md:min-h-[100px] md:gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  pronounceWord(
                    `${currentWord?.article?.name ?? ""} ${
                      currentWord?.value ?? ""
                    }`.trim(),
                  )
                }
                title="Pronounce word"
              >
                <IoVolumeHighOutline size={22} aria-hidden="true" />
              </Button>
              <div className="text-2xl font-bold md:text-4xl">
                <span className="mr-2 italic text-orange-500 dark:text-orange-400 md:mr-3">
                  {currentWord?.article?.name || ""}
                </span>
                <span className="text-slate-900 dark:text-white">
                  {currentWord?.value
                    ? currentWord.value.charAt(0).toUpperCase() +
                      currentWord.value.slice(1)
                    : "No word"}
                </span>
              </div>
            </div>

            {/* Meaning reveal area */}
            <div className="flex min-h-[80px] items-center justify-center">
              {showMeaning ? (
                <div className="animate-fade-in text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
                    "No meaning"}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    dispatch({ type: "SET_SHOW_MEANING", payload: true })
                  }
                >
                  <IoSearchOutline size={18} aria-hidden="true" />
                  Reveal Meaning
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Player score card */}
        <div className="mb-4 flex flex-col justify-center gap-4 md:flex-row md:gap-8">
          <div className="w-full rounded-2xl border border-blue-200 bg-white p-3 shadow-sm transition-all duration-300 hover:border-blue-300 dark:border-blue-500/30 dark:bg-slate-900 dark:shadow-xl dark:hover:border-blue-500/50 md:max-w-sm md:flex-1 md:p-5">
            <div className="mb-2 text-center">
              <div className="mb-1 text-base font-bold text-blue-600 dark:text-blue-400 md:text-xl">
                YOUR SCORE
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                {score}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-8 md:gap-12">
              <Button
                variant="danger"
                size="lg"
                className="!rounded-full !p-4"
                aria-label="Mark as incorrect"
                onClick={() => handleScoreAndNext(false)}
                disabled={usedScore}
              >
                <IoClose size={24} aria-hidden="true" />
              </Button>
              <Button
                variant="success"
                size="lg"
                className="!rounded-full !p-4"
                aria-label="Mark as correct"
                onClick={() => handleScoreAndNext(true)}
                disabled={usedScore}
              >
                <IoCheckmark size={24} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Quiz;
