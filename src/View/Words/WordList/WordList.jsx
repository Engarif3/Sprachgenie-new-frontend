import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../../utils/Container";
import Pagination from "../../../utils/Pagination";
import { useAuth } from "../../../services/auth.services";
import api from "../../../axios";
import Loader from "../../../utils/Loader";
import {
  getFromStorage,
  removeFromStorage,
  setToStorage,
  invalidateWordsCache,
  WORD_LIST_PAGE_CACHE_KEY,
} from "../../../utils/storage";
import aiApi from "../../../AI_axios";
import { IoSearch } from "react-icons/io5";
import useDebounce from "../../../hooks/useDebounce";
import WordTableRow from "./WordTableRow";
import { IoInformationCircleOutline } from "react-icons/io5";
import PartOfSpeechDropdown from "./PartOfSpeechDropdown";
import SimpleFilterDropdown from "./SimpleFilterDropdown";

// Lazy load modals for better performance
const WordListModal = lazy(() => import("../Modals/WordListModal"));
const HistoryModal = lazy(() => import("../Modals/HistoryModal"));
const AIModal = lazy(() => import("../Modals/AIModal"));
const ConjugationModal = lazy(() => import("./ConjugationModal"));

// Cache key constants
const CACHE_KEY = WORD_LIST_PAGE_CACHE_KEY;
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const WORDS_PER_PAGE = 40;
const WORD_LIST_QUERY_VERSION = 3;

const UNKNOWN_TOPIC_ID = 1;
const RESTRICTED_LEVEL_ID = 6;
const NOT_SPECIFIED_PART_OF_SPEECH = "not_specified";
const HIDDEN_PART_OF_SPEECH_IDS = new Set([3]);
const DEFAULT_PART_OF_SPEECH_OPTIONS = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
];

const EMPTY_CACHE = Object.freeze({
  words: [],
  levels: [],
  topics: [],
  lastUpdated: null,
  isPartial: false,
  totalWords: 0,
  totalPages: 1,
  currentPage: 1,
});

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeStringList = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeLinkedWords = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") {
            const normalizedValue = item.trim();
            return normalizedValue ? { value: normalizedValue } : null;
          }

          if (!isRecord(item)) {
            return null;
          }

          const normalizedValue =
            typeof item.value === "string" ? item.value.trim() : "";

          if (!normalizedValue) {
            return null;
          }

          return {
            ...item,
            value: normalizedValue,
          };
        })
        .filter(Boolean)
    : [];

const normalizeWords = (value) =>
  Array.isArray(value)
    ? value
        .map((word) => {
          if (!isRecord(word)) {
            return null;
          }

          const normalizedValue =
            typeof word.value === "string" ? word.value.trim() : "";

          if (!normalizedValue) {
            return null;
          }

          return {
            ...word,
            value: normalizedValue,
            pluralForm:
              typeof word.pluralForm === "string" ? word.pluralForm : "",
            meaning: normalizeStringList(word.meaning),
            sentences: normalizeStringList(word.sentences),
            synonyms: normalizeLinkedWords(word.synonyms),
            antonyms: normalizeLinkedWords(word.antonyms),
            similarWords: normalizeLinkedWords(word.similarWords),
            history: Array.isArray(word.history)
              ? word.history.filter((item) => isRecord(item))
              : [],
          };
        })
        .filter(Boolean)
    : [];

const normalizeEntityList = (value) =>
  Array.isArray(value) ? value.filter((item) => isRecord(item)) : [];

const sortTopics = (topics) =>
  [...topics].sort((a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0));

const normalizeCachePayload = (payload, defaults = {}) => {
  const source = isRecord(payload) ? payload : {};

  return {
    words: normalizeWords(source.words),
    levels: normalizeEntityList(source.levels),
    topics: sortTopics(normalizeEntityList(source.topics)),
    lastUpdated:
      typeof source.lastUpdated === "number" &&
      Number.isFinite(source.lastUpdated)
        ? source.lastUpdated
        : (defaults.lastUpdated ?? null),
    isPartial: source.isPartial === true || defaults.isPartial === true,
    totalWords:
      typeof source.totalWords === "number" &&
      Number.isFinite(source.totalWords)
        ? source.totalWords
        : (defaults.totalWords ?? 0),
    totalPages:
      typeof source.totalPages === "number" &&
      Number.isFinite(source.totalPages) &&
      source.totalPages > 0
        ? source.totalPages
        : (defaults.totalPages ?? 1),
    currentPage:
      typeof source.currentPage === "number" &&
      Number.isFinite(source.currentPage) &&
      source.currentPage > 0
        ? source.currentPage
        : (defaults.currentPage ?? 1),
  };
};

const hasAdminCompletenessFilter = (queryState) =>
  queryState?.missingMeaningOnly || queryState?.missingSentencesOnly;

const filterWordsByAdminCompleteness = (words, queryState) => {
  if (!hasAdminCompletenessFilter(queryState)) {
    return words;
  }

  return words.filter((word) => {
    if (queryState.missingMeaningOnly) {
      return word.meaning.length === 0;
    }

    if (queryState.missingSentencesOnly) {
      return word.sentences.length === 0;
    }

    return true;
  });
};

const buildAdminCompletenessPagePayload = (payload, queryState, page) => {
  const normalizedPayload = normalizeCachePayload(payload, {
    currentPage: page,
    totalPages: 1,
    totalWords: 0,
    lastUpdated: Date.now(),
    isPartial: false,
  });

  if (!hasAdminCompletenessFilter(queryState)) {
    return normalizedPayload;
  }

  const filteredWords = filterWordsByAdminCompleteness(
    normalizedPayload.words,
    queryState,
  );
  const totalWords = filteredWords.length;
  const totalPages = Math.max(1, Math.ceil(totalWords / WORDS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * WORDS_PER_PAGE;

  return {
    ...normalizedPayload,
    words: filteredWords.slice(startIndex, startIndex + WORDS_PER_PAGE),
    totalWords,
    totalPages,
    currentPage: safePage,
  };
};

const createEmptyPageCacheStore = () => ({ queries: {} });

const normalizePagedCacheStore = (value) => {
  if (!isRecord(value) || !isRecord(value.queries)) {
    return createEmptyPageCacheStore();
  }

  const queries = Object.entries(value.queries).reduce(
    (accumulator, [queryKey, queryEntry]) => {
      if (!isRecord(queryEntry) || !isRecord(queryEntry.pages)) {
        return accumulator;
      }

      const pages = Object.entries(queryEntry.pages).reduce(
        (pageAccumulator, [pageKey, pageValue]) => {
          pageAccumulator[pageKey] = normalizeCachePayload(
            pageValue,
            EMPTY_CACHE,
          );
          return pageAccumulator;
        },
        {},
      );

      accumulator[queryKey] = { pages };
      return accumulator;
    },
    {},
  );

  return { queries };
};

const getCachedQueryPage = (store, queryKey, page) =>
  store?.queries?.[queryKey]?.pages?.[String(page)] ?? null;

const isFreshCacheEntry = (entry) =>
  typeof entry?.lastUpdated === "number" &&
  Date.now() - entry.lastUpdated < CACHE_EXPIRY;

const buildWordListQueryKey = (queryState) => {
  const normalizedSearch = normalizeText(queryState.search);

  return JSON.stringify({
    version: WORD_LIST_QUERY_VERSION,
    ...queryState,
    search: normalizedSearch,
    searchType: normalizedSearch ? queryState.searchType : "word",
  });
};

const buildWordListRequestParams = (queryState, page) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(WORDS_PER_PAGE),
    _ts: String(Date.now()),
  });

  if (hasAdminCompletenessFilter(queryState)) {
    params.set("all", "true");
  }

  if (queryState.level) {
    params.set("level", queryState.level);
  }

  if (queryState.topic) {
    params.set("topic", queryState.topic);
  }

  if (queryState.partOfSpeech) {
    params.set("partOfSpeech", queryState.partOfSpeech);
  }

  // Add verb-specific filters
  if (queryState.verbFilter) {
    params.set("verbFilter", queryState.verbFilter);
  }

  // Add preposition-specific filters
  if (queryState.prepositionFilter) {
    params.set("prepositionFilter", queryState.prepositionFilter);
  }

  // Add adjective-specific filters
  if (queryState.adjectiveFilter) {
    params.set("adjectiveFilter", queryState.adjectiveFilter);
  }

  if (queryState.recentOnly) {
    params.set("recentOnly", "true");
  }

  if (queryState.search) {
    params.set("search", queryState.search);
    params.set("searchType", queryState.searchType);
  }

  if (queryState.missingMeaningOnly) {
    params.set("missingMeaningOnly", "true");
  }

  if (queryState.missingSentencesOnly) {
    params.set("missingSentencesOnly", "true");
  }

  return params.toString();
};

