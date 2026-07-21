import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, ChevronRight } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { splitConversationTopic } from "../../utils/splitConversationTopic";

// Color identity per CEFR level, consistent with the badge/chip style used
// elsewhere in the app (Leaderboard, ChallengeSession) — anything outside
// this known set (shouldn't normally happen) falls back to a neutral chip.
const LEVEL_BADGES = {
  A1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  B1: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  B2: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  C1: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  C2: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const ConversationTitleList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conversation/all");
      setConversations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Only the levels that actually have at least one topic get a tab, in
  // standard CEFR order (any unexpected level string is appended, sorted).
  const availableLevels = useMemo(() => {
    const present = new Set(
      conversations.map((c) => c.levels?.level).filter(Boolean),
    );
    const known = CEFR_ORDER.filter((level) => present.has(level));
    const unknown = [...present]
      .filter((level) => !CEFR_ORDER.includes(level))
      .sort();
    return [...known, ...unknown];
  }, [conversations]);

  const requestedLevel = searchParams.get("level") || "";
  const activeLevel = availableLevels.includes(requestedLevel)
    ? requestedLevel
    : "";

  const filteredConversations = activeLevel
    ? conversations.filter((c) => c.levels?.level === activeLevel)
    : conversations;

  const handleSelectLevel = (level) => {
    setSearchParams(level ? { level } : {});
  };

  const tabClass = (isActive) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
        : isLight
          ? "border border-slate-200 bg-white text-slate-600 hover:border-orange-300"
          : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
    }`;

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-6xl p-4 pb-12">
        {/* Header */}
        <div className="mb-10 mt-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
            💬 Practice German
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Conversation Topics
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Choose a level, then pick a topic to practice a real-world German
            dialogue.
          </p>
        </div>

        {/* Level tabs */}
        {!loading && conversations.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectLevel("")}
              className={tabClass(!activeLevel)}
            >
              All ({conversations.length})
            </button>
            {availableLevels.map((level) => {
              const count = conversations.filter(
                (c) => c.levels?.level === level,
              ).length;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleSelectLevel(level)}
                  className={tabClass(activeLevel === level)}
                >
                  {level} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : conversations.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No conversation topics yet.
          </p>
        ) : filteredConversations.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No topics yet for {activeLevel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredConversations.map((conversation) => {
              const level = conversation.levels?.level;
              const badgeClass = LEVEL_BADGES[level] || DEFAULT_BADGE;
              const { english, german } = splitConversationTopic(
                conversation.topic,
              );

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => navigate(`/conversation/${conversation.id}`)}
                  className={`group flex flex-col items-start rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${badgeClass}`}
                    >
                      {level || "General"}
                    </span>
                    <MessageCircle
                      size={18}
                      className={isLight ? "text-slate-300" : "text-slate-600"}
                    />
                  </div>
                  <div className="mb-4">
                    <p
                      className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {english}
                    </p>
                    {german && (
                      <p
                        className={`mt-1 text-sm font-medium italic ${isLight ? "text-teal-600" : "text-teal-400"}`}
                      >
                        {german}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-orange-500 transition-transform group-hover:gap-2 dark:text-orange-400">
                    <span>Practice this dialogue</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ConversationTitleList;
