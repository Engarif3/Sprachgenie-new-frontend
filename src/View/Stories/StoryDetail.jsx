import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaPen } from "react-icons/fa6";
import { IoVolumeHighOutline } from "react-icons/io5";
import { ChevronLeft, Pause, Play, RotateCcw } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../Words/Modals/FavoriteButton";
import {
  getAvailableGermanVoices,
  getBestGermanVoice,
  getBestGermanVoiceSync,
} from "../../utils/voiceSettings";
import { formatDateOnly } from "../../utils/formatDateTime";
import {
  pronounceWord,
  maybeShowChromeVoiceHint,
} from "../../utils/wordPronounciation";

// Chrome (and Chromium derivatives) has a long-standing bug where
// utterance.onboundary never fires for remote/"network" voices — which is
// exactly what getBestGermanVoice() prefers (it ranks "Google" voices
// first, for pronunciation quality). Word-by-word highlighting needs
// boundary events, so narration specifically prefers a local/offline voice
// instead, only falling back to whatever getBestGermanVoice() picks (which
// may be a network voice with no boundary support) if no local voice
// exists at all.
const getBestLocalGermanVoice = async () => {
  const voices = await getAvailableGermanVoices();
  const localVoices = voices.filter((voice) => voice.localService);

  if (localVoices.length === 0) {
    return null;
  }

  const preferredByName = localVoices.find((voice) =>
    ["google", "female", "anna", "hedda", "katja"].some((needle) =>
      voice.name.toLowerCase().includes(needle),
    ),
  );

  return preferredByName || localVoices[0];
};

// Confirmed by capturing real onboundary timestamps from an actual browser:
// Google's network voice (the only "German" option on a machine with no
// local German voice installed — which is the actual, common case, not an
// edge case) fires ZERO onboundary events across an entire narration. Every
// bit of onboundary-driven syncing only ever applies when a local voice is
// available; without one there is no live signal at all, full stop — no
// amount of tuning the event-handling logic changes that.
//
// So the design is a straight fork, decided once per playback, up front:
//   - Local voice available (confirmed by getBestLocalGermanVoice above):
//     trust its onboundary events directly, word for word, no smoothing.
//   - No local voice (the common case): there's nothing to react to, so
//     don't wait around hoping — go straight to a paced timer.
//
// The timer has to account for real speech pausing at sentence ends, not
// just move at a flat per-word rate — confirmed necessary by real captured
// data (Deutschland story, 170 words / 23 sentences, Google Deutsch voice:
// 70.1s total; a flat 412ms/word average, but that average is meaningless
// moment-to-moment since a large chunk of it is pause time concentrated at
// 23 specific points, not spread evenly). INITIAL_MS_PER_WORD and
// SENTENCE_END_PAUSE_MS below are fit to that one real measurement as a
// starting point; every full playback afterwards measures its own real
// elapsed time via onend (the one event that's always reliable, regardless
// of onboundary support) and saves a corrected per-word rate for that voice
// in localStorage, so accuracy improves with use instead of staying pinned
// to that initial estimate forever.
const INITIAL_MS_PER_WORD = 300;
const SENTENCE_END_PAUSE_MS = 700;
const COMMA_PAUSE_MS = 250;
// Reported specifically and repeatedly: a paragraph break gets a visibly
// longer real pause than an ordinary sentence-to-sentence transition inside
// the same paragraph, even though the underlying story text has no actual
// line breaks in it (confirmed via the API) — every sentence end looks
// identical on the page. Since the extra pause is real but isn't explained
// by anything in the text itself, this is additional, separately-tracked
// pause time applied only when advancing into a paragraph's first word, on
// top of the normal sentence-end pause it already gets.
const PARAGRAPH_TRANSITION_EXTRA_PAUSE_MS = 900;
const BOUNDARY_GRACE_MS = 400;
const PACE_CALIBRATION_STORAGE_KEY = "sprachgenie:storyNarrationPaceMsPerWord:v4";

