import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../../axios";

const TODAY_WORD_CACHE_KEY = "todayWordBalloon";
const TODAY_WORD_BATCH_SIZE = 12;

const getTodayCacheToken = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCachedTodayWordState = () => {
  try {
    const rawValue = localStorage.getItem(TODAY_WORD_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (
      parsedValue?.token !== getTodayCacheToken() ||
      !Array.isArray(parsedValue?.words) ||
      parsedValue.words.length === 0
    ) {
      return null;
    }

    return {
      words: parsedValue.words,
      nextIndex:
        typeof parsedValue.nextIndex === "number" && parsedValue.nextIndex >= 0
          ? parsedValue.nextIndex
          : 0,
    };
  } catch {
    return null;
  }
};

const setCachedTodayWordState = (words, nextIndex) => {
  try {
    localStorage.setItem(
      TODAY_WORD_CACHE_KEY,
      JSON.stringify({
        token: getTodayCacheToken(),
        words,
        nextIndex,
      }),
    );
  } catch {
    // Ignore storage errors and fall back to network-only behavior.
  }
};

const consumeCachedTodayWord = () => {
  const cacheState = getCachedTodayWordState();

  if (!cacheState) {
    return null;
  }

  const { words, nextIndex } = cacheState;
  const safeIndex = nextIndex < words.length ? nextIndex : 0;
  const selectedWord = words[safeIndex] ?? null;

  if (!selectedWord) {
    return null;
  }

  const followingIndex = safeIndex + 1 >= words.length ? 0 : safeIndex + 1;
  setCachedTodayWordState(words, followingIndex);

  return selectedWord;
};

const formatWordLabel = (word) => {
  if (!word?.value) {
    return "";
  }

  return `${word.value.charAt(0).toUpperCase()}${word.value.slice(1)}`;
};

const TodaysWordBalloon = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [phase, setPhase] = useState("loading");
  const revealTimerRef = useRef(null);
  const selectedWordRef = useRef(null);
  const phaseRef = useRef("loading");

  useEffect(() => {
    selectedWordRef.current = selectedWord;
  }, [selectedWord]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const triggerReveal = () => {
    if (
      !selectedWordRef.current ||
      phaseRef.current === "burst" ||
      phaseRef.current === "revealed"
    ) {
      return;
    }

    if (typeof revealTimerRef.current === "number") {
      window.clearTimeout(revealTimerRef.current);
    }

    setPhase("burst");

    revealTimerRef.current = window.setTimeout(() => {
      setPhase("revealed");
    }, 380);
  };

  useEffect(() => {
    let isActive = true;

    const loadWord = async () => {
      const cachedWord = consumeCachedTodayWord();

      if (isActive && cachedWord) {
        setSelectedWord(cachedWord);
        setPhase("floating");
        return;
      }

      try {
        const response = await publicApi.get(
          `/word/balloon?limit=${TODAY_WORD_BATCH_SIZE}`,
        );
        const nextWords = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        const nextWord = nextWords[0] ?? null;

        if (!isActive || !nextWord) {
          return;
        }

        setCachedTodayWordState(nextWords, nextWords.length > 1 ? 1 : 0);
        setSelectedWord(nextWord);
        setPhase("floating");
      } catch {
        if (isActive) {
          setPhase("floating");
        }
      }
    };

    loadWord();

    return () => {
      isActive = false;
      if (typeof revealTimerRef.current === "number") {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, []);

  const wordLabel = useMemo(
    () => formatWordLabel(selectedWord),
    [selectedWord],
  );
  const articleLabel = useMemo(
    () => selectedWord?.article?.name || "",
    [selectedWord],
  );
  const wordMeaning = useMemo(() => {
    if (
      !Array.isArray(selectedWord?.meaning) ||
      selectedWord.meaning.length === 0
    ) {
      return "";
    }

    return selectedWord.meaning[0];
  }, [selectedWord]);

  const isBalloonReady = Boolean(selectedWord) && phase !== "loading";

  const handleBalloonPress = (event) => {
    if (!isBalloonReady) {
      event.preventDefault();
      return;
    }

    triggerReveal();
  };

  const handleBalloonKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleBalloonPress(event);
  };

  return (
    <div className="relative mx-auto mt-10 flex min-h-[26rem] w-full max-w-3xl items-center justify-center overflow-visible px-4">
      <div
        className={`relative flex min-h-[22rem] w-full items-center justify-center transition-all duration-300 ${
          phase === "revealed" ? "scale-100 opacity-100" : ""
        }`}
      >
        {phase !== "revealed" && (
          <button
            type="button"
            className={`hero-balloon ${phase === "burst" ? "hero-balloon-burst" : "hero-balloon-float"} ${isBalloonReady ? "cursor-pointer" : "cursor-wait"}`}
            onPointerDown={handleBalloonPress}
            onKeyDown={handleBalloonKeyDown}
            aria-label="Reveal today's word"
            aria-disabled={!isBalloonReady}
            disabled={phase === "burst"}
          >
            <div className="hero-balloon-glow" />
            <div className="hero-balloon-surface">
              <span className="hero-balloon-shine" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center text-slate-950">
                <span className="mb-3 inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-sky-700 shadow-sm">
                  Surprise Drop
                </span>
                <p className="text-2xl font-black uppercase tracking-[0.18em] text-slate-900 md:text-3xl">
                  Today&apos;s Word
                </p>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-800/90 ">
                  {isBalloonReady ? "Tap to burst" : "Loading surprise..."}
                </p>
              </div>
            </div>
            {/* <div className="hero-balloon-knot " /> */}
            {/* <div className="hero-balloon-string" /> */}
            <div className="hero-balloon-knot absolute left-1/2 top-full translate-x-[14px] -translate-y-0.5" />

            <div className="hero-balloon-string absolute top-full left-1/2 translate-x-[14px] translate-y-[30%] w-[2px] h-96 bg-gray-500" />

            <span className="hero-balloon-spark hero-balloon-spark-a" />
            <span className="hero-balloon-spark hero-balloon-spark-b" />
            <span className="hero-balloon-spark hero-balloon-spark-c" />
            <span className="hero-balloon-spark hero-balloon-spark-d" />
          </button>
        )}

        {phase === "revealed" && selectedWord && (
          <div className="hero-word-reveal animate-today-word-reveal  rounded-[2rem] border border-orange-200/70 bg-white/90 px-8 py-8 text-center shadow-[0_30px_80px_rgba(249,115,22,0.18)] backdrop-blur-xl dark:border-white/30 dark:bg-slate-950/80 dark:shadow-[0_30px_80px_rgba(14,165,233,0.18)] w-full">
            <span className="mb-4 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.26em] text-orange-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 ">
              Today&apos;s Word
            </span>
            <p className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white w-full">
              {articleLabel && (
                <span className="mr-2 text-xl md:text-4xl font-bold text-orange-400 ">
                  {articleLabel}
                </span>
              )}
              <span className="">{wordLabel}</span>
            </p>
            {wordMeaning && (
              <p className="mt-3 text-base font-medium text-slate-600 dark:text-slate-300 md:text-lg">
                {wordMeaning}
              </p>
            )}
            <Link
              to="/words"
              className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-bold text-white transition-transform duration-200 hover:scale-105"
            >
              Explore Vocabulary
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysWordBalloon;
