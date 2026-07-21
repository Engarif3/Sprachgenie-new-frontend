import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";

// Color identity per CEFR level, consistent with the badge/chip style used
// elsewhere in the app (Leaderboard, ChallengeSession, ConversationTitleList).
const LEVEL_BADGES = {
  A1: "bg-black text-sky-400",
  A2: "bg-black text-teal-400",
  B1: "bg-black text-orange-400",
  B2: "bg-black text-pink-500",
  C1: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  C2: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const DEFAULT_BADGE =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STORIES_PER_PAGE = 9;

const formatPublishedDate = (dateValue) => {
  if (!dateValue) return null;
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const StoryTitleList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/stories/all");
      setStories(response.data?.data || []);
    } catch (requestError) {
      console.error("Failed to load stories:", requestError);
      setError("Unable to load stories right now.");
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Only the levels that actually have at least one story get a tab, in
  // standard CEFR order (any unexpected level string is appended, sorted).
  const availableLevels = useMemo(() => {
    const present = new Set(
      stories.map((story) => story.level?.level).filter(Boolean),
    );
    const known = CEFR_ORDER.filter((level) => present.has(level));
    const unknown = [...present]
      .filter((level) => !CEFR_ORDER.includes(level))
      .sort();
    return [...known, ...unknown];
  }, [stories]);

  const requestedLevel = searchParams.get("level") || "";
  const activeLevel = availableLevels.includes(requestedLevel)
    ? requestedLevel
    : "";

  const filteredStories = activeLevel
    ? stories.filter((story) => story.level?.level === activeLevel)
    : stories;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStories.length / STORIES_PER_PAGE),
  );
  const requestedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Math.min(Math.max(requestedPage || 1, 1), totalPages);
  const paginatedStories = filteredStories.slice(
    (currentPage - 1) * STORIES_PER_PAGE,
    currentPage * STORIES_PER_PAGE,
  );

  const handleSelectLevel = (level) => {
    setSearchParams(level ? { level } : {});
  };

  const handleGoToPage = (page) => {
    const params = {};
    if (activeLevel) params.level = activeLevel;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
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
            📗 Read & Learn
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            German Stories
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Choose a level, then pick a story to read.
          </p>
        </div>

        {/* Level tabs */}
        {!loading && stories.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectLevel("")}
              className={tabClass(!activeLevel)}
            >
              All ({stories.length})
            </button>
            {availableLevels.map((level) => {
              const count = stories.filter(
                (story) => story.level?.level === level,
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
          <div className="flex min-h-[18rem] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : error ? (
          <div
            className={`text-center ${isLight ? "text-rose-600" : "text-rose-300"}`}
          >
            {error}
          </div>
        ) : stories.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No stories yet.
          </p>
        ) : filteredStories.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No stories yet for {activeLevel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedStories.map((story) => {
              const level = story.level?.level;
              const badgeClass = LEVEL_BADGES[level] || DEFAULT_BADGE;

              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  <div
                    className={`relative h-48 w-full overflow-hidden ${
                      isLight ? "bg-slate-100" : "bg-slate-800"
                    }`}
                  >
                    {story.image ? (
                      <img
                        src={story.image}
                        alt={story.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`flex h-full items-center justify-center ${
                          isLight ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        <BookOpen size={36} />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide  ${badgeClass}`}
                    >
                      {level || "General"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4 ">
                    <h3
                      className={`mb-1  text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {story.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between text-sm font-semibold text-orange-500 dark:text-orange-400">
                      <span className="flex items-center gap-1">
                        Read this story
                        <ChevronRight size={16} />
                      </span>

                      {story.publishedAt && (
                        <p
                          className={`text-xs font-normal ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {formatPublishedDate(story.publishedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleGoToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span
              className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handleGoToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </Container>
  );
};

export default StoryTitleList;