const pauseAfterWord = (wordText) => {
  if (!wordText) return 0;
  const trimmed = wordText.trim();
  if (/[.!?…]["')\]]?$/.test(trimmed)) return SENTENCE_END_PAUSE_MS;
  if (/[,;:]["')\]]?$/.test(trimmed)) return COMMA_PAUSE_MS;
  return 0;
};

// Extra pause earned by the word about to be shown, not the one just shown
// — it's advancing INTO a new paragraph that's slow, not leaving the old one.
const paragraphTransitionBonus = (wordId, paragraphStartIds) =>
  paragraphStartIds.has(wordId) ? PARAGRAPH_TRANSITION_EXTRA_PAUSE_MS : 0;

const totalPauseBudgetMs = (words, paragraphStartIds) =>
  words.reduce(
    (sum, word) =>
      sum + pauseAfterWord(word.text) + paragraphTransitionBonus(word.id, paragraphStartIds),
    0,
  );

const loadCalibratedMsPerWord = (voiceKey) => {
  try {
    const raw = window.localStorage.getItem(PACE_CALIBRATION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const value = data?.[voiceKey];
    return typeof value === "number" && value > 0 ? value : null;
  } catch {
    return null;
  }
};

const saveCalibratedMsPerWord = (voiceKey, msPerWord) => {
  try {
    const raw = window.localStorage.getItem(PACE_CALIBRATION_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[voiceKey] = msPerWord;
    window.localStorage.setItem(
      PACE_CALIBRATION_STORAGE_KEY,
      JSON.stringify(data),
    );
  } catch {
    // Ignore storage errors (private browsing, quota, disabled storage) —
    // narration still works, it just re-estimates pace every time.
  }
};

import "@fontsource/roboto";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";

// Splits story text into paragraphs — reuses paragraph breaks if the text
// already has them, otherwise groups sentences into ~4 roughly-even
// paragraphs so a long single block of AI-generated text doesn't render as
// one giant wall of text. Skips periods after digits so dates like "1. Mai"
// don't get treated as sentence boundaries.
const splitIntoParagraphs = (text) => {
  if (!text) {
    return [];
  }

  if (text.includes("\n\n")) {
    return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  }

  const sentences = [];
  let currentSentence = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSentence += char;

    if ((char === "." || char === "!" || char === "?") && i + 1 < text.length) {
      const prevChar = text[i - 1];
      const nextChar = text[i + 1];
      const charAfterSpace = text[i + 2];
      const isDateFormat = /\d/.test(prevChar);

      if (
        !isDateFormat &&
        nextChar === " " &&
        charAfterSpace &&
        /[A-ZÄÖÜ]/.test(charAfterSpace)
      ) {
        sentences.push(currentSentence.trim());
        currentSentence = "";
        i += 1;
      }
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  if (sentences.length < 4) {
    return text.trim().length > 0 ? [text.trim()] : [];
  }

  const paragraphs = [];
  let currentParagraph = "";
  const sentencesPerParagraph = Math.ceil(sentences.length / 4);

  sentences.forEach((sentence, idx) => {
    currentParagraph += sentence;
    if (
      (idx + 1) % sentencesPerParagraph === 0 ||
      idx === sentences.length - 1
    ) {
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = "";
    } else {
      currentParagraph += " ";
    }
  });

  return paragraphs.filter((p) => p.trim().length > 0);
};

const formatPublishedDate = (dateValue) => {
  if (!dateValue) return null;
  return formatDateOnly(dateValue);
};

const StoryDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const { isSuperAdmin } = useAuth();
  const isLight = theme === "light";
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    favoriteIds,
    loadingIds: loadingFavorites,
    toggleFavorite,
  } = useFavorites("stories", "storyId", "story");

  // Full-story narration. Word-by-word highlighting was tried (via
  // currentWordIdRef below, still used internally to track ticker/onboundary
  // position) but never reliably matched real audio across the range of
  // voices/browsers in use, so the visual highlight was removed — only
  // play/pause/restart state is exposed to the UI now.
  const [narrationState, setNarrationState] = useState("idle"); // idle | playing | paused | finished

  const fullText = (story?.description || "").trim();

  // Rebuilds paragraphs into word tokens, each carrying its own character
  // offset within `fullText` — the exact string handed to
  // SpeechSynthesisUtterance below, so utterance.onboundary's charIndex can
  // be mapped straight back to "which word is this". Offsets are found by
  // scanning forward from a running cursor rather than trusting word index
  // math, since punctuation/whitespace quirks in the source text would
  // otherwise drift the count.
  const { wordParagraphs, allWords, paragraphStartIds } = useMemo(() => {
    const paras = splitIntoParagraphs(fullText);
    let cursor = 0;
    let wordCounter = 0;
    const words = [];
    const startIds = new Set();

    const wp = paras.map((paragraph) => {
      let isFirstWordOfParagraph = true;
      return paragraph
        .split(/(\s+)/)
        .filter((token) => token.length > 0)
        .map((token) => {
          if (/^\s+$/.test(token)) {
            return { type: "space", text: token };
          }

          const foundAt = fullText.indexOf(token, cursor);
          const startIndex = foundAt === -1 ? cursor : foundAt;
          cursor = startIndex + token.length;

          const wordToken = {
            type: "word",
            text: token,
            id: wordCounter++,
            startIndex,
          };
          words.push(wordToken);
          if (isFirstWordOfParagraph) {
            // Excludes the very first paragraph of the whole story — there's
            // no prior paragraph to be "transitioning" away from there.
            if (wordToken.id > 0) startIds.add(wordToken.id);
            isFirstWordOfParagraph = false;
          }
          return wordToken;
        });
    });

    return { wordParagraphs: wp, allWords: words, paragraphStartIds: startIds };
  }, [fullText]);

  // Mirrors currentWordId synchronously — onboundary and the paced ticker
  // both need to read "what word is displayed right now" within the same
  // tick they might change it, and state updates aren't readable until the
  // next render.
  const currentWordIdRef = useRef(null);
  // Set true the moment a real onboundary event arrives for this playback —
  // once true, the paced ticker never starts (or stops immediately if a
  // grace-period race let it start just before this flipped).
  const hasBoundaryEventRef = useRef(false);
  // performance.now() of the most recent onboundary event, so the keep-alive
  // nudge can tell a genuine stall (no events for a long time) apart from
  // normal playback — see startKeepAlive below.
  const lastBoundaryAtRef = useRef(null);
  // Whether the voice resolved for this playback reports localService —
  // decides whether to wait out a grace period for onboundary before paced
  // ticking (local voice, might support it) or skip straight to the ticker
  // (network voice — confirmed, via real captured data, to never fire
  // onboundary at all, so there's nothing worth waiting for).
  const isLocalVoiceRef = useRef(false);
  const tickerTimeoutIdRef = useRef(null);
  const tickerGraceTimeoutIdRef = useRef(null);
  const keepAliveIntervalIdRef = useRef(null);
  // The paced ticker's per-word rate for this playback — the calibrated
  // value for this voice if a prior full playthrough measured one,
  // otherwise INITIAL_MS_PER_WORD. Set once per startNarration() call.
  const msPerWordRef = useRef(INITIAL_MS_PER_WORD);
  // performance.now() when speak() was called, so onend can derive real
  // elapsed duration to calibrate from.
  const narrationStartedAtRef = useRef(null);
  // Total time spent paused during this playthrough, so calibration measures
  // actual speaking time rather than wall-clock-including-pauses.
  const narrationPausedMsRef = useRef(0);
  const pauseStartedAtRef = useRef(null);
  // Which voice this playback is using, keyed for the calibration store —
  // read by onend, set right after voice selection resolves.
  const voiceKeyRef = useRef("default");
  // Bumped on every startNarration() call. Cancelling an in-flight
  // utterance (speechSynthesis.cancel()) fires ITS onend/onerror
  // asynchronously — sometimes after the replacement utterance has already
  // started — so those late callbacks would otherwise stomp the new
  // utterance's state back to idle. Each utterance's callbacks close over
  // the token they were created with and no-op if it's no longer current.
  const narrationTokenRef = useRef(0);

  const stopTicker = () => {
    if (tickerGraceTimeoutIdRef.current) {
      clearTimeout(tickerGraceTimeoutIdRef.current);
      tickerGraceTimeoutIdRef.current = null;
    }
    if (tickerTimeoutIdRef.current) {
      clearTimeout(tickerTimeoutIdRef.current);
      tickerTimeoutIdRef.current = null;
    }
  };

  // Paced advancer used whenever there's no live onboundary signal to
  // follow — moves the highlight forward using the calibrated (or initial)
  // per-word rate, plus a punctuation-aware pause after sentence/clause
  // endings, plus an extra hold if the NEXT word starts a new paragraph, so
  // it doesn't run straight through real speech pauses. Stops itself the
  // instant a real boundary event arrives.
  const runTicker = (token) => {
    if (narrationTokenRef.current !== token) return;
    if (hasBoundaryEventRef.current) return;

    const prevIndex =
      currentWordIdRef.current === null ? -1 : currentWordIdRef.current;
    if (prevIndex + 1 < allWords.length) {
      const nextIndex = prevIndex + 1;
      currentWordIdRef.current = nextIndex;
      const upcomingWord = allWords[nextIndex + 1];
      const delay =
        msPerWordRef.current +
        pauseAfterWord(allWords[nextIndex].text) +
        (upcomingWord
          ? paragraphTransitionBonus(upcomingWord.id, paragraphStartIds)
          : 0);
      tickerTimeoutIdRef.current = setTimeout(() => runTicker(token), delay);
    }
  };

  // For a local voice, waits BOUNDARY_GRACE_MS for a real onboundary event
  // before assuming this particular one doesn't support them and starting
  // the paced ticker. For a confirmed network voice, skips the wait
  // entirely — there is nothing to wait for.
  const armTicker = (token) => {
    stopTicker();
    if (!isLocalVoiceRef.current) {
      runTicker(token);
      return;
    }
    tickerGraceTimeoutIdRef.current = setTimeout(() => {
      if (narrationTokenRef.current !== token) return;
      if (hasBoundaryEventRef.current) return;
      runTicker(token);
    }, BOUNDARY_GRACE_MS);
  };

  const stopKeepAlive = () => {
    if (keepAliveIntervalIdRef.current) {
      clearInterval(keepAliveIntervalIdRef.current);
      keepAliveIntervalIdRef.current = null;
    }
  };

  // Chrome silently desyncs (and eventually stalls) speechSynthesis on long
  // utterances unless it's periodically nudged — pausing and immediately
  // resuming resets its internal watchdog without audibly interrupting
  // playback. But that pause/resume cycle is itself a disruption to the
  // engine's internal clock, and for voices that DO report onboundary, doing
  // it on a blind schedule regardless of need turned out to be exactly what
  // was making the highlight creep ahead of the audio partway through longer
  // stories (each nudge is a small opportunity for the engine's boundary
  // timing to drift). So for those voices, only nudge when boundary events
  // have genuinely gone quiet for a while — a real stall, not routine
  // between-word gaps. Voices with no boundary support at all have no such
  // signal to check, so they keep the original blind schedule (there's no
  // live sync to protect there anyway).
  const BOUNDARY_STALL_THRESHOLD_MS = 10000;
  const BLIND_NUDGE_INTERVAL_MS = 10000;
  const startKeepAlive = (token) => {
    stopKeepAlive();
    let lastNudgeAt = performance.now();
    keepAliveIntervalIdRef.current = setInterval(() => {
      if (narrationTokenRef.current !== token) {
        stopKeepAlive();
        return;
      }
      if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        return;
      }

      const now = performance.now();
      if (hasBoundaryEventRef.current) {
        const idleMs = now - (lastBoundaryAtRef.current ?? now);
        if (idleMs < BOUNDARY_STALL_THRESHOLD_MS) return;
      } else if (now - lastNudgeAt < BLIND_NUDGE_INTERVAL_MS) {
        return;
      }

      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
      lastBoundaryAtRef.current = now;
      lastNudgeAt = now;
    }, 3000);
  };

  // Stop any in-flight narration if the user navigates away from this story.
  useEffect(() => {
    return () => {
      narrationTokenRef.current += 1;
      window.speechSynthesis.cancel();
      stopTicker();
      stopKeepAlive();
    };
  }, [id]);

  // Maps a boundary event's charIndex back to "which word is this" by
  // scanning for the last word whose startIndex is at or before it.
  const wordAtCharIndex = (charIndex) => {
    let matched = null;
    for (const word of allWords) {
      if (word.startIndex <= charIndex) {
        matched = word;
      } else {
        break;
      }
    }
    return matched;
  };

  const startNarration = async () => {
    if (!fullText) return;

    const token = (narrationTokenRef.current += 1);

    window.speechSynthesis.cancel();
    stopTicker();
    stopKeepAlive();
    currentWordIdRef.current = null;
    hasBoundaryEventRef.current = false;
    lastBoundaryAtRef.current = null;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "de-DE";

    let finalVoice = null;
    try {
      // Prefer a local voice — its onboundary events, if it supports them,
      // can be trusted directly. Only fall back to whatever
      // getBestGermanVoice() picks (commonly a network voice, e.g. "Google
      // Deutsch") if no local German voice is installed at all.
      const preferredVoice = await getBestLocalGermanVoice();
      finalVoice = preferredVoice || (await getBestGermanVoice());
      if (finalVoice) {
        utterance.voice = finalVoice;
      }
    } catch (voiceError) {
      console.warn("Failed to load preferred voice:", voiceError);
    }

    // A newer startNarration() call (restart, or a fresh play after this
    // one already finished) may have run while we were awaiting the voice
    // lookup above — don't let a now-stale utterance start speaking.
    if (narrationTokenRef.current !== token) return;

    isLocalVoiceRef.current = !!(finalVoice && finalVoice.localService);
    voiceKeyRef.current = finalVoice
      ? `${finalVoice.name}|${finalVoice.lang}`
      : "default";
    msPerWordRef.current =
      loadCalibratedMsPerWord(voiceKeyRef.current) || INITIAL_MS_PER_WORD;

    // When a local voice reports onboundary, trust it directly — jump the
    // highlight straight to whatever word it just said, no smoothing. When
    // it doesn't (confirmed the norm for network voices), the paced ticker
    // set up below is what's actually driving the highlight the whole time.
    utterance.onboundary = (event) => {
      if (narrationTokenRef.current !== token) return;
      if (typeof event.charIndex !== "number") return;

      hasBoundaryEventRef.current = true;
      lastBoundaryAtRef.current = performance.now();
      stopTicker();

      const matched = wordAtCharIndex(event.charIndex);
      if (!matched) return;

      currentWordIdRef.current = matched.id;
    };
    utterance.onend = () => {
      if (narrationTokenRef.current !== token) return;
      stopTicker();
      stopKeepAlive();

      // onend's real elapsed time is trustworthy regardless of onboundary
      // support — use it to calibrate this voice's per-word pace, kept up
      // to date for if word-by-word highlighting is ever re-enabled.
      if (narrationStartedAtRef.current !== null && allWords.length > 0) {
        const elapsedMs =
          performance.now() -
          narrationStartedAtRef.current -
          narrationPausedMsRef.current;
        const speakingMs =
          elapsedMs - totalPauseBudgetMs(allWords, paragraphStartIds);
        const measuredMsPerWord = speakingMs / allWords.length;
        if (Number.isFinite(measuredMsPerWord) && measuredMsPerWord > 50) {
          saveCalibratedMsPerWord(voiceKeyRef.current, measuredMsPerWord);
        }
      }

      currentWordIdRef.current = null;
      setNarrationState("finished");
    };
    utterance.onerror = () => {
      if (narrationTokenRef.current !== token) return;
      stopTicker();
      stopKeepAlive();
      currentWordIdRef.current = null;
      setNarrationState("idle");
    };

    setNarrationState("playing");
    narrationStartedAtRef.current = performance.now();
    narrationPausedMsRef.current = 0;
    pauseStartedAtRef.current = null;
    window.speechSynthesis.speak(utterance);

    // Checked against the same generic preference pick used everywhere else
    // (not `finalVoice`) — narration deliberately steers toward a local
    // voice for onboundary/highlighting support regardless of quality, so
    // `finalVoice` alone isn't a reliable signal for whether this browser
    // actually has a good German voice available. Called after speak() so
    // it can never delay narration start.
    maybeShowChromeVoiceHint(getBestGermanVoiceSync(), "story");

    startKeepAlive(token);
    armTicker(token);
  };

  const handleNarrationToggle = () => {
    if (narrationState === "playing") {
      window.speechSynthesis.pause();
      stopTicker();
      stopKeepAlive();
      pauseStartedAtRef.current = performance.now();
      setNarrationState("paused");
    } else if (narrationState === "paused") {
      if (pauseStartedAtRef.current !== null) {
        narrationPausedMsRef.current +=
          performance.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }
      window.speechSynthesis.resume();
      // Real boundary events resume naturally with the utterance — the
      // ticker only needs re-arming if nothing has been heard from
      // onboundary at all for this playback yet.
      if (!hasBoundaryEventRef.current) {
        armTicker(narrationTokenRef.current);
      }
      startKeepAlive(narrationTokenRef.current);
      setNarrationState("playing");
    } else {
      void startNarration();
    }
  };

  const restartNarration = () => {
    void startNarration();
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .get(`/stories/${id}`)
      .then((response) => {
        if (!isMounted) return;
        if (response.data?.data) {
          setStory(response.data.data);
        } else {
          setError("Story not found.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Failed to load this story.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const backLink = (
    <Link
      to="/stories"
      className={`mb-6 inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
        isLight
          ? "text-slate-600 hover:text-slate-900"
          : "text-slate-300 hover:text-white"
      }`}
    >
      <ChevronLeft size={16} /> Back to Stories
    </Link>
  );

  if (loading) {
    return (
      <Container>
        <div className="flex min-h-[50vh] items-center justify-center py-8">
          <Loader loading={loading} />
        </div>
      </Container>
    );
  }

  if (error || !story) {
    return (
      <Container>
        <div className="mx-auto max-w-3xl px-4 py-8">
          {backLink}
          <p className={isLight ? "text-rose-600" : "text-rose-300"}>
            {error || "Story not found."}
          </p>
        </div>
      </Container>
    );
  }

  const vocabulary = Array.isArray(story.vocabulary) ? story.vocabulary : [];

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        {backLink}

        <div className="relative mb-8 text-center">
          <div className="absolute right-0 top-0">
            <FavoriteButton
              isFavorite={favoriteIds.includes(story.id)}
              loading={!!loadingFavorites[story.id]}
              onClick={() => toggleFavorite(story.id)}
              className={
                favoriteIds.includes(story.id)
                  ? ""
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          </div>
          <h1
            className={`mt-3 text-2xl font-bold md:text-3xl ${isLight ? "text-slate-900" : "text-white"}`}
          >
            {story.title}
          </h1>
          {story.publishedAt && (
            <p
              className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              Published {formatPublishedDate(story.publishedAt)}
            </p>
          )}

          {isSuperAdmin && (
            <Link
              to={`/dashboard/stories-management?edit=${id}`}
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isLight
                  ? "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-600"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-orange-500/50 hover:text-orange-400"
              }`}
            >
              <FaPen size={13} />
              Edit this story
            </Link>
          )}
        </div>

        <div className=" flex justify-center">
          {story.image && (
            <img
              src={story.image}
              alt={story.title}
              className=" mb-2 w-full md:max-w-3xl  rounded-2xl object-cover shadow-lg"
              style={{ maxHeight: 420 }}
            />
          )}
        </div>

        {story.description?.trim() && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNarrationToggle}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                title={
                  narrationState === "playing"
                    ? "Pause narration"
                    : narrationState === "paused"
                      ? "Resume narration"
                      : "Listen to the story"
                }
              >
                {narrationState === "playing" ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              {narrationState !== "idle" && (
                <button
                  type="button"
                  onClick={restartNarration}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                    isLight
                      ? "border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600"
                      : "border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-orange-400"
                  }`}
                  title="Restart narration"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <p
              className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              {narrationState === "finished"
                ? "Finished"
                : narrationState === "idle"
                  ? "Listen to the story"
                  : narrationState === "paused"
                    ? "Paused"
                    : "Narrating…"}
            </p>
          </div>
        )}

        <div className="flex items-center mb-2 mr-2 ">
          <span className="inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-300 ml-auto">
            {story.level?.level || "General"}
          </span>
        </div>
        <div
          className={`[font-family:'Roboto',sans-serif]  rounded-2xl border p-2 text-lg leading-8 shadow-sm md:p-4 ${
            isLight
              ? "border-slate-200 bg-white text-slate-800"
              : "border-slate-800 bg-slate-900/60 text-slate-200"
          }`}
        >
          {wordParagraphs.map((tokens, pIdx) => (
            <p key={pIdx} className="mb-6 last:mb-0">
              {tokens.map((token, tIdx) =>
                token.type === "space" ? (
                  token.text
                ) : (
                  <span key={tIdx} id={`story-word-${token.id}`}>
                    {token.text}
                  </span>
                ),
              )}
            </p>
          ))}
        </div>

        {(vocabulary.length > 0 || isSuperAdmin) && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                className={`text-lg font-bold uppercase tracking-wide ${isLight ? "text-slate-900" : "text-white"}`}
              >
                Vocabulary
              </h2>
              {isSuperAdmin && (
                <Link
                  to={`/dashboard/stories-management?edit=${id}&section=vocabulary`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-600"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-orange-500/50 hover:text-orange-400"
                  }`}
                >
                  <FaPen size={11} />
                  Edit vocabulary
                </Link>
              )}
            </div>
            {vocabulary.length === 0 && (
              <p
                className={`mb-4 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
              >
                No vocabulary added yet.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {vocabulary.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-xl border p-3 shadow-sm ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-slate-700 bg-slate-800/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => pronounceWord(item.word, "story")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-sky-600 dark:text-sky-400"
                    title={`Pronounce: ${item.word}`}
                    aria-label={`Pronounce: ${item.word}`}
                  >
                    <IoVolumeHighOutline size={18} aria-hidden="true" />
                  </button>
                  <div className="font-bold text-sky-600 dark:text-sky-400">
                    {item.word}
                  </div>
                  <p
                    className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
                  >
                    <span className="text-orange-500"> → </span>
                    {item.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default StoryDetail;
