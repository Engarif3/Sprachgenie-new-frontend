import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Check,
  Clock,
  Flame,
  Leaf,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import Container from "../../utils/Container";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import CountdownRing from "./CountdownRing";

const QUESTION_TIME_SECONDS = 15;

const LEVELS = [
  { key: "easy", label: "Easy", cefr: "A1 · A2" },
  { key: "intermediate", label: "Intermediate", cefr: "A2 · B1" },
  { key: "difficult", label: "Difficult", cefr: "B1 · B2" },
];

// Shared per-level color identity across the level picker and question screen.
const LEVEL_THEME = {
  easy: {
    icon: Leaf,
    gradient: "from-emerald-500 to-teal-500",
    text: "text-emerald-600 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    glow: "from-emerald-400/10 via-teal-400/5 to-transparent",
  },
  intermediate: {
    icon: Flame,
    gradient: "from-amber-500 to-orange-500",
    text: "text-amber-600 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    glow: "from-amber-400/10 via-orange-400/5 to-transparent",
  },
  difficult: {
    icon: Zap,
    gradient: "from-fuchsia-500 to-rose-500",
    text: "text-fuchsia-600 dark:text-fuchsia-300",
    chip: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    glow: "from-fuchsia-400/10 via-rose-400/5 to-transparent",
  },
};

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMsUntilNextLocalMidnight = () => {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(0, nextMidnight.getTime() - now.getTime());
};

const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

