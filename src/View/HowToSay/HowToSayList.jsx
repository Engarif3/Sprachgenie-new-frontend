import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";

// Smaller than the admin page's 40/page — this is a browsing grid for
// learners, not a management table, so a denser page would just mean more
// scrolling before reaching the pager.
const PAGE_SIZE = 12;

const HowToSayList = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchParams, setSearchParams] = useSearchParams();

  const [titles, setTitles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  // Collapsed by default — only the English title shows until a learner
  // opens it, so a page of 12 titles doesn't dump every sentence at once.
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const requestedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Math.max(requestedPage || 1, 1);
  const appliedSearch = searchParams.get("q") || "";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      try {
        const response = await api.get("/how-to-say-titles/all", {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            search: appliedSearch || undefined,
          },
        });
        setTitles(response.data?.data || []);
        setTotal(response.data?.meta?.total || 0);
      } catch (error) {
        console.error(
          "Error fetching 'How to say it in German' phrases:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, [currentPage, appliedSearch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = {};
    const trimmed = searchInput.trim();
    if (trimmed) params.q = trimmed;
    setSearchParams(params);
  };

  const handleGoToPage = (page) => {
    const params = {};
    if (appliedSearch) params.q = appliedSearch;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
  };

  const toggleExpanded = (titleId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(titleId)) {
        next.delete(titleId);
      } else {
        next.add(titleId);
      }
      return next;
    });
  };

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-6xl p-4 pb-12">
        {/* Header */}
        <div className="mb-10 mt-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
            🗣️ Learn Phrases
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            How to Say It in German
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            Pick an English phrase and see how it's actually said in German.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto mb-10 flex max-w-md gap-2"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search phrases..."
            className={`w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                : "border-slate-700 bg-slate-900 text-white placeholder-slate-500"
            }`}
          />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : titles.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            {appliedSearch
              ? "No phrases match your search."
              : "No phrases have been added yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {titles.map((titleItem) => {
              const isExpanded = expandedIds.has(titleItem.id);

              return (
                <div
                  key={titleItem.id}
                  className={`w-full overflow-hidden rounded-3xl border shadow-sm transition-colors duration-200 ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-orange-300"
                      : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(titleItem.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-left md:px-7 md:py-4"
                  >
                    <span
                      className={`text-xl font-bold leading-snug ${isLight ? "text-slate-900" : "text-white"}`}
                    >
                      {titleItem.title}
                    </span>
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                        isExpanded ? "rotate-45" : ""
                      } ${
                        isLight
                          ? "border-orange-300 text-orange-500"
                          : "border-orange-500/40 text-orange-400"
                      }`}
                    >
                      <Plus size={18} />
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className={`space-y-2.5 border-t pb-6 pl-10 pr-6 pt-4 md:pb-7 md:pl-14 md:pr-7 ${
                        isLight ? "border-slate-100" : "border-slate-800"
                      }`}
                    >
                      {(titleItem.sentences || []).length === 0 ? (
                        <p
                          className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}
                        >
                          No German sentences yet.
                        </p>
                      ) : (
                        titleItem.sentences.map((sentenceItem) => (
                          <p
                            key={sentenceItem.id}
                            className={`flex items-center gap-2.5 text-base font-medium leading-relaxed ${
                              isLight ? "text-slate-700" : "text-slate-200"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
                                isLight
                                  ? "border-teal-700 bg-teal-600 text-white"
                                  : "border-teal-500 bg-teal-600 text-white"
                              }`}
                            >
                              DE
                            </span>
                            {sentenceItem.sentence}
                          </p>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
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

export default HowToSayList;
