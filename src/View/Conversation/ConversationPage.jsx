import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api, { publicApi } from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";
import { MdOutlineDoubleArrow } from "react-icons/md";
import { SiGoogletranslate } from "react-icons/si";
import { FaSpinner } from "react-icons/fa";

// One visual identity per speaker (avatar + bubble tint + name color),
// cycled by order of first appearance, independent of which side (left or
// right) a speaker lands on — so even two speakers sharing a side are
// never confused for one another.
const SPEAKER_THEMES = [
  {
    avatar: "bg-gradient-to-br from-slate-500 to-slate-600",
    bubbleLight: "border-slate-200 bg-white text-slate-800",
    bubbleDark: "border-slate-700 bg-slate-800 text-slate-100",
    nameLight: "text-slate-500",
    nameDark: "text-slate-400",
    accent: "from-sky-500 to-blue-600",
  },
  {
    avatar: "bg-gradient-to-br from-sky-500 to-blue-600",
    bubbleLight: "border-sky-200 bg-sky-50 text-slate-800",
    bubbleDark: "border-sky-500/20 bg-sky-500/10 text-slate-100",
    nameLight: "text-sky-600",
    nameDark: "text-sky-300",
    accent: "from-sky-500 to-blue-600",
  },
  {
    avatar: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    bubbleLight: "border-pink-200 bg-pink-50 text-slate-800",
    bubbleDark: "border-pink-500/20 bg-pink-500/10 text-slate-100",
    nameLight: "text-pink-600",
    nameDark: "text-pink-300",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    avatar: "bg-gradient-to-br from-emerald-500 to-teal-600",
    bubbleLight: "border-emerald-200 bg-emerald-50 text-slate-800",
    bubbleDark: "border-emerald-500/20 bg-emerald-500/10 text-slate-100",
    nameLight: "text-emerald-600",
    nameDark: "text-emerald-300",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    avatar: "bg-gradient-to-br from-amber-500 to-orange-600",
    bubbleLight: "border-amber-200 bg-amber-50 text-slate-800",
    bubbleDark: "border-amber-500/20 bg-amber-500/10 text-slate-100",
    nameLight: "text-amber-600",
    nameDark: "text-amber-300",
    accent: "from-amber-500 to-orange-600",
  },
  {
    avatar: "bg-gradient-to-br from-violet-500 to-purple-600",
    bubbleLight: "border-violet-200 bg-violet-50 text-slate-800",
    bubbleDark: "border-violet-500/20 bg-violet-500/10 text-slate-100",
    nameLight: "text-violet-600",
    nameDark: "text-violet-300",
    accent: "from-violet-500 to-purple-600",
  },
];