// Live "unlocks in Xh Ym" countdown for a completed level's card.
const UnlockCountdown = ({ isLight }) => {
  const [msLeft, setMsLeft] = useState(getMsUntilNextLocalMidnight());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMsLeft(getMsUntilNextLocalMidnight());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <p
      className={`mt-3 text-xs font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}
    >
      🔒 Unlocks in {formatDuration(msLeft)}
    </p>
  );
};

const ChallengeSession = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { isSuperAdmin, isLoggedIn } = useAuth();

  const [view, setView] = useState("levels"); // "levels" | "challenge"
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [levelStatus, setLevelStatus] = useState(null);
  const [streakLoggedToday, setStreakLoggedToday] = useState(false);
  const [resettingLevel, setResettingLevel] = useState(null);

  const [activeLevel, setActiveLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  // Absolute epoch-ms deadline for the current question, derived from the
  // server's own currentQuestionStartedAt/nextQuestionStartedAt — never
  // reset locally, so refreshing mid-question doesn't grant extra time.
  const [deadlineAt, setDeadlineAt] = useState(null);

  const localDate = useMemo(() => getLocalDateKey(), []);

  const refreshLevelStatus = useCallback(async () => {
    // Anonymous visitors can browse the level cards, but there's no
    // progress to fetch for them — skip the (otherwise-401) request.
    if (!isLoggedIn) {
      setLevelStatus(null);
      setLoadingLevels(false);
      return;
    }

    setLoadingLevels(true);

    try {
      const response = await api.get(
        `/challenge/levels?localDate=${localDate}`,
      );
      setLevelStatus(response.data?.data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLevels(false);
    }
  }, [localDate, isLoggedIn]);

  useEffect(() => {
    void refreshLevelStatus();
  }, [refreshLevelStatus]);

  // Shown instead of the login-only actions (Start/Continue, Leaderboard)
  // when browsing without an account — friendlier than the silent
  // redirect-to-/login the route itself used to do.
  const handleLoginRequired = (message) => {
    Swal.fire({
      icon: "info",
      title: "Login to enjoy this feature",
      text: message,
      confirmButtonText: "Go to Login",
      confirmButtonColor: "#123456",
      showCancelButton: true,
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/login";
      }
    });
  };

  const startLevel = async (levelKey) => {
    setLoadingChallenge(true);

    try {
      const response = await api.get(
        `/challenge/levels/${levelKey}/words?localDate=${localDate}`,
      );
      const data = response.data?.data;

      if (!data || data.locked) {
        await refreshLevelStatus();
        return;
      }

      setActiveLevel(levelKey);
      setQuestions(data.questions);
      setCurrentIndex(data.questionsAnswered);
      setCorrectCount(data.correctAnswers);
      setXpEarned(0);
      setAnswerFeedback(null);
      setDeadlineAt(
        data.currentQuestionStartedAt
          ? new Date(data.currentQuestionStartedAt).getTime() +
              QUESTION_TIME_SECONDS * 1000
          : null,
      );
      setView("challenge");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChallenge(false);
    }
  };

  const backToLevels = async () => {
    setView("levels");
    setActiveLevel(null);
    await refreshLevelStatus();
  };

  // Super-admin-only testing escape hatch — the backend also enforces this
  // role check, this is just the UI entry point.
  const resetLevel = async (levelKey) => {
    const confirmation = await Swal.fire({
      title: "Reset this level?",
      text: "This clears today's progress for this level so you can take it again. For testing only.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset",
      confirmButtonColor: "#e11d48",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setResettingLevel(levelKey);

    try {
      await api.post(`/challenge/levels/${levelKey}/reset`, { localDate });
      await refreshLevelStatus();
    } catch (error) {
      console.error(error);
    } finally {
      setResettingLevel(null);
    }
  };

  const finishLevel = useCallback(
    async (finalCorrectCount, finalXpEarned, totalQuestions) => {
      await refreshLevelStatus();

      const signedXp = finalXpEarned >= 0 ? `+${finalXpEarned}` : finalXpEarned;

      Swal.fire({
        title: "Level complete!",
        icon: "success",
        html: `You got <b>${finalCorrectCount} / ${totalQuestions}</b> right — <b>${signedXp} XP</b>`,
        confirmButtonText: "Done",
      }).then(() => {
        setView("levels");
        setActiveLevel(null);
      });
    },
    [refreshLevelStatus],
  );

  const handleAnswer = useCallback(
    async (selectedOption) => {
      const currentWord = questions[currentIndex];

      if (!currentWord || answerFeedback) {
        return;
      }

      try {
        const response = await api.post(
          `/challenge/levels/${activeLevel}/answer`,
          {
            wordId: currentWord.id,
            selectedAnswer: selectedOption,
            localDate,
          },
        );
        const result = response.data?.data;
        const isCorrect = Boolean(result?.correct);
        const xpDelta = result?.xpDelta || 0;

        const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount;
        const nextXpEarned = xpEarned + xpDelta;

        setCorrectCount(nextCorrectCount);
        setXpEarned(nextXpEarned);
        setAnswerFeedback({
          selectedOption,
          correct: isCorrect,
          correctAnswer: result?.correctAnswer,
          // Authoritative from the server — a late-but-selected submission
          // is scored as a timeout even though selectedOption isn't "".
          timedOut: Boolean(result?.timedOut),
          xpDelta,
        });

        if (result?.nextQuestionStartedAt) {
          setDeadlineAt(
            new Date(result.nextQuestionStartedAt).getTime() +
              QUESTION_TIME_SECONDS * 1000,
          );
        }

        if (!streakLoggedToday) {
          await api.post("/challenge/complete-session", { localDate });
          setStreakLoggedToday(true);
        }

        const isLastQuestion =
          result?.completed || currentIndex + 1 >= questions.length;

        setTimeout(() => {
          setAnswerFeedback(null);

          if (!isLastQuestion) {
            setCurrentIndex((index) => index + 1);
          } else {
            void finishLevel(nextCorrectCount, nextXpEarned, questions.length);
          }
        }, 1100);
      } catch (error) {
        console.error(error);
      }
    },
    [
      questions,
      currentIndex,
      answerFeedback,
      activeLevel,
      localDate,
      correctCount,
      xpEarned,
      streakLoggedToday,
      finishLevel,
    ],
  );

  const handleTimeout = useCallback(() => {
    void handleAnswer("");
  }, [handleAnswer]);

  const cardClass = isLight
    ? "border-slate-200 bg-white"
    : "border-slate-800 bg-slate-700";

  if (view === "levels") {
    return (
      <Container>
        <div className="mx-auto flex min-h-[65vh] max-w-5xl flex-col gap-8 py-4">
          <div className="text-center">
            <h1
              className={`flex items-center justify-center gap-2 text-3xl font-bold sm:text-4xl ${isLight ? "text-slate-900" : "text-white"}`}
            >
              {/* <span className="text-4xl">🎯</span> */}
              <span className="bg-gradient-to-r from-emerald-500 via-amber-500 to-fuchsia-500 bg-clip-text text-transparent pb-8">
                Daily Challenge
              </span>
            </h1>
            <p
              className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              20 random words a day, per level. Answer fast — 15 seconds each.
            </p>
          </div>

          <div
            className={`mx-auto w-full max-w-xl rounded-2xl border p-5 ${cardClass}`}
          >
            <h2
              className={`mb-3 flex items-center gap-2 text-sm font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}
            >
              {/* <Sparkles size={16} className="text-amber-500" /> */}
              How scoring works
            </h2>
            <ul
              className={`space-y-1.5 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              <li className="flex items-center gap-2">
                <Check size={13} className="shrink-0 text-emerald-500" />
                Correct within 10s: <b>+10 XP</b>
              </li>
              <li className="flex items-center gap-2">
                <Check size={13} className="shrink-0 text-emerald-500" />
                Correct after 10s: <b>+9 XP</b>
              </li>
              <li className="hidden md:flex items-center gap-2 ">
                <X size={13} className="shrink-0 text-rose-500" />
                Wrong answer: <b>-2 XP</b>, +1 more for each consecutive wrong
                answer in a row (-2, -3, -4…)
              </li>
              <li className="flex md:hidden items-center gap-2 ">
                <X size={13} className="shrink-0 text-rose-500" />
                Wrong answer: <b>-2 XP</b>
              </li>
              <li className="flex md:hidden items-center gap-2 ">
                <X size={13} className="shrink-0 text-rose-500" />
                +1 more for each consecutive wrong answer in a row (-2, -3, -4…)
              </li>
              <li className="flex items-center gap-2">
                <Clock size={13} className="shrink-0 text-rose-500" />
                No answer within 15s: <b>-2 XP</b> flat
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={13} className="shrink-0 text-amber-500" />A
                correct answer or a timeout resets the wrong answer streak
              </li>
            </ul>
          </div>

          {loadingLevels ? (
            <p
              className={`text-center ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              Loading levels…
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {LEVELS.map(({ key, label, cefr }) => {
                const status = levelStatus?.[key];
                const locked = Boolean(status?.locked);
                const answered = status?.questionsAnswered ?? 0;
                const total = status?.totalWords ?? 20;
                const inProgress = !locked && answered > 0;
                const levelTheme = LEVEL_THEME[key];
                const LevelIcon = levelTheme.icon;
                const progressPct =
                  total > 0 ? Math.min(100, (answered / total) * 100) : 0;

                return (
                  <div
                    key={key}
                    className={`group relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl border p-8 text-center shadow-sm transition-all duration-300 ${cardClass} ${
                      locked ? "" : "hover:-translate-y-1 hover:shadow-xl"
                    }`}
                  >
                    {/* <div
                      className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${levelTheme.gradient}`}
                    /> */}

                    <div
                      className={`mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg transition-opacity ${levelTheme.gradient} ${
                        locked ? "opacity-60" : ""
                      }`}
                    >
                      <LevelIcon size={36} />
                    </div>

                    <div
                      className={`mt-5 text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {label}
                    </div>
                    <div
                      className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {cefr}
                    </div>

                    <div className="mt-6">
                      <div
                        className={`h-2.5 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-100" : "bg-slate-800"}`}
                      >
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${levelTheme.gradient}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div
                        className={`mt-2 text-sm font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {answered}/{total} today
                      </div>
                    </div>

                    <div className="mt-auto flex w-full flex-col items-center pt-6">
                      {locked ? (
                        <UnlockCountdown isLight={isLight} />
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            isLoggedIn
                              ? startLevel(key)
                              : handleLoginRequired(
                                  "Sign in to play the Daily Challenge",
                                )
                          }
                          disabled={loadingChallenge}
                          className={`w-full rounded-xl bg-gradient-to-r px-4 py-3.5 text-base font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${levelTheme.gradient}`}
                        >
                          {inProgress ? "Continue" : "Start"}
                        </button>
                      )}

                      {isLoggedIn ? (
                        <Link
                          to={`/challenge/leaderboard?level=${key}`}
                          className={`mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold hover:underline ${levelTheme.text}`}
                        >
                          <Trophy size={12} /> {label} leaderboard
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleLoginRequired(
                              "Sign in to view the leaderboard",
                            )
                          }
                          className={`mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold hover:underline ${levelTheme.text}`}
                        >
                          <Trophy size={12} /> {label} leaderboard
                        </button>
                      )}

                      {isSuperAdmin ? (
                        <button
                          type="button"
                          onClick={() => resetLevel(key)}
                          disabled={resettingLevel === key}
                          className={`mt-2 inline-flex items-center justify-center gap-1 rounded-lg border border-dashed px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isLight
                              ? "border-rose-300 text-rose-500 hover:bg-rose-50"
                              : "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                          }`}
                        >
                          <RotateCcw size={11} />
                          {resettingLevel === key
                            ? "Resetting…"
                            : "Reset (testing)"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    );
  }

  if (loadingChallenge || questions.length === 0) {
    return (
      <Container>
        <div className="flex min-h-[65vh] items-center justify-center">
          <p className={isLight ? "text-slate-600" : "text-slate-300"}>
            Loading…
          </p>
        </div>
      </Container>
    );
  }

  const currentWord = questions[currentIndex];
  const levelMeta = LEVELS.find((level) => level.key === activeLevel);
  const levelTheme = LEVEL_THEME[activeLevel] || LEVEL_THEME.easy;
  const progressPct =
    ((currentIndex + (answerFeedback ? 1 : 0)) / questions.length) * 100;

  return (
    <Container>
      <div className="mx-auto flex min-h-[75vh] max-w-lg flex-col items-center gap-6 py-12">
        <div className="flex w-full items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${levelTheme.chip}`}
          >
            {levelMeta?.label} · {currentIndex + 1}/{questions.length}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-bold text-white shadow-sm ${
              xpEarned < 0
                ? "from-rose-500 to-red-600"
                : "from-amber-400 to-orange-500"
            }`}
          >
            <Sparkles size={12} /> {xpEarned >= 0 ? `+${xpEarned}` : xpEarned}{" "}
            XP
          </span>
          <button
            type="button"
            onClick={backToLevels}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${isLight ? "text-slate-400 hover:bg-slate-100 hover:text-slate-600" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"}`}
            aria-label="Exit challenge"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-100" : "bg-slate-800"}`}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${levelTheme.gradient}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <CountdownRing
          totalSeconds={QUESTION_TIME_SECONDS}
          deadlineAt={deadlineAt}
          onExpire={handleTimeout}
          paused={Boolean(answerFeedback)}
        />

        <div
          className={`relative w-full overflow-hidden rounded-3xl border p-8 text-center shadow-sm ${cardClass}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${levelTheme.glow}`}
          />
          <div className="relative">
            <div
              className={`text-2xl font-bold sm:text-3xl ${isLight ? "text-slate-900" : "text-white"}`}
            >
              {currentWord?.article?.name ? (
                <span className="mr-2 italic text-orange-500">
                  {currentWord.article.name}
                </span>
              ) : null}
              {currentWord?.value}
            </div>
            <p
              className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              What does this mean?
            </p>
            {answerFeedback ? (
              <p
                className={`mt-2 text-sm font-semibold ${
                  answerFeedback.xpDelta > 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {answerFeedback.timedOut
                  ? "⏱ Time's up! "
                  : answerFeedback.correct
                    ? "✓ Correct! "
                    : "✗ Wrong. "}
                {answerFeedback.xpDelta > 0
                  ? `+${answerFeedback.xpDelta}`
                  : answerFeedback.xpDelta}{" "}
                XP
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {(currentWord?.options || []).map((option) => {
            const isSelected = answerFeedback?.selectedOption === option;
            const isCorrectOption =
              answerFeedback &&
              option.toLowerCase() ===
                answerFeedback.correctAnswer?.toLowerCase();
            const isWrongSelection =
              answerFeedback && isSelected && !isCorrectOption;

            let optionClass = isLight
              ? "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:shadow-md"
              : "border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500 hover:shadow-md";

            if (answerFeedback) {
              if (isCorrectOption) {
                optionClass = isLight
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300"
                  : "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40";
              } else if (isSelected) {
                optionClass = isLight
                  ? "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-300"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/40";
              } else {
                optionClass = isLight
                  ? "border-slate-200 bg-slate-50 text-slate-400"
                  : "border-slate-800 bg-slate-900 text-slate-500";
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={!!answerFeedback}
                onClick={() => handleAnswer(option)}
                className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all disabled:cursor-not-allowed ${optionClass}`}
              >
                <span>{option}</span>
                {isCorrectOption ? (
                  <Check size={16} className="shrink-0 text-emerald-500" />
                ) : null}
                {isWrongSelection ? (
                  <X size={16} className="shrink-0 text-rose-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </Container>
  );
};

export default ChallengeSession;
