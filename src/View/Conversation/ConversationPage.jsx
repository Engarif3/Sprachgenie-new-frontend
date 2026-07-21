import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";

// The first speaker encountered in a conversation always renders on the
// left in a neutral bubble; the second (and any further speaker, cycling)
// renders on the right in an accent-colored bubble — the same left/right
// convention every chat app uses, so who's-talking-to-whom reads from
// alignment alone, not just the name label.
const ACCENT_BUBBLES = [
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
];

const AVATAR_COLORS = [
  "bg-gradient-to-br from-slate-500 to-slate-600",
  "bg-gradient-to-br from-sky-500 to-blue-600",
  "bg-gradient-to-br from-fuchsia-500 to-pink-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
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
  const isLight = theme === "light";
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Assigns a stable left/right side per speaker name (not per message
  // index), so the same person always renders on the same side even if
  // they speak twice in a row.
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
                const isRight = speakerIndex % 2 === 1;
                const previousMessage = conversation.text[index - 1];
                const isContinuation =
                  previousMessage?.speaker === message.speaker;
                const accent =
                  ACCENT_BUBBLES[
                    Math.floor(speakerIndex / 2) % ACCENT_BUBBLES.length
                  ];
                const avatarColor =
                  AVATAR_COLORS[speakerIndex % AVATAR_COLORS.length];

                return (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      isContinuation ? "mt-1.5" : "mt-4"
                    } ${isRight ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar — shown once per consecutive run from the
                        same speaker, not on every single line. */}
                    <div className="w-9 shrink-0">
                      {!isContinuation && (
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ${avatarColor}`}
                        >
                          {getInitials(message.speaker)}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex max-w-[75%] flex-col gap-1 sm:max-w-[65%] ${
                        isRight ? "items-end" : "items-start"
                      }`}
                    >
                      {!isContinuation && (
                        <span
                          className={`px-1 text-xs font-semibold ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {message.speaker}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                          isRight
                            ? `rounded-2xl rounded-br-sm bg-gradient-to-br text-white ${accent}`
                            : isLight
                              ? "rounded-2xl rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                              : "rounded-2xl rounded-bl-sm border border-slate-700 bg-slate-800 text-slate-100"
                        }`}
                      >
                        {message.message}
                      </div>
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