const getInitials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const ConversationPage = () => {
  const { id } = useParams(); // Get conversation ID from the URL
  const { theme } = useTheme();
  const { isLoggedIn } = useAuth();
  const isLight = theme === "light";
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keyed by the original message text, same pattern as the word-list
  // modal's sentence translator — identical text (e.g. a repeated "Ja.")
  // reuses the same translation instead of re-fetching it.
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .get(`/conversation/${id}`)
      .then((response) => {
        if (response.data.data) {
          setConversation(response.data.data);
        } else {
          setError("Conversation not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load conversation data.");
        setLoading(false);
      });
  }, [id]);

  const translateMessage = async (text) => {
    if (translations[text]) return; // avoid re-translation

    setLoadingTranslations((prev) => ({ ...prev, [text]: true }));

    try {
      const response = await publicApi.post("/translate", {
        text,
        source: "de",
        target: "en",
      });
      const data = response.data;

      if (!data.data?.translated) {
        throw new Error("No translation received");
      }

      setTranslations((prev) => ({ ...prev, [text]: data.data.translated }));
    } catch (err) {
      console.error("Translation failed:", err);
      setTranslations((prev) => ({ ...prev, [text]: `❌ ${err.message}` }));
    } finally {
      setLoadingTranslations((prev) => ({ ...prev, [text]: false }));
    }
  };

  const handleTranslateLocked = () => {
    Swal.fire({
      icon: "info",
      title: "Login to enjoy this feature",
      text: "Sign in to use the translation feature",
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  if (loading || !conversation) {
    return (
      <Container>
        <div className="flex min-h-[50vh] items-center justify-center py-8">
          <Loader loading={loading} />
        </div>
      </Container>
    );
  }

  // Assigns a stable index per speaker name (not per message index), so the
  // same person always gets the same side/theme even if they speak twice
  // in a row.
  const speakerOrder = [];
  const getSpeakerIndex = (speaker) => {
    let index = speakerOrder.indexOf(speaker);
    if (index === -1) {
      index = speakerOrder.length;
      speakerOrder.push(speaker);
    }
    return index;
  };

  return (
    <Container>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
              💬 Conversation
            </span>
            <h2 className="mt-4 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              {conversation.topic}
            </h2>
          </div>

          {/* Chat Messages */}
          <div
            className={`rounded-3xl border p-4 shadow-xl md:p-8 ${
              isLight
                ? "border-slate-200 bg-slate-50"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="flex flex-col">
              {conversation.text.map((message, index) => {
                const speakerIndex = getSpeakerIndex(message.speaker);
                const speakerTheme =
                  SPEAKER_THEMES[speakerIndex % SPEAKER_THEMES.length];
                // Strict left/right alternation by message order, not by
                // speaker — every line flips sides, always, regardless of
                // who's talking or how many speakers there are. Since
                // position no longer tracks identity, the per-speaker
                // theme (avatar/bubble/name color) is what tells people
                // apart, and the avatar+name are shown on every line
                // rather than only the first of a same-speaker run.
                const isRight = index % 2 === 1;
                const previousMessage = conversation.text[index - 1];
                const isContinuation =
                  previousMessage?.speaker === message.speaker;
                const translation = translations[message.message];
                const isTranslating = loadingTranslations[message.message];

                return (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      isContinuation ? "mt-1.5" : "mt-4"
                    } ${isRight ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar — shown on every line (not just the first of
                        a same-speaker run), since side alone no longer
                        signals who's talking under strict alternation. */}
                    <div className="w-9 shrink-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ${speakerTheme.avatar}`}
                      >
                        {getInitials(message.speaker)}
                      </div>
                    </div>

                    <div
                      className={`flex max-w-[75%] flex-col gap-1 sm:max-w-[65%] ${
                        isRight ? "items-end" : "items-start"
                      }`}
                    >
                      <span
                        className={`px-1 text-xs font-semibold ${
                          isLight ? speakerTheme.nameLight : speakerTheme.nameDark
                        }`}
                      >
                        {message.speaker}
                      </span>
                      <div
                        className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                          isRight
                            ? `rounded-2xl rounded-br-sm bg-gradient-to-br text-white ${speakerTheme.accent}`
                            : `rounded-2xl rounded-bl-sm border ${
                                isLight
                                  ? speakerTheme.bubbleLight
                                  : speakerTheme.bubbleDark
                              }`
                        }`}
                      >
                        {message.message}
                      </div>

                      {/* Translate — same publicApi /translate (de -> en)
                          pattern used in the word-list modal. */}
                      <button
                        type="button"
                        onClick={() =>
                          isLoggedIn
                            ? translateMessage(message.message)
                            : handleTranslateLocked()
                        }
                        disabled={isTranslating}
                        title={isLoggedIn ? "Translate" : "Sign in to use translation feature"}
                        className="flex items-center gap-1 px-1 text-xs transition-transform hover:scale-110 disabled:cursor-not-allowed"
                      >
                        {isTranslating ? (
                          <FaSpinner size={12} className="animate-spin" />
                        ) : (
                          <SiGoogletranslate
                            size={12}
                            className={
                              isLoggedIn
                                ? "text-sky-500 hover:text-green-500"
                                : isLight
                                  ? "text-slate-400"
                                  : "text-slate-500"
                            }
                          />
                        )}
                      </button>

                      {translation && (
                        <p
                          className={`flex items-center gap-2 px-1 text-xs italic ${
                            isLight ? "text-sky-600" : "text-sky-400"
                          }`}
                        >
                          <MdOutlineDoubleArrow
                            size={14}
                            className="shrink-0 text-pink-600"
                          />
                          <span>{translation}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ConversationPage;
