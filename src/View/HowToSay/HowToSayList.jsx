import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {titles.map((titleItem) => (
              <div
                key={titleItem.id}
                className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-7 ${
                  isLight
                    ? "border-slate-200 bg-white hover:border-orange-300"
                    : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                }`}
              >
                <p
                  className={`text-xl font-bold leading-snug ${isLight ? "text-slate-900" : "text-white"}`}
                >
                  {titleItem.title}
                </p>

                <div className="mt-4 flex-1 space-y-2">
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
                        className={`text-base font-medium leading-relaxed ${isLight ? "text-teal-600" : "text-teal-400"}`}
                      >
                        🇩🇪 {sentenceItem.sentence}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))}
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