const buildWordListEndpoint = (queryState) =>
  queryState.missingMeaningOnly || queryState.missingSentencesOnly
    ? "/word/admin/all"
    : "/word/all";

const ADMIN_COMPLETENESS_FILTER_OPTIONS = [
  { value: "", label: "All words" },
  { value: "missingMeaning", label: "Missing meaning" },
  { value: "missingSentences", label: "Missing sentences" },
];

const normalizePartOfSpeechName = (value) => normalizeText(value);

const normalizePartOfSpeechOptions = (value) => {
  const options = Array.isArray(value) ? value : [];
  const seenValues = new Set();

  return options
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const label = typeof item.name === "string" ? item.name.trim() : "";
      const itemId = Number(item.id);
      const normalizedValue = normalizePartOfSpeechName(label);

      if (
        !label ||
        !normalizedValue ||
        HIDDEN_PART_OF_SPEECH_IDS.has(itemId) ||
        seenValues.has(normalizedValue)
      ) {
        return null;
      }

      seenValues.add(normalizedValue);

      return {
        value: normalizedValue,
        label,
      };
    })
    .filter(Boolean);
};

const showWordListRecoveryToast = ({ icon, title }) => {
  void Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
  });
};

const WordList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState({
    creator: "",
    modifiers: [],
  });
  // ===
  const [filteredTopics, setFilteredTopics] = useState([]);
  // const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [levels, setLevels] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [partOfSpeechOptions, setPartOfSpeechOptions] = useState(
    DEFAULT_PART_OF_SPEECH_OPTIONS,
  );
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState("");
  const [selectedVerbFilter, setSelectedVerbFilter] = useState(""); // modal, reflexive, separable, dative, etc.
  const [selectedPrepositionFilter, setSelectedPrepositionFilter] =
    useState(""); // accusative, dative, genitive, wechsel
  const [selectedAdjectiveFilter, setSelectedAdjectiveFilter] = useState(""); // prepositional
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const focusElement = useRef(null);
  const [showActionColumn, setShowActionColumn] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState({});
  const [searchType, setSearchType] = useState("word"); // 'word' | 'meaning'
  const [selectedWord, setSelectedWord] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [adminCompletenessFilter, setAdminCompletenessFilter] = useState("");
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const [pageCacheReady, setPageCacheReady] = useState(false);

  // =========Search suggestions ===============
  // Purely additive: fetches from a separate lightweight endpoint on its
  // own debounce/abort cycle. Never touches searchValue/debouncedSearchValue
  // or the table-fetch pipeline above, so it cannot slow down or break the
  // existing search-to-table flow.
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
    useState(-1);
  const suggestionsAbortRef = useRef(null);
  const searchInputRef = useRef(null);
  // Timestamp (ms) until which suggestion-fetch effect firings are ignored;
  // see selectSuggestion.
  const suppressSuggestionsUntilRef = useRef(0);
  // =========Search suggestions ===============

  // ===================
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();

  const [favorites, setFavorites] = useState([]);

  // 	=========AI ===============
  const [aiWord, setAiWord] = useState(null);
  const [loadingParagraphs, setLoadingParagraphs] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  // 	=========AI ===============

  // =========Conjugation ===============
  const [loadingConjugations, setLoadingConjugations] = useState({});
  const [isConjugationModalOpen, setIsConjugationModalOpen] = useState(false);
  const [conjugationWord, setConjugationWord] = useState(null);
  const [conjugationData, setConjugationData] = useState(null);
  const [conjugationError, setConjugationError] = useState(null);
  // Session-level cache: avoids hitting the backend for a verb already fetched this session
  const conjugationCache = useRef({});
  // Track which verbs the current user has already reported this session
  const reportedConjugations = useRef(new Set());
  // =========Conjugation ===============

  const debouncedSearchValue = useDebounce(searchValue, 300);
  const debouncedSuggestionQuery = useDebounce(searchValue, 200);
  const debouncedCurrentPage = useDebounce(currentPage, 180);
  const cacheDebounceTimer = useRef(null);
  const aiAbortControllers = useRef(new Map());
  const hasRecoveredCorruptData = useRef(false);
  const pageCacheStoreRef = useRef(createEmptyPageCacheStore());
  const latestVisibleRequestId = useRef(0);
  const prefetchingPagesRef = useRef(new Set());
  const inFlightRequestsRef = useRef(new Map());

  const handleAiWordUpdated = useCallback((updatedWord, updatedParagraph) => {
    setCache((prev) => ({
      ...prev,
      words: Array.isArray(prev.words)
        ? prev.words.map((word) =>
            word.id === updatedWord.id
              ? {
                  ...word,
                  meaning: updatedWord.meaning,
                }
              : word,
          )
        : prev.words,
    }));
    setAiWord(updatedWord);
    if (typeof updatedParagraph === "string") {
      setSelectedParagraph(updatedParagraph);
    }
  }, []);

  // useEffect for fetching favorites (Logic remains the same, good to leave)
  useEffect(() => {
    const fetchPartOfSpeechOptions = async () => {
      try {
        const response = await api.get("/part-of-speech");
        const normalizedOptions = normalizePartOfSpeechOptions(response.data);

        if (normalizedOptions.length > 0) {
          setPartOfSpeechOptions(normalizedOptions);
        }
      } catch (error) {
        console.error("Failed to fetch part of speech options:", error);
      }
    };

    fetchPartOfSpeechOptions();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      //   if (
      //     (!userInfo?.id && userInfo.role !== "basic_user") ||
      //     (!userInfo?.id && userInfo.role !== "admin")
      //   )
      //     return;

      if (!userLoggedIn || !userId) return;

      try {
        const response = await api.get(`/favorite-words/${userId}`);
        setFavorites(response.data.data.map((word) => word.id));
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            setFavorites([]);
          }
        }
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [userId, userLoggedIn]);

  const toggleFavorite = async (wordId) => {
    // Prevent concurrent requests to the same word
    if (loadingFavorites[wordId]) return;

    const isFavorite = favorites.includes(wordId);
    const previousState = favorites; // Store for rollback

    try {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: true }));

      // Optimistic update - update UI immediately
      if (isFavorite) {
        setFavorites((prev) => prev.filter((id) => id !== wordId));
        await api.delete(`/favorite-words/${wordId}`);
      } else {
        setFavorites((prev) => [...prev, wordId]);
        await api.post("/favorite-words", { wordId });
      }
    } catch (error) {
      // Rollback optimistic update on error
      setFavorites(previousState);

      Swal.fire({
        icon: "error",
        title: "Favorite Update Failed",
        text: error.response?.data?.message || "Could not update favorite",
      });
    } finally {
      setLoadingFavorites((prev) => ({ ...prev, [wordId]: false }));
    }
  };

  // ===================

  const [cache, setCache] = useState(EMPTY_CACHE);

  const activeQuery = useMemo(() => {
    const query = {
      search: debouncedSearchValue.trim(),
      searchType,
      level: selectedLevel,
      topic: selectedTopic,
      partOfSpeech: selectedPartOfSpeech,
      verbFilter: selectedVerbFilter, // Add verb sub-filter
      prepositionFilter: selectedPrepositionFilter, // Add preposition sub-filter
      adjectiveFilter: selectedAdjectiveFilter, // Add adjective sub-filter
      recentOnly: showRecentOnly,
      missingMeaningOnly:
        isAdmin && adminCompletenessFilter === "missingMeaning",
      missingSentencesOnly:
        isAdmin && adminCompletenessFilter === "missingSentences",
    };

    return query;
  }, [
    debouncedSearchValue,
    searchType,
    selectedLevel,
    selectedTopic,
    selectedPartOfSpeech,
    selectedVerbFilter, // Add to dependency array
    selectedPrepositionFilter, // Add to dependency array
    selectedAdjectiveFilter, // Add to dependency array
    showRecentOnly,
    isAdmin,
    adminCompletenessFilter,
  ]);

  const activeQueryKey = useMemo(
    () => buildWordListQueryKey(activeQuery),
    [activeQuery],
  );

  const hasFreshCurrentPageCache = useMemo(() => {
    if (!pageCacheReady) {
      return false;
    }

    const cachedPage = getCachedQueryPage(
      pageCacheStoreRef.current,
      activeQueryKey,
      currentPage,
    );

    return Boolean(cachedPage && isFreshCacheEntry(cachedPage));
  }, [activeQueryKey, currentPage, pageCacheReady, cache.lastUpdated]);

  const requestedPageToFetch = hasFreshCurrentPageCache
    ? currentPage
    : debouncedCurrentPage;

  const applyCacheState = useCallback((payload, defaults = {}) => {
    const normalizedCache = normalizeCachePayload(payload, defaults);

    setCache(normalizedCache);
    setLevels(normalizedCache.levels);
    setTopics(normalizedCache.topics);
    setFilteredTopics(normalizedCache.topics);
    setTotalPages(normalizedCache.totalPages || 1);

    return normalizedCache;
  }, []);

  const persistPageCacheStore = useCallback(() => {
    if (cacheDebounceTimer.current) {
      clearTimeout(cacheDebounceTimer.current);
    }

    cacheDebounceTimer.current = setTimeout(() => {
      void setToStorage(CACHE_KEY, pageCacheStoreRef.current);
    }, 100);
  }, []);

  const cachePageResult = useCallback(
    (queryKey, page, payload, defaults = {}) => {
      const normalizedPage = normalizeCachePayload(payload, {
        ...defaults,
        currentPage: page,
        lastUpdated: defaults.lastUpdated ?? Date.now(),
        isPartial: false,
      });

      const existingPages =
        pageCacheStoreRef.current.queries?.[queryKey]?.pages ?? {};

      pageCacheStoreRef.current = {
        queries: {
          ...pageCacheStoreRef.current.queries,
          [queryKey]: {
            pages: {
              ...existingPages,
              [String(page)]: normalizedPage,
            },
          },
        },
      };

      persistPageCacheStore();
      return normalizedPage;
    },
    [persistPageCacheStore],
  );

  const fetchWordsPage = useCallback(
    async ({
      queryState,
      queryKey,
      page,
      preferCache = true,
      prefetch = false,
    }) => {
      const cachedPage = getCachedQueryPage(
        pageCacheStoreRef.current,
        queryKey,
        page,
      );

      if (preferCache && cachedPage && isFreshCacheEntry(cachedPage)) {
        if (!prefetch) {
          applyCacheState(cachedPage);
          setIsLoading(false);
          setIsRefreshingPage(false);
        }

        return cachedPage;
      }

      const requestId = prefetch ? null : ++latestVisibleRequestId.current;
      const requestKey = `${queryKey}:${page}`;

      if (!prefetch) {
        if (cachedPage) {
          applyCacheState(cachedPage);
          setIsRefreshingPage(true);
        } else if (cache.words.length > 0) {
          setIsRefreshingPage(true);
        } else {
          setIsLoading(true);
        }
      }

      try {
        let pageRequest = inFlightRequestsRef.current.get(requestKey);

        if (!pageRequest) {
          pageRequest = api
            .get(
              `${buildWordListEndpoint(queryState)}?${buildWordListRequestParams(queryState, page)}`,
            )
            .then((response) => {
              const pagePayload = buildAdminCompletenessPagePayload(
                response.data?.data,
                queryState,
                page,
              );

              return cachePageResult(queryKey, page, pagePayload, {
                lastUpdated: Date.now(),
                totalPages: 1,
                totalWords: 0,
              });
            })
            .finally(() => {
              inFlightRequestsRef.current.delete(requestKey);
            });

          inFlightRequestsRef.current.set(requestKey, pageRequest);
        }

        const normalizedPage = await pageRequest;

        if (!prefetch) {
          if (
            normalizedPage.totalPages > 0 &&
            page > normalizedPage.totalPages &&
            normalizedPage.totalPages !== currentPage
          ) {
            setCurrentPage(normalizedPage.totalPages);
            return normalizedPage;
          }

          if (requestId === latestVisibleRequestId.current) {
            applyCacheState(normalizedPage);
            hasRecoveredCorruptData.current = false;
          }
        }

        return normalizedPage;
      } catch (error) {
        if (!prefetch) {
          console.error("Failed to fetch word list page:", error);
        }
        throw error;
      } finally {
        if (!prefetch && requestId === latestVisibleRequestId.current) {
          setIsLoading(false);
          setIsRefreshingPage(false);
        }
      }
    },
    [applyCacheState, cache.words.length, cachePageResult, currentPage],
  );

  const prefetchAdjacentPages = useCallback(
    (queryState, queryKey, page, totalPagesCount) => {
      if (hasAdminCompletenessFilter(queryState)) {
        return;
      }

      const candidatePages = [page - 1, page + 1].filter(
        (candidatePage) =>
          candidatePage >= 1 && candidatePage <= totalPagesCount,
      );

      candidatePages.forEach((candidatePage) => {
        const prefetchKey = `${queryKey}:${candidatePage}`;
        const cachedPage = getCachedQueryPage(
          pageCacheStoreRef.current,
          queryKey,
          candidatePage,
        );

        if (cachedPage && isFreshCacheEntry(cachedPage)) {
          return;
        }

        if (prefetchingPagesRef.current.has(prefetchKey)) {
          return;
        }

        prefetchingPagesRef.current.add(prefetchKey);

        void fetchWordsPage({
          queryState,
          queryKey,
          page: candidatePage,
          preferCache: true,
          prefetch: true,
        }).finally(() => {
          prefetchingPagesRef.current.delete(prefetchKey);
        });
      });
    },
    [fetchWordsPage],
  );

  const recoverFromInvalidWordList = useCallback(
    async (reason, error) => {
      console.warn(`Recovering word list after invalid data: ${reason}`, error);

      if (hasRecoveredCorruptData.current) {
        console.error(
          "Word list recovery already attempted once; stopping retry loop.",
        );
        applyCacheState(EMPTY_CACHE);
        setIsLoading(false);
        showWordListRecoveryToast({
          icon: "warning",
          title: "Vocabulary list could not be refreshed automatically.",
        });
        return;
      }

      hasRecoveredCorruptData.current = true;
      pageCacheStoreRef.current = createEmptyPageCacheStore();
      await removeFromStorage(CACHE_KEY);
      applyCacheState(EMPTY_CACHE);
      showWordListRecoveryToast({
        icon: "info",
        title: "Vocabulary list cache was refreshed.",
      });
      await fetchWordsPage({
        queryState: activeQuery,
        queryKey: activeQueryKey,
        page: currentPage,
        preferCache: false,
      });
    },
    [activeQuery, activeQueryKey, applyCacheState, currentPage, fetchWordsPage],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedData = await getFromStorage(CACHE_KEY);
        pageCacheStoreRef.current = normalizePagedCacheStore(cachedData);
      } catch (err) {
        console.error("Failed to load cached data:", err);
        pageCacheStoreRef.current = createEmptyPageCacheStore();
      } finally {
        setPageCacheReady(true);
      }
    };

    void loadData();
    return () => {
      if (cacheDebounceTimer.current) {
        clearTimeout(cacheDebounceTimer.current);
      }
    };
  }, [recoverFromInvalidWordList]);

  useEffect(() => {
    if (!pageCacheReady) {
      return undefined;
    }

    const handleStorageChange = (e) => {
      if (e.key === CACHE_KEY && e.newValue === null) {
        pageCacheStoreRef.current = createEmptyPageCacheStore();
        void fetchWordsPage({
          queryState: activeQuery,
          queryKey: activeQueryKey,
          page: currentPage,
          preferCache: false,
        });
      }
    };

    const handleCacheInvalidated = (event) => {
      if (event.detail?.key && event.detail.key !== CACHE_KEY) {
        return;
      }

      pageCacheStoreRef.current = createEmptyPageCacheStore();
      void fetchWordsPage({
        queryState: activeQuery,
        queryKey: activeQueryKey,
        page: currentPage,
        preferCache: false,
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cacheInvalidated", handleCacheInvalidated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cacheInvalidated", handleCacheInvalidated);
    };
  }, [
    activeQuery,
    activeQueryKey,
    currentPage,
    fetchWordsPage,
    pageCacheReady,
  ]);

  useEffect(() => {
    if (!pageCacheReady) {
      return;
    }

    const cachedPage = getCachedQueryPage(
      pageCacheStoreRef.current,
      activeQueryKey,
      currentPage,
    );

    if (cachedPage && isFreshCacheEntry(cachedPage)) {
      applyCacheState(cachedPage);
      setIsLoading(false);
      setIsRefreshingPage(false);
      return;
    }

    if (cache.words.length > 0) {
      setIsRefreshingPage(true);
    }
  }, [
    activeQueryKey,
    applyCacheState,
    cache.words.length,
    currentPage,
    pageCacheReady,
  ]);

  useEffect(() => {
    if (!pageCacheReady) {
      return;
    }

    void (async () => {
      try {
        const pageData = await fetchWordsPage({
          queryState: activeQuery,
          queryKey: activeQueryKey,
          page: requestedPageToFetch,
          preferCache: true,
        });

        if (pageData) {
          prefetchAdjacentPages(
            activeQuery,
            activeQueryKey,
            pageData.currentPage || requestedPageToFetch,
            pageData.totalPages || 1,
          );
        }
      } catch (error) {
        const cachedPage = getCachedQueryPage(
          pageCacheStoreRef.current,
          activeQueryKey,
          requestedPageToFetch,
        );

        if (!cachedPage) {
          applyCacheState(EMPTY_CACHE);
        }
      }
    })();
  }, [
    activeQuery,
    activeQueryKey,
    applyCacheState,
    requestedPageToFetch,
    fetchWordsPage,
    pageCacheReady,
    prefetchAdjacentPages,
  ]);

  // Force refresh when navigating from word creation
  useEffect(() => {
    if (location.state?.forceRefresh) {
      const refreshWords = async () => {
        pageCacheStoreRef.current = createEmptyPageCacheStore();
        await invalidateWordsCache();
      };

      void refreshWords();

      // Clear the transient navigation state without mutating browser history directly.
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        { replace: true, state: null },
      );
    }
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  const paginatedWords = useMemo(() => cache.words, [cache.words]);

  const handleSearchInputChange = useCallback((event) => {
    const value = event.target.value;
    setSearchValue(value);
    setCurrentPage(1);
    setHighlightedSuggestionIndex(-1);
  }, []);

  const handleSearchTypeChange = useCallback((event) => {
    setSearchType(event.target.value);
    setCurrentPage(1);
  }, []);

  // =========Search suggestions ===============
  // Own debounce, own abort-controlled request, own lightweight endpoint —
  // fully decoupled from debouncedSearchValue and the table-fetch pipeline,
  // so it can never slow down or interfere with the actual search.
  useEffect(() => {
    const trimmed = debouncedSuggestionQuery.trim();

    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current.abort();
      suggestionsAbortRef.current = null;
    }

    // Selecting a suggestion sets searchValue (and possibly searchType) at
    // once, which would otherwise re-trigger this same effect and pop the
    // dropdown back open (the selected word matches itself). searchType
    // changes immediately while debouncedSuggestionQuery only catches up
    // ~200ms later, so this effect can fire twice for one selection — a
    // time window (rather than a one-shot flag) suppresses every firing
    // that lands inside it, however many there are.
    if (Date.now() < suppressSuggestionsUntilRef.current) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    const controller = new AbortController();
    suggestionsAbortRef.current = controller;

    api
      .get(
        `/word/suggest?search=${encodeURIComponent(trimmed)}&searchType=${searchType}&limit=8`,
        { signal: controller.signal },
      )
      .then((response) => {
        const results = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        // Regular autocomplete suggestions are commented out — the table
        // itself already re-sorts/filters live as you type, so a second
        // list showing the same matches was redundant. "Did you mean"
        // (typo correction) stays on, since the table can't tell the user
        // "you meant X" on its own. To restore the regular dropdown,
        // pass `results` directly instead of filtering here.
        const displayResults = results.filter((item) => item.isFuzzy);

        setSuggestions(displayResults);
        setSuggestionsOpen(displayResults.length > 0);
        setHighlightedSuggestionIndex(-1);
      })
      .catch((error) => {
        if (error.name === "CanceledError" || error.name === "AbortError") {
          return;
        }
        // Suggestions are a convenience layer only — a failure here must
        // never surface to the user or affect the main search/table.
        setSuggestions([]);
        setSuggestionsOpen(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedSuggestionQuery, searchType]);

  const selectSuggestion = useCallback(
    (suggestion) => {
      // Covers the debounced searchValue-change firing that follows the
      // state update below by ~200ms.
      suppressSuggestionsUntilRef.current = Date.now() + 350;
      // Fill the box with whatever is valid in the CURRENT mode, rather
      // than switching mode out from under the user. In word mode that's
      // the word itself; in meaning mode it's the matched meaning text —
      // searching for the word's German spelling while still in meaning
      // mode would search for it inside meaning text and match nothing.
      const nextSearchValue =
        searchType === "meaning" && suggestion.meaning?.[0]
          ? suggestion.meaning[0]
          : suggestion.value;
      setSearchValue(nextSearchValue);
      setCurrentPage(1);
      setSuggestions([]);
      setSuggestionsOpen(false);
      setHighlightedSuggestionIndex(-1);
      searchInputRef.current?.focus();
    },
    [searchType],
  );

  const handleSearchInputKeyDown = useCallback(
    (event) => {
      if (!suggestionsOpen || suggestions.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      } else if (event.key === "Enter") {
        if (highlightedSuggestionIndex >= 0) {
          event.preventDefault();
          selectSuggestion(suggestions[highlightedSuggestionIndex]);
        } else {
          setSuggestionsOpen(false);
        }
      } else if (event.key === "Escape") {
        setSuggestionsOpen(false);
        setHighlightedSuggestionIndex(-1);
      }
    },
    [
      suggestionsOpen,
      suggestions,
      highlightedSuggestionIndex,
      selectSuggestion,
    ],
  );

  const handleSearchInputBlur = useCallback(() => {
    // Delay so a click on a suggestion (which fires mousedown/click before
    // blur settles) has a chance to register before the dropdown closes.
    setTimeout(() => setSuggestionsOpen(false), 150);
  }, []);
  // =========Search suggestions ===============

  const openModal = useCallback(
    (word) => {
      if (!word?.id) {
        void recoverFromInvalidWordList(
          "attempted to open modal for invalid word",
          word,
        );
        return;
      }

      setSelectedWord(word);
      setIsModalOpen(true);
    },
    [recoverFromInvalidWordList],
  );

  const closeModal = useCallback(() => {
    setSelectedWord(null);
    setIsModalOpen(false);
  }, []);

  const openWordInModal = useCallback(
    async (wordValue, wordId) => {
      if (wordId) {
        const exactIdMatch = paginatedWords.find((word) => word?.id === wordId);
        if (exactIdMatch) {
          openModal(exactIdMatch);
          return;
        }

        try {
          const response = await api.get(`/word/${wordId}?_t=${Date.now()}`);
          const fetchedWord = response.data?.data;
          if (fetchedWord?.id) {
            setSelectedWord(fetchedWord);
            setIsModalOpen(true);
            return;
          }
        } catch (error) {
          console.error("Failed to fetch linked word by id:", error);
        }
      }

      const exactWordMatch = paginatedWords.find(
        (word) => word?.value === wordValue,
      );

      if (exactWordMatch) {
        openModal(exactWordMatch);
        return;
      }

      try {
        const response = await api.get(
          `/word/${encodeURIComponent(wordValue)}?_t=${Date.now()}`,
        );
        const fetchedWord = response.data?.data;

        if (fetchedWord?.id) {
          setSelectedWord(fetchedWord);
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch linked word:", error);
      }

      const relatedWordMatch = paginatedWords.find(
        (word) =>
          word?.synonyms?.some((synonym) => synonym?.value === wordValue) ||
          word?.antonyms?.some((antonym) => antonym?.value === wordValue) ||
          word?.similarWords?.some(
            (similarWord) => similarWord?.value === wordValue,
          ),
      );

      if (relatedWordMatch) {
        openModal(relatedWordMatch);
        return;
      }

      Swal.fire(
        "Not Found",
        "The word doesn't exist in your word list.",
        "error",
      );
    },
    [openModal, paginatedWords],
  );

  const handleLevelChange = useCallback((selected) => {
    setSelectedLevel(selected);
    setSelectedTopic("");
    setCurrentPage(1);
  }, []);

  const handleTopicChange = useCallback((selected) => {
    setSelectedTopic(selected);
    setCurrentPage(1); // Reset page on filter change
  }, []);

  const handlePartOfSpeechChange = useCallback((value) => {
    setSelectedPartOfSpeech(value);
    if (value !== "verb") {
      setSelectedVerbFilter(""); // Clear verb filter if not selecting verb
    }
    if (value !== "preposition") {
      setSelectedPrepositionFilter(""); // Clear preposition filter if not selecting preposition
    }
    if (value !== "adjective") {
      setSelectedAdjectiveFilter(""); // Clear adjective filter if not selecting adjective
    }
    setCurrentPage(1);
  }, []);

  const handleVerbFilterChange = useCallback(
    (value) => {
      setSelectedVerbFilter(value);
      setCurrentPage(1);
    },
    [selectedVerbFilter],
  );

  const handlePrepositionFilterChange = useCallback((value) => {
    setSelectedPrepositionFilter(value);
    setCurrentPage(1);
  }, []);

  const handleAdjectiveFilterChange = useCallback(
    (value) => {
      setSelectedAdjectiveFilter(value);
      setCurrentPage(1);
    },
    [selectedAdjectiveFilter],
  );

  // Learning mode implementation (Logic remains the same, good to leave)
  const handleDelete = useCallback(
    (wordId, wordValue) => {
      if (!userId) {
        Swal.fire("Error", "User not logged in or user ID missing.", "error");
        return;
      }
      Swal.fire({
        title: "Are you sure?",
        html: `You won't be able to revert this! Delete <strong style="color: #dc2626; font-weight: 800;">"${wordValue}"</strong>?`,
        icon: "warning",
        input: "text",
        inputPlaceholder: "Type password",
        inputValidator: (value) =>
          value === import.meta.env.VITE_DELETE_PASSWORD
            ? null
            : "Wrong Password!",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Delete",
      }).then((result) => {
        if (result.isConfirmed) {
          api
            .delete(`/word/delete/${wordId}`)
            .then(async () => {
              pageCacheStoreRef.current = createEmptyPageCacheStore();
              await invalidateWordsCache();

              Swal.fire({
                title: "Deleted!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });
            })
            .catch((error) => {
              Swal.fire("Error!", "Something went wrong.", "error");
            });
        }
      });
    },
    [userId],
  );

  //learning mode
  const toggleLearningMode = useCallback(() => {
    setLearningMode((prev) => !prev);
    setRevealedWords([]);
  }, []);

  const revealMeaning = useCallback((wordId) => {
    setRevealedWords((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId],
    );
  }, []);

  const handleArrowKeyPress = useCallback(
    (e, index) => {
      const keyActions = {
        ArrowRight: () => index + 1,
        ArrowDown: () => index + 1,
        ArrowLeft: () => index - 1,
        ArrowUp: () => index - 1,
      };

      const action = keyActions[e.key];
      if (action) {
        e.preventDefault();
        const newIndex = action();
        if (newIndex >= 0 && newIndex < paginatedWords.length) {
          revealMeaning(paginatedWords[newIndex].id);
          setCurrentIndex(newIndex);
        }
      }
    },
    [paginatedWords, revealMeaning],
  );

  // Focus management
  useEffect(() => {
    if (currentIndex !== null && focusElement.current) {
      focusElement.current.focus();
    }
  }, [currentIndex]);

  // Cleanup abort controllers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      aiAbortControllers.current.forEach((controller) => {
        try {
          controller.abort();
        } catch (e) {
          // Ignore errors if already aborted
        }
      });
      aiAbortControllers.current.clear();
    };
  }, []);

  const allowedLevels = useMemo(
    () =>
      levels.filter((level) => {
        if (level.id === RESTRICTED_LEVEL_ID && !isAdmin) {
          return false;
        }
        return true;
      }),
    [levels, isAdmin],
  );

  const levelItems = useMemo(
    () =>
      allowedLevels.map((level) => ({
        type: "item",
        value: level.level,
        label: level.level,
      })),
    [allowedLevels],
  );

  // Update the toggleView function

  // Memoize sorted topics separately to avoid recreating JSX on every render
  const sortedTopicData = useMemo(() => {
    const levelIdToLevelMap = new Map(levels.map((level) => [level.id, level]));

    const sorted = [...filteredTopics].sort((a, b) => {
      if (a.id === UNKNOWN_TOPIC_ID) return 1;
      if (b.id === UNKNOWN_TOPIC_ID) return -1;

      const levelA = levelIdToLevelMap.get(a.levelId);
      const levelB = levelIdToLevelMap.get(b.levelId);

      if (levelA && levelB) {
        return levelA.id - levelB.id;
      }
      return 0;
    });

    return { sorted, levelIdToLevelMap };
  }, [filteredTopics, levels]);

  // Data for the topic dropdown — grouped by level, with separators
  // between groups (mirrors the previous native <select> option list).
  const topicItems = useMemo(() => {
    const { sorted: sortedTopics, levelIdToLevelMap } = sortedTopicData;

    let lastLevelId = null;
    const rows = [];

    sortedTopics.forEach((topic) => {
      const level = levelIdToLevelMap.get(topic.levelId);

      if (level && level.id !== lastLevelId && lastLevelId !== null) {
        rows.push({ type: "separator" });
      }

      lastLevelId = level ? level.id : null;

      if (topic.id === UNKNOWN_TOPIC_ID) {
        const displayLevel = selectedLevel ? selectedLevel : "All";
        rows.push({
          type: "item",
          value: topic.name,
          label: `${displayLevel} ➡️ ${topic.name}`,
        });
        return;
      }

      const levelName = level ? level.level : "Unknown Level";
      rows.push({
        type: "item",
        value: topic.name,
        label: `${levelName}${level ? " ➡️" : ""} ${topic.name}`,
      });
    });

    return rows;
  }, [sortedTopicData, selectedLevel]);

  // 	==============AI===============

  const generateParagraph = async (word) => {
    if (!userId) {
      Swal.fire(
        "Not Logged In",
        "You must be logged in to generate paragraphs",
        "warning",
      );
      return;
    }

    // Cancel any existing request for this word
    const existingController = aiAbortControllers.current.get(word.id);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    aiAbortControllers.current.set(word.id, abortController);

    try {
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: true }));

      const response = await aiApi.post(
        `/paragraphs/generate`,
        {
          userId,
          wordId: word.id,
          word: word.value,
          meaning: word.meaning,
          level: word.level?.level || "A1",
          language: "de",
        },
        {
          signal: abortController.signal,
        },
      );

      const aiMeanings = response.data.meanings || [];
      const sentences =
        response.data.otherSentences || response.data.sentences || [];
      const paragraph = response.data.paragraph;
      const wordId = response.data.wordId || word.id; // depends on AI API response

      const fullWord = paginatedWords.find((w) => w?.id === wordId) || word;

      setAiWord({
        ...(fullWord || { id: word.id, value: word.value }),
        aiMeanings,
        sentences:
          sentences.length > 0 ? sentences : paragraph.split(/(?<=[.!?])\s+/),
      });

      setSelectedParagraph(paragraph);
      setIsAIModalOpen(true);
    } catch (error) {
      // Ignore abort errors (user cancelled request or new request initiated)
      if (error.name === "AbortError") {
        return;
      }

      const errorMessage = error.response?.data?.error || error.message;
      const isLimitError =
        error.response?.status === 403 ||
        errorMessage?.toLowerCase().includes("limit") ||
        errorMessage?.toLowerCase().includes("exceeded");
      const isServiceError =
        (error.response?.status === 500 ||
          error.response?.status === 429 ||
          error.response?.status === 503) &&
        !isLimitError;

      if (isLimitError) {
        Swal.fire("Limit Reached", errorMessage, "warning");
      } else if (isServiceError) {
        Swal.fire(
          "Service Temporarily Unavailable",
          errorMessage || "AI service is busy. Please try again in a moment.",
          "info",
        );
      } else {
        Swal.fire("Error", "Failed to generate paragraph", "error");
      }
    } finally {
      aiAbortControllers.current.delete(word.id);
      setLoadingParagraphs((prev) => ({ ...prev, [word.id]: false }));
    }
  };

  // 	==============AI===============

  // ==============Conjugation===============
  const handleConjugate = useCallback(async (word) => {
    const cacheKey = word.value?.toLowerCase().trim();

    // Return cached result instantly if we already fetched it this session
    if (conjugationCache.current[cacheKey]) {
      setConjugationWord(word);
      setConjugationError(null);
      setConjugationData(conjugationCache.current[cacheKey]);
      setIsConjugationModalOpen(true);
      return;
    }

    // Show the loading spinner on the button only — don't open the modal
    // until data (cached or freshly generated) is actually ready, so a
    // fast DB-cache hit never flashes a "Generating..." screen.
    setLoadingConjugations((prev) => ({ ...prev, [word.id]: true }));

    try {
      const response = await aiApi.post("/conjugations/generate", {
        word: cacheKey,
      });
      const data = response.data?.data;
      conjugationCache.current[cacheKey] = data;
      setConjugationWord(word);
      setConjugationError(null);
      setConjugationData(data);
      setIsConjugationModalOpen(true);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to generate conjugation. Please try again.";
      setConjugationWord(word);
      setConjugationData(null);
      setConjugationError(message);
      setIsConjugationModalOpen(true);
    } finally {
      setLoadingConjugations((prev) => ({ ...prev, [word.id]: false }));
    }
  }, []);
  // ==============Conjugation===============

  const handleResetFilters = useCallback(() => {
    // Reset all filter-related states
    setSearchValue("");
    setSelectedLevel("");
    setSelectedTopic("");
    setSelectedPartOfSpeech("");
    setSelectedVerbFilter(""); // Reset verb filter
    setSelectedPrepositionFilter(""); // Reset preposition filter
    setSelectedAdjectiveFilter(""); // Reset adjective filter
    setShowRecentOnly(false);
    setAdminCompletenessFilter("");
    setCurrentPage(1);
    setFilteredTopics(topics); // Reset filtered topics back to the full list
  }, [topics]);

  const handleToggleRecentWords = useCallback(() => {
    setShowRecentOnly((prev) => !prev);
    setCurrentPage(1);
  }, []);

  const handleAdminCompletenessFilterChange = useCallback(
    (event) => {
      if (!isAdmin) {
        return;
      }

      setAdminCompletenessFilter(event.target.value);
      setCurrentPage(1);
    },
    [isAdmin],
  );

  // to show info
  useEffect(() => {
    const handleClickOutside = () => setShowInfo(false);
    if (showInfo) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showInfo]);

  const hasResettableFilters = Boolean(
    searchValue ||
    selectedLevel ||
    selectedTopic ||
    selectedPartOfSpeech ||
    selectedVerbFilter ||
    selectedPrepositionFilter ||
    selectedAdjectiveFilter ||
    adminCompletenessFilter,
  );

  const hasActiveFilters = hasResettableFilters || showRecentOnly;

  const displayedWordsCount =
    typeof cache.totalWords === "number" && Number.isFinite(cache.totalWords)
      ? cache.totalWords
      : paginatedWords.length;

  const wordCountLabel = hasActiveFilters ? "Filtered" : "Total";
  const showAdminControls = userLoggedIn && isAdmin;

  const handleChallengeLocked = () => {
    Swal.fire({
      icon: "info",
      title: "Login to enjoy this feature",
      text: "Sign in to play the Daily Challenge",
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

  return (
    <Container>
      {/* Modern Header Section */}
      <div className="text-center my-2 md:my-8 lg:my-8 ">
        <div className="flex justify-between items-center mb-2 md:mb-6 lg:mb-6 ml-2">
          <div className="flex items-center gap-1.5 md:gap-3 lg:gap-3">
            <Link
              to="/quiz"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-1 md:px-2 lg:px-2 py-1 md:py-2 lg:py-1 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/50"
            >
              🎮 Play Quiz
            </Link>

            {userLoggedIn ? (
              <Link
                to="/challenge"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-1 md:px-2 lg:px-2 py-1 md:py-1 lg:py-1 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
              >
                🎯 Daily Challenge
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleChallengeLocked}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-1 md:px-2 lg:px-2 py-1 md:py-1 lg:py-1 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
              >
                🎯 Daily Challenge
              </button>
            )}
          </div>

          <span className="text-sm block md:hidden lg:hidden text-pink-400 font-bold mr-2">
            {wordCountLabel}: {displayedWordsCount} words
          </span>

          {/* {userLoggedIn && isAdmin && (
            <span className="text-sm block md:hidden lg:hidden text-pink-400 font-bold mr-2">
              {wordCountLabel}: {displayedWordsCount} words
            </span>
          )} */}
          {/* {!isAdmin && (
            <span className="text-sm text-pink-400 font-bold mr-2">
              {wordCountLabel}: {displayedWordsCount} words
            </span>
          )} */}
        </div>
        <div className="mb-4 hidden md:inline-block lg:inline-block">
          <span className=" px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
            📚 Learn Vocabulary
          </span>
        </div>
        <h2 className="text-2xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-1 md:pb-4 lg:pb-4">
          Vocabulary Library
        </h2>
        <p className="text-xl text-gray-950 dark:text-gray-300 max-w-2xl mx-auto hidden md:inline-block lg:inline-block">
          Explore and master German vocabulary with interactive learning tools
        </p>
        <div className="hidden md:flex lg:flex justify-center mt-6">
          <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* =============radio buttons ========== */}
      <div className="dark:text-white mb-4 dark:bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-2 md:px-4 mx-0 md:mx-2 lg:mx-2 overflow-hidden">
        <div className="flex flex-col  gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden md:flex-1">
            <div className="flex items-center gap-1.5 flex-nowrap min-w-0 ">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors min-h-[30px] px-2 py-1 md:px-2.5 md:py-1.5 rounded-full bg-white/5 text-[11px] sm:text-sm flex-shrink-0">
                <input
                  type="radio"
                  name="searchType"
                  value="word"
                  checked={searchType === "word"}
                  onChange={handleSearchTypeChange}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="font-medium hidden sm:inline">By Word</span>
                <span className="font-medium sm:hidden">By Word</span>
              </label>

              <label className="flex items-center  gap-1 cursor-pointer hover:text-purple-400 transition-colors min-h-[30px] px-2 py-1 md:px-2.5 md:py-1.5 rounded-full bg-white/5 text-[11px] sm:text-sm flex-shrink-0">
                <input
                  type="radio"
                  name="searchType"
                  value="meaning"
                  checked={searchType === "meaning"}
                  onChange={handleSearchTypeChange}
                  className="w-4 h-4 accent-purple-500"
                />
                <span className="font-medium hidden sm:inline">By Meaning</span>
                <span className="font-medium sm:hidden">By Meaning</span>
              </label>
            </div>
            <div className="ml-auto flex items-center gap-1.5  flex-nowrap flex-shrink-0 md:ml-3">
              {/* {isRefreshingPage && paginatedWords.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 whitespace-nowrap">
              Loading page...
            </span>
          )} */}
              <button
                onClick={handleToggleRecentWords}
                className={`min-h-[30px] mr-2 w-auto flex-shrink-0 px-2 py-1 md:px-2.5 md:py-1.5 rounded-full font-semibold text-[11px] sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg ${
                  showRecentOnly
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 px-2"
                    : "bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 px-2"
                }`}
              >
                <span className="hidden sm:inline">
                  {showRecentOnly ? "Recently added X" : "Recently added"}
                </span>
                <span className="sm:hidden ">
                  {showRecentOnly ? "Recently added X" : "Recently added"}
                </span>
              </button>
              {hasResettableFilters && (
                <button
                  onClick={handleResetFilters}
                  className="min-h-[30px] mr-2 w-auto flex-shrink-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-2 py-1 md:px-2.5 md:py-1.5 rounded-full font-semibold text-[11px] sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg "
                >
                  <span className="hidden sm:inline">Reset Filters</span>
                  <span className="sm:hidden">Reset Filters</span>
                </button>
              )}
            </div>
          </div>
          {showAdminControls && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 md:pt-0 md:border-t-0 md:flex-nowrap md:justify-end md:gap-3 md:flex-shrink-0">
              <select
                id="admin-completeness-filter"
                name="adminCompletenessFilter"
                value={adminCompletenessFilter}
                onChange={handleAdminCompletenessFilterChange}
                className="min-h-[30px] w-full sm:w-auto md:w-auto px-2 py-2 md:px-2.5 md:py-1.5 rounded-full font-semibold text-sm shadow-lg border border-stone-500 bg-stone-800 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                aria-label="Admin word completeness filter"
              >
                {ADMIN_COMPLETENESS_FILTER_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all"}
                    value={option.value}
                    className="bg-stone-800 text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              {/* <p className="text-md font-bold whitespace-nowrap hidden md:block px-2 py-1 md:px-2.5 md:py-1.5 bg-sky-600  rounded-full text-white">
                {displayedWordsCount} words
              </p> */}
            </div>
          )}
          <p className="text-md font-bold whitespace-nowrap hidden md:block px-2 py-1 md:px-2.5 md:py-1.5 bg-sky-600  rounded-full text-white">
            {displayedWordsCount} words
          </p>
        </div>
      </div>
      {/* =============radio buttons ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-4 mb-6 mx-0 md:mx-2 lg:mx-2">
        <div className="w-full space-y-2">
          {/* Search input */}
          <div className="relative">
            <label htmlFor="word-search" className="sr-only">
              {searchType === "word" ? "Search by word" : "Search by meaning"}
            </label>
            <input
              id="word-search"
              ref={searchInputRef}
              type="text"
              placeholder={
                searchType === "word" ? "Search by word" : "Search by meaning"
              }
              value={searchValue}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchInputKeyDown}
              onBlur={handleSearchInputBlur}
              onFocus={() => {
                if (suggestions.length > 0 && searchValue.trim().length >= 2) {
                  setSuggestionsOpen(true);
                }
              }}
              className="border border-gray-600 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 w-full pl-12 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
              aria-label={
                searchType === "word" ? "Search by word" : "Search by meaning "
              }
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls="word-search-suggestions"
              aria-autocomplete="list"
              autoComplete="off"
            />
            <IoSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
              size={22}
              aria-hidden="true"
            />
          </div>

          {/* In normal document flow (not absolutely positioned) so it pushes
              the table down instead of floating over it and hiding rows. */}
          {suggestionsOpen && suggestions.length > 0 && (
            <ul
              id="word-search-suggestions"
              role="listbox"
              className="relative z-30 max-h-60 overflow-y-auto rounded-xl border border-gray-600 bg-gray-900/95 backdrop-blur-sm shadow-xl"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === highlightedSuggestionIndex}
                  onMouseDown={(event) => {
                    // preventDefault keeps the input focused so blur never
                    // fires, avoiding any race with the click.
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                  className={`px-4 py-2 cursor-pointer text-sm truncate ${
                    index === highlightedSuggestionIndex
                      ? "bg-blue-600/30 text-white"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                >
                  {suggestion.isFuzzy ? (
                    <span className="italic text-amber-300">
                      Did you mean{" "}
                      <span className="font-semibold not-italic text-amber-200">
                        {searchType === "meaning" && suggestion.meaning?.[0]
                          ? suggestion.meaning[0]
                          : suggestion.value}
                      </span>
                      ?
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">{suggestion.value}</span>
                      {suggestion.meaning?.[0] && (
                        <span className="text-gray-400">
                          {" "}
                          — {suggestion.meaning[0]}
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* =====select search type======== */}

        {/* Level Select */}
        <div className="w-full ">
          <div className="flex justify-center md:justify-start">
            <label htmlFor="level-select" className="sr-only">
              Filter by level
            </label>
            <SimpleFilterDropdown
              id="level-select"
              ariaLabel="Filter words by level"
              placeholder="All Levels"
              displayLabel={selectedLevel || "All Levels"}
              selectedValue={selectedLevel}
              onSelect={handleLevelChange}
              items={levelItems}
            />
          </div>
        </div>

        {/* Topic Select */}
        <div className="w-full ">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <label htmlFor="topic-select" className="sr-only">
              Filter by topic
            </label>
            <SimpleFilterDropdown
              id="topic-select"
              ariaLabel="Filter words by topic"
              placeholder={
                selectedLevel
                  ? `Topics for ${selectedLevel}`
                  : "All Topics (TELC)"
              }
              displayLabel={
                selectedTopic ||
                (selectedLevel ? `Topics for ${selectedLevel}` : "All Topics ")
              }
              selectedValue={selectedTopic}
              onSelect={handleTopicChange}
              items={topicItems}
            />
          </div>
        </div>

        <div className="w-full ">
          <div className="flex justify-center md:justify-start">
            <label htmlFor="part-of-speech-select" className="sr-only">
              Filter by part of speech
            </label>

            <PartOfSpeechDropdown
              selectedPartOfSpeech={selectedPartOfSpeech}
              selectedVerbFilter={selectedVerbFilter}
              selectedPrepositionFilter={selectedPrepositionFilter}
              selectedAdjectiveFilter={selectedAdjectiveFilter}
              onSelectPartOfSpeech={handlePartOfSpeechChange}
              onSelectVerbFilter={handleVerbFilterChange}
              onSelectPrepositionFilter={handlePrepositionFilterChange}
              onSelectAdjectiveFilter={handleAdjectiveFilterChange}
              partOfSpeechOptions={partOfSpeechOptions}
              notSpecifiedValue={NOT_SPECIFIED_PART_OF_SPEECH}
            />
          </div>
        </div>
      </div>

      {/* Pagination and controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        toggleLearningMode={toggleLearningMode}
        learningMode={learningMode}
        setAction={setShowActionColumn}
        showAction={showActionColumn}
        totalWords={displayedWordsCount}
      />

      {/* Table content */}
      {isLoading ? (
        <div className="flex justify-center items-center mt-24 min-h-[45vh] md:min-h-[55vh] lg:min-h-[55vh] ">
          <Loader loading={isLoading} />
        </div>
      ) : (
        <div className=" min-h-screen  rounded-2xl p-0 md:p-1 lg:p-1">
          <div className="flex items-center justify-end gap-2 mb-2 px-2 relative">
            {isRefreshingPage && paginatedWords.length > 0 && (
              <span className="text-xs  px-3 py-0 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 whitespace-nowrap">
                Loading page...
              </span>
            )}
            <IoInformationCircleOutline
              size={22}
              className="text-blue-400 cursor-pointer hover:text-blue-500 transition "
              onClick={(e) => {
                e.stopPropagation(); // prevent the click from closing immediately
                setShowInfo((prev) => !prev);
              }}
            />

            {showInfo && (
              <div className="absolute top-8 right-0 z-50 w-10/12 md:w-6/12 p-3 rounded-lg bg-gray-900 text-gray-200 text-sm shadow-xl border border-gray-700 italic">
                Please be aware that certain word meanings are context-dependent
                and sourced from official TELC PDF materials. Words may have
                additional meanings not listed here. Entries are updated
                regularly as needed. Thank you for your understanding.
              </div>
            )}
          </div>
          <div className="overflow-x-auto  border-gray-700/50 rounded-2xl shadow-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 dark:bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-sm md:text-xl lg:text-xl text-white">
                  <th className="py-3  text-sm md:text-lg lg:text-lg text-center text-orange-400 font-bold w-[5%] md:w-[3%] lg:w-[3%] rounded-tl-xl border-l  border-gray-800">
                    {/* Art. */}
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-blue-400 font-bold w-[15%] md:w-[10%] lg:w-[10%] border-b">
                    Word
                  </th>

                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-purple-400 font-bold w-[10%] md:w-[25%] lg:w-[25%] border-b">
                    Meaning
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-violet-400 font-bold w-[3%] md:w-[5%] lg:w-[5%] border-b">
                    Conju.
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-cyan-400 font-bold hidden md:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Synonym
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-pink-400 font-bold hidden lg:table-cell xl:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Antonym
                  </th>
                  <th className="border-l py-3 border-gray-700 border-dotted text-center text-green-400 font-bold hidden lg:table-cell w-[15%] md:w-[20%] lg:w-[20%] border-b">
                    Word to Watch
                  </th>
                  <th className="border-l border-dotted hidden md:table-cell lg:table-cell py-3 border-gray-700 text-sm md:text-lg lg:text-lg text-center text-yellow-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b">
                    Level
                  </th>
                  <th
                    className={`border-l py-3 border-dotted border-gray-700 text-center text-indigo-400 font-bold border-b ${
                      showActionColumn ? "table-cell" : "hidden"
                    } `}
                  >
                    Action
                  </th>
                  <th
                    className={`border-r border-l border-dotted border-gray-700 text-sm md:text-lg lg:text-lg py-3 text-center text-red-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b ${
                      !userLoggedIn ? "rounded-tr-xl" : ""
                    }`}
                  >
                    ❤️
                  </th>
                  {userLoggedIn && isAdmin && (
                    <>
                      <th className="border-l py-3 border-dotted hidden md:table-cell lg:table-cell border-gray-700 text-sm md:text-lg lg:text-lg text-center text-teal-400 font-bold w-[3%] md:w-[3%] lg:w-[3%] border-b rounded-tr-xl">
                        #
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {paginatedWords.length > 0 ? (
                  paginatedWords.map((word, index) => (
                    <WordTableRow
                      key={word.id}
                      word={word}
                      index={index}
                      learningMode={learningMode}
                      currentIndex={currentIndex}
                      revealedWords={revealedWords}
                      showActionColumn={showActionColumn}
                      canManageWords={isAdmin}
                      userLoggedIn={userLoggedIn}
                      favorites={favorites}
                      loadingFavorites={loadingFavorites}
                      loadingParagraphs={loadingParagraphs}
                      loadingConjugations={loadingConjugations}
                      focusElement={focusElement}
                      revealMeaning={revealMeaning}
                      openModal={openModal}
                      generateParagraph={generateParagraph}
                      handleConjugate={handleConjugate}
                      handleArrowKeyPress={handleArrowKeyPress}
                      openWordInModal={openWordInModal}
                      handleDelete={handleDelete}
                      toggleFavorite={toggleFavorite}
                      setSelectedHistory={setSelectedHistory}
                      setIsHistoryModalOpen={setIsHistoryModalOpen}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4 font-bold text-gray-500 h-96 align-middle text-xl sm:text-2xl"
                    >
                      No words available. Will be added soon!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedWord && (
        <Suspense fallback={<div />}>
          <WordListModal
            isOpen={isModalOpen}
            closeModal={closeModal}
            selectedWord={selectedWord}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            loadingFavorites={loadingFavorites}
          />
        </Suspense>
      )}

      {/* Bottom pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        toggleLearningMode={toggleLearningMode}
        learningMode={learningMode}
        setAction={setShowActionColumn}
        showAction={showActionColumn}
        totalWords={displayedWordsCount}
      />

      {/* ========= */}
      {isHistoryModalOpen && (
        <Suspense fallback={<div />}>
          <HistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            creator={selectedHistory.creator}
            modifiers={selectedHistory.modifiers}
          />
        </Suspense>
      )}
      {/* ========= */}
      {/* =======AI modal=============== */}
      {isAIModalOpen && (
        <Suspense fallback={<div />}>
          <AIModal
            key={aiWord?.id || "ai-modal"}
            isOpen={isAIModalOpen}
            aiWord={aiWord}
            selectedParagraph={selectedParagraph}
            onWordUpdated={handleAiWordUpdated}
            onClose={() => setIsAIModalOpen(false)}
          />
        </Suspense>
      )}

      {/* =======Conjugation modal=============== */}
      {isConjugationModalOpen && (
        <Suspense fallback={<div />}>
          <ConjugationModal
            isOpen={isConjugationModalOpen}
            word={conjugationWord}
            data={conjugationData}
            isLoading={
              conjugationWord
                ? !!loadingConjugations[conjugationWord.id]
                : false
            }
            error={conjugationError}
            userId={userId}
            isAdmin={isAdmin}
            alreadyReported={
              conjugationWord
                ? reportedConjugations.current.has(
                    conjugationWord.value?.toLowerCase().trim(),
                  )
                : false
            }
            onReported={(verb) => reportedConjugations.current.add(verb)}
            onAdminRegenerate={
              isAdmin
                ? async (customPrompt) => {
                    if (!conjugationWord) return;
                    const cacheKey = conjugationWord.value
                      ?.toLowerCase()
                      .trim();
                    delete conjugationCache.current[cacheKey];
                    setConjugationData(null);
                    setConjugationError(null);
                    setLoadingConjugations((prev) => ({
                      ...prev,
                      [conjugationWord.id]: true,
                    }));
                    try {
                      const res = await aiApi.post("/conjugations/regenerate", {
                        verb: cacheKey,
                        customPrompt: customPrompt || undefined,
                      });
                      const data = res.data?.data;
                      conjugationCache.current[cacheKey] = data;
                      setConjugationData(data);
                    } catch {
                      setConjugationError(
                        "Regeneration failed. Please try again.",
                      );
                    } finally {
                      setLoadingConjugations((prev) => ({
                        ...prev,
                        [conjugationWord.id]: false,
                      }));
                    }
                  }
                : undefined
            }
            onClose={() => {
              setIsConjugationModalOpen(false);
              setConjugationData(null);
              setConjugationError(null);
            }}
          />
        </Suspense>
      )}

      {/* ===================report========= */}
    </Container>
  );
};

export default WordList;
