import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { getBestGermanVoice } from "../../utils/voiceSettings";

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

const pronounceWord = async (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE";

  try {
    const preferredVoice = await getBestGermanVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  } catch (voiceError) {
    console.warn("Failed to load preferred voice:", voiceError);
  }

  window.speechSynthesis.speak(utterance);
};

const StoryDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const paragraphs = splitIntoParagraphs(story.description || "");
  const vocabulary = Array.isArray(story.vocabulary) ? story.vocabulary : [];

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
        {backLink}

        <div className="mb-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-300">
            {story.level?.level || "General"}
          </span>
          <h1
            className={`mt-3 text-3xl font-bold md:text-4xl ${isLight ? "text-slate-900" : "text-white"}`}
          >
            {story.title}
          </h1>
        </div>

        {story.image && (
          <img
            src={story.image}
            alt={story.title}
            className="mb-8 w-full rounded-2xl object-cover shadow-lg"
            style={{ maxHeight: 420 }}
          />
        )}

        <div
          className={`[font-family:'Roboto',sans-serif] rounded-2xl border p-6 text-lg leading-8 shadow-sm md:p-8 ${
            isLight
              ? "border-slate-200 bg-white text-slate-800"
              : "border-slate-800 bg-slate-900/60 text-slate-200"
          }`}
        >
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} className="mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {vocabulary.length > 0 && (
          <div className="mt-10">
            <h2
              className={`mb-4 text-lg font-bold uppercase tracking-wide ${isLight ? "text-slate-900" : "text-white"}`}
            >
              Vocabulary
            </h2>
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
                    onClick={() => pronounceWord(item.word)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg"
                    title={`Pronounce: ${item.word}`}
                  >
                    🔊
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
