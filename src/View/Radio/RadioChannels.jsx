import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  VolumeX,
  Volume2,
} from "lucide-react";
import { RiRadioFill } from "react-icons/ri";
import Container from "../../utils/Container";
import { useTheme } from "../../context/ThemeContext";

const RADIO_API_URLS = [
  "https://de1.api.radio-browser.info/json/stations/byname/deutschland",
  "https://de2.api.radio-browser.info/json/stations/byname/deutschland",
];
const CUSTOM_STATIONS = [
  {
    stationuuid: "custom-radio-unicc",
    name: "Radio UNiCC",
    url: "https://stream.radio-unicc.de:8000/unicc_hq.mp3",
    url_resolved: "https://stream.radio-unicc.de:8000/unicc_hq.mp3",
    homepage: "https://www.radio-unicc.de",
    favicon: "",
    country: "Germany",
    state: "Saxony",
    language: "German",
    tags: "campus,student,radio",
    codec: "MP3",
    bitrate: 0,
    votes: 0,
    clickcount: 0,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
];
const STATIONS_PER_PAGE = 12;

const normalizeText = (value) => String(value || "").trim();

const toTagList = (value) =>
  normalizeText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

const formatNumber = (value) =>
  Number.isFinite(value) ? new Intl.NumberFormat().format(value) : "0";

const getComparableBitrate = (bitrate) => (bitrate > 0 ? bitrate : -1);

const canUseStreamUrl = (streamUrl) => {
  const normalizedUrl = normalizeText(streamUrl);

  if (!normalizedUrl) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  const pageProtocol = window.location.protocol;

  if (pageProtocol !== "https:") {
    return true;
  }

  return normalizedUrl.startsWith("https://");
};

const STREAM_SUFFIX_PATTERNS = [
  /\s*\|\s*(?:aac|mp3|opus|ogg|mpeg)\s*\d+\s*k(?:bit\/s|bps)?\s*$/i,
  /\s*\|\s*\d+\s*k(?:bit\/s|bps)?\s*(?:aac|mp3|opus|ogg|mpeg)?\s*$/i,
  /\s*[-|]\s*(?:aac|mp3|opus|ogg|mpeg)\s*$/i,
];

const CHANNEL_ALIAS_RULES = [
  {
    pattern: /^deutschland(?:radio\s+kultur|funk\s+kultur)(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk Kultur",
  },
  {
    pattern: /^deutschland(?:funk\s+nachrichten|radio\s+nachrichten)$/i,
    canonicalName: "Deutschlandfunk Nachrichten",
  },
  {
    pattern:
      /^deutschland(?:funk(?:\s+dokumente\s+und\s+debatten)?|radio)(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk",
  },
  {
    pattern: /^deutschland(?:funk|radio)\s+nova(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk Nova",
  },
  {
    pattern: /^radio\s*b2(?:\s*-\s*deutschland|\s+deutschland)?$/i,
    canonicalName: "Radio B2 Deutschland",
  },
  {
    pattern:
      /^rtl(?:\s+radio)?\s*-?\s*deutschlands\s+hit-radio(?:\s*\/\s*regional(?:\s*rtl)?)?$/i,
    canonicalName: "RTL - Deutschlands Hit-Radio",
  },
  {
    pattern: /^bigfm\s+deutschland(?:\s+original)?$/i,
    canonicalName: "bigFM Deutschland",
  },
];

const BLOCKED_CHANNEL_PATTERNS = [/^nostalgie\s+deutschland\s+80er$/i];

const PREFERRED_LIVE_CHANNELS = {
  Deutschlandfunk: {
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf",
  },
  "Deutschlandfunk Kultur": {
    streamUrl: "https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf-kultur",
  },
  "Deutschlandfunk Nova": {
    streamUrl: "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf-nova",
  },
};

const PINNED_CHANNEL_ORDER = {
  "radio unicc": 0,
  deutschlandfunk: 1,
  "deutschlandfunk nachrichten": 2,
  "deutschlandfunk kultur": 3,
  "deutschlandfunk nova": 4,
};

const normalizeChannelName = (value) => {
  let normalizedName = normalizeText(value);

  for (const pattern of STREAM_SUFFIX_PATTERNS) {
    normalizedName = normalizedName.replace(pattern, "").trim();
  }

  normalizedName = normalizedName.replace(/\s*\|\s*$/, "").trim();

  const aliasMatch = CHANNEL_ALIAS_RULES.find(({ pattern }) =>
    pattern.test(normalizedName),
  );

  return aliasMatch?.canonicalName || normalizedName;
};

const buildStationScore = (station) =>
  (station.favicon ? 20 : 0) +
  station.votes * 2 +
  station.clickcount * 3 +
  station.clicktrend * 4 +
  station.bitrate;

const normalizeStation = (station) => {
  const streamUrl = normalizeText(station.url_resolved || station.url);
  const rawName = normalizeText(station.name);
  const name = normalizeChannelName(rawName);

  if (
    !streamUrl ||
    !canUseStreamUrl(streamUrl) ||
    !name ||
    station.lastcheckok === 0 ||
    BLOCKED_CHANNEL_PATTERNS.some((pattern) => pattern.test(name))
  ) {
    return null;
  }

  return {
    id:
      normalizeText(station.stationuuid) ||
      `${name.toLowerCase()}-${streamUrl.toLowerCase()}`,
    name,
    rawName,
    streamUrl,
    homepage: normalizeText(station.homepage),
    favicon: normalizeText(station.favicon),
    country: normalizeText(station.country) || "Germany",
    state: normalizeText(station.state),
    language: normalizeText(station.language) || "German",
    tags: toTagList(station.tags),
    codec: normalizeText(station.codec) || "Unknown",
    bitrate: Number(station.bitrate) || 0,
    votes: Number(station.votes) || 0,
    clickcount: Number(station.clickcount) || 0,
    clicktrend: Number(station.clicktrend) || 0,
    hasExtendedInfo: Boolean(station.has_extended_info),
  };
};

const getChannelKey = (station) => {
  return station.name.toLowerCase().replace(/\s+/g, " ");
};

const buildStreamOption = (station) => ({
  id: `${station.id}-${station.codec.toLowerCase()}-${station.bitrate || "variable"}`,
  streamUrl: station.streamUrl,
  bitrate: station.bitrate,
  codec: station.codec,
  votes: station.votes,
  clickcount: station.clickcount,
  clicktrend: station.clicktrend,
  score: buildStationScore(station),
});

const buildPreferredLiveStream = (channelName) => {
  const liveChannel = PREFERRED_LIVE_CHANNELS[channelName];

  if (!liveChannel) {
    return null;
  }

  return {
    id: liveChannel.streamId,
    streamUrl: liveChannel.streamUrl,
    bitrate: liveChannel.bitrate,
    codec: liveChannel.codec,
    votes: 0,
    clickcount: 0,
    clicktrend: 0,
    score: 100000,
  };
};

const groupStations = (stations) => {
  const channelMap = new Map();

  for (const rawStation of stations) {
    const station = normalizeStation(rawStation);

    if (!station) {
      continue;
    }

    const channelKey = getChannelKey(station);
    const existingChannel = channelMap.get(channelKey);

    if (!existingChannel) {
      channelMap.set(channelKey, {
        id: channelKey,
        name: station.name,
        homepage: station.homepage,
        favicon: station.favicon,
        country: station.country,
        state: station.state,
        language: station.language,
        tags: [...station.tags],
        votes: station.votes,
        clickcount: station.clickcount,
        clicktrend: station.clicktrend,
        hasExtendedInfo: station.hasExtendedInfo,
        streams: [buildStreamOption(station)],
      });
      continue;
    }

    const currentScore = buildStationScore(station);
    const existingScore =
      existingChannel.votes * 2 +
      existingChannel.clickcount * 3 +
      existingChannel.clicktrend * 4 +
      (existingChannel.favicon ? 20 : 0);

    if (currentScore > existingScore) {
      existingChannel.name = station.name;
      existingChannel.homepage = station.homepage || existingChannel.homepage;
      existingChannel.favicon = station.favicon || existingChannel.favicon;
      existingChannel.country = station.country;
      existingChannel.state = station.state;
      existingChannel.language = station.language;
      existingChannel.votes = station.votes;
      existingChannel.clickcount = station.clickcount;
      existingChannel.clicktrend = station.clicktrend;
      existingChannel.hasExtendedInfo = station.hasExtendedInfo;
    }

    existingChannel.tags = Array.from(
      new Set([...existingChannel.tags, ...station.tags]),
    ).slice(0, 4);

    const nextStream = buildStreamOption(station);
    const existingStreamIndex = existingChannel.streams.findIndex(
      (stream) =>
        stream.bitrate === nextStream.bitrate &&
        stream.codec === nextStream.codec,
    );

    if (existingStreamIndex === -1) {
      existingChannel.streams.push(nextStream);
    } else if (
      nextStream.score > existingChannel.streams[existingStreamIndex].score
    ) {
      existingChannel.streams[existingStreamIndex] = nextStream;
    }
  }

  return Array.from(channelMap.values())
    .map((channel) => ({
      ...channel,
      streams: (() => {
        const preferredLiveStream = buildPreferredLiveStream(channel.name);
        const baseStreams = [...channel.streams];

        if (preferredLiveStream) {
          const existingStreamIndex = baseStreams.findIndex(
            (stream) => stream.streamUrl === preferredLiveStream.streamUrl,
          );

          if (existingStreamIndex >= 0) {
            baseStreams[existingStreamIndex] = {
              ...baseStreams[existingStreamIndex],
              ...preferredLiveStream,
            };
          } else {
            baseStreams.unshift(preferredLiveStream);
          }
        }

        return baseStreams.sort((left, right) => {
          if (
            getComparableBitrate(right.bitrate) !==
            getComparableBitrate(left.bitrate)
          ) {
            return (
              getComparableBitrate(right.bitrate) -
              getComparableBitrate(left.bitrate)
            );
          }

          return right.score - left.score;
        });
      })(),
    }))
    .sort((left, right) => {
      const leftPinnedRank =
        PINNED_CHANNEL_ORDER[left.name.toLowerCase()] ??
        Number.POSITIVE_INFINITY;
      const rightPinnedRank =
        PINNED_CHANNEL_ORDER[right.name.toLowerCase()] ??
        Number.POSITIVE_INFINITY;

      if (leftPinnedRank !== rightPinnedRank) {
        return leftPinnedRank - rightPinnedRank;
      }

      if (right.votes !== left.votes) {
        return right.votes - left.votes;
      }

      if (right.clickcount !== left.clickcount) {
        return right.clickcount - left.clickcount;
      }

      const rightTopBitrate = getComparableBitrate(
        right.streams[0]?.bitrate || 0,
      );
      const leftTopBitrate = getComparableBitrate(
        left.streams[0]?.bitrate || 0,
      );

      if (rightTopBitrate !== leftTopBitrate) {
        return rightTopBitrate - leftTopBitrate;
      }

      return left.name.localeCompare(right.name);
    });
};

const getDefaultStream = (channel) => channel?.streams?.[0] || null;

const getNextChannelStream = (channel, currentStreamId) => {
  if (!channel?.streams?.length) {
    return null;
  }

  const currentIndex = channel.streams.findIndex(
    (stream) => stream.id === currentStreamId,
  );

  if (currentIndex === -1) {
    return null;
  }

  return channel.streams[currentIndex + 1] || null;
};

const getChannelStream = (channel, streamSelections) => {
  if (!channel) {
    return null;
  }

  const selectedStreamId = streamSelections[channel.id];

  return (
    channel.streams.find((stream) => stream.id === selectedStreamId) ||
    getDefaultStream(channel)
  );
};

const fetchStationsFromMirror = async (signal) => {
  let lastError = null;

  for (const url of RADIO_API_URLS) {
    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError || new Error("All radio mirrors failed.");
};

const RadioChannels = () => {
  const { theme } = useTheme();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedStreams, setSelectedStreams] = useState({});
  const [brokenFavicons, setBrokenFavicons] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [volume, setVolume] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const audioRef = useRef(null);
  const selectedStationRef = useRef(null);
  const selectedStreamsRef = useRef({});
  const lastNonZeroVolumeRef = useRef(1);

  useEffect(() => {
    selectedStationRef.current = selectedStation;
    selectedStreamsRef.current = selectedStreams;
  }, [selectedStation, selectedStreams]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;

    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      const currentStation = selectedStationRef.current;
      const currentSelections = selectedStreamsRef.current;
      const currentStream = getChannelStream(currentStation, currentSelections);
      const fallbackStream = getNextChannelStream(
        currentStation,
        currentStream?.id,
      );

      if (currentStation && fallbackStream) {
        const fallbackLabel =
          fallbackStream.bitrate > 0
            ? `${fallbackStream.bitrate} kbps`
            : "variable bitrate";

        setPlayerError(
          `Primary stream failed. Switched to ${fallbackStream.codec} ${fallbackLabel}.`,
        );
        setSelectedStreams((previous) => ({
          ...previous,
          [currentStation.id]: fallbackStream.id,
        }));
        return;
      }

      setIsPlaying(false);
      setPlayerError("This stream could not be played in your browser.");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadStations = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchStationsFromMirror(controller.signal);
        const mergedStations = [
          ...CUSTOM_STATIONS,
          ...(Array.isArray(data) ? data : []),
        ];
        const nextStations = groupStations(mergedStations);

        setStations(nextStations);
        setBrokenFavicons({});
        setSelectedStreams(
          nextStations.reduce((accumulator, channel) => {
            const defaultStream = getDefaultStream(channel);

            if (defaultStream) {
              accumulator[channel.id] = defaultStream.id;
            }

            return accumulator;
          }, {}),
        );
        setCurrentPage(1);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }

        setError(
          "Radio channels could not be loaded from either mirror right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadStations();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const audio = audioRef.current;
    const selectedStream = getChannelStream(selectedStation, selectedStreams);

    if (!audio || !selectedStream?.streamUrl) {
      return;
    }

    const playSelectedStation = async () => {
      try {
        setPlayerError("");

        if (audio.src !== selectedStream.streamUrl) {
          audio.src = selectedStream.streamUrl;
          audio.load();
        }

        await audio.play();
      } catch {
        setIsPlaying(false);
        setPlayerError("Playback was blocked or the stream is unavailable.");
      }
    };

    void playSelectedStation();
  }, [selectedStation, selectedStreams]);

  const totalPages = Math.max(
    1,
    Math.ceil(stations.length / STATIONS_PER_PAGE),
  );
  const shouldShowPagination = stations.length > STATIONS_PER_PAGE;

  const visibleStations = useMemo(() => {
    if (!shouldShowPagination) {
      return stations;
    }

    const startIndex = (currentPage - 1) * STATIONS_PER_PAGE;
    return stations.slice(startIndex, startIndex + STATIONS_PER_PAGE);
  }, [currentPage, shouldShowPagination, stations]);

  const paginationNumbers = useMemo(() => {
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    const pages = [];

    for (let page = Math.max(1, endPage - 4); page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const handlePlayToggle = async (station) => {
    const audio = audioRef.current;
    const selectedStream = getChannelStream(station, selectedStreams);

    if (!audio || !selectedStream?.streamUrl) {
      return;
    }

    if (selectedStation?.id === station.id) {
      if (!audio.paused) {
        audio.pause();
        return;
      }

      try {
        setPlayerError("");
        await audio.play();
      } catch {
        setPlayerError("Playback was blocked or the stream is unavailable.");
      }

      return;
    }

    setSelectedStation(station);
  };

  const handleStreamSelect = (station, streamId) => {
    setSelectedStreams((previous) => ({
      ...previous,
      [station.id]: streamId,
    }));

    if (selectedStation?.id === station.id) {
      setSelectedStation(station);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markFaviconAsBroken = (stationId) => {
    setBrokenFavicons((previous) => ({
      ...previous,
      [stationId]: true,
    }));
  };

  const handleNowPlayingToggle = async () => {
    const audio = audioRef.current;

    if (!audio || !selectedStation) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      setPlayerError("");
      await audio.play();
    } catch {
      setPlayerError("Playback was blocked or the stream is unavailable.");
    }
  };

  const handleMuteToggle = () => {
    if (volume === 0) {
      setVolume(lastNonZeroVolumeRef.current || 1);
      return;
    }

    setVolume(0);
  };

  const isLight = theme === "light";
  const activeStream = getChannelStream(selectedStation, selectedStreams);

  return (
    // <div
    //   className={`min-h-screen py-8 md:py-12 ${
    //     isLight
    //       ? "bg-[radial-gradient(circle_at_top,#fff1d6_0%,#fff7e9_26%,#f6f1ea_60%,#eef4ff_100%)] text-slate-900"
    //       : "bg-[radial-gradient(circle_at_top,#1f2937_0%,#111827_28%,#020617_100%)] text-white"
    //   }`}
    // >
    <div
      className={`min-h-screen py-2 md:py-2 lg:py-12  ${
        isLight ? "text-slate-900" : " text-white"
      }`}
    >
      <Container>
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(249,115,22,0.16),rgba(236,72,153,0.12),rgba(59,130,246,0.14))] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur md:p-10">
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                <RiRadioFill className="h-4 w-4" />
                Live radio channels
              </div>

              <h1 className="max-w-3xl  font-black leading-tight text-2xl md:text-6xl text-center md:text-center lg:text-left">
                German radio channels for listening practice
              </h1>

              {/* <p
                className={`mt-5 max-w-3xl text-base leading-7 md:text-lg ${
                  isLight ? "text-slate-700" : "text-slate-200"
                }`}
              >
                Explore live stations from the Radio Browser directory, open the
                stream in one tap, and move through the catalog with clean
                pagination. Each card highlights the station name, region,
                language, codec, votes, and quick actions.
              </p> */}

              <div className="mt-8 flex justify-center md:justify-center  lg:justify-normal  gap-3">
                <div className="rounded-2xl  bg-white/10 px-2 md:px-4 lg:px-4 py-3 shadow-lg backdrop-blur text-center">
                  <div className="text-xs uppercase tracking-[0.10em] md:tracking-[0.18em] lg:tracking-[0.18em] text-orange-600">
                    Stations loaded
                  </div>
                  <div className="mt-2 text-2xl font-bold ">
                    {stations.length}
                  </div>
                </div>
                <div className="rounded-2xl  bg-white/10 px-4 py-3 shadow-lg backdrop-blur text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-orange-600">
                    Pages
                  </div>
                  <div className="mt-2 text-2xl font-bold">{totalPages}</div>
                </div>
                <div className="rounded-2xl  bg-white/10 px-4 py-3 shadow-lg backdrop-blur text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-orange-600">
                    Source
                  </div>
                  <div className="mt-2 text-sm font-semibold">Online Radio</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-sky-600 bg-slate-950/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                    Now playing
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {selectedStation?.name || "Select a station"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {selectedStation
                      ? `${selectedStation.country}${selectedStation.state ? `, ${selectedStation.state}` : ""}`
                      : "Use the play button on any station card to start streaming."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200 transition-colors hover:bg-orange-500/25"
                  aria-label={volume === 0 ? "Unmute volume" : "Mute volume"}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-7 w-7" />
                  ) : (
                    <Volume2 className="h-7 w-7" />
                  )}
                </button>
              </div>

              <audio ref={audioRef} preload="none" className="hidden" />

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={handleNowPlayingToggle}
                    disabled={!selectedStation}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      isPlaying
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                        : "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20"
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "Pause live radio" : "Play live radio"}
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-xs">
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-slate-300" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-slate-300" />
                    )}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                      className="w-full accent-orange-500"
                      aria-label="Radio volume"
                    />
                  </div>
                </div>
              </div>

              {playerError ? (
                <p className="mt-3 text-sm text-rose-300">{playerError}</p>
              ) : null}

              {selectedStation ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                    {isPlaying ? "Live" : "Ready"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                    {activeStream?.codec || "Unknown"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                    {activeStream?.bitrate > 0
                      ? `${activeStream.bitrate} kbps`
                      : "Variable bitrate"}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 mx-4 ">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              isLight
                ? "border-slate-300 bg-white/80 text-slate-700 hover:bg-white"
                : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to home
          </Link>

          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              isLight
                ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border-orange-400/25 bg-orange-500/10 text-orange-200 hover:bg-orange-500/15"
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh stations
          </button>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: STATIONS_PER_PAGE }).map((_, index) => (
              <div
                key={`radio-skeleton-${index}`}
                className={`h-[295px] animate-pulse rounded-[28px] border ${
                  isLight
                    ? "border-slate-200 bg-white/80"
                    : "border-white/10 bg-white/5"
                }`}
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div
            className={`mt-10 rounded-[28px] border p-6 text-center ${
              isLight
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-rose-400/25 bg-rose-500/10 text-rose-200"
            }`}
          >
            <p className="text-lg font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-rose-600"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3 ">
              {visibleStations.map((station) => {
                const isActive = selectedStation?.id === station.id;
                const activeStreamId = selectedStreams[station.id];
                const currentStream = getChannelStream(
                  station,
                  selectedStreams,
                );
                const showFavicon =
                  Boolean(station.favicon) && !brokenFavicons[station.id];

                return (
                  <article
                    key={station.id}
                    className={` group relative overflow-hidden rounded-[30px] border  p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)]  ${
                      isLight
                        ? "border-slate-200 bg-[linear-gradient(155deg,#ffffff_0%,#fff8ee_52%,#f1f7ff_100%)]"
                        : "border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,0.92)_0%,rgba(30,41,59,0.92)_48%,rgba(17,24,39,0.95)_100%)]"
                    }`}
                  >
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-400/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative z-10 flex h-full flex-col ">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          {showFavicon ? (
                            <img
                              src={station.favicon}
                              alt={station.name}
                              className="h-14 w-14 rounded-2xl border border-white/10 object-cover bg-white"
                              loading="lazy"
                              onError={() => markFaviconAsBroken(station.id)}
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/25 via-pink-400/20 to-sky-400/20 text-orange-200">
                              <RiRadioFill className="h-8 w-8 text-sky-500" />
                            </div>
                          )}

                          <div className="min-w-0 ">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
                              <RiRadioFill className="h-3.5 w-3.5" />
                              Germany stream
                            </div>
                            <h2
                              className={`mt-3 line-clamp-2 text-lg md:text-lg lg:text-xl font-bold ${
                                isLight ? "text-slate-900" : "text-white"
                              }`}
                            >
                              {station.name}
                            </h2>
                          </div>
                        </div>

                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {formatNumber(station.votes)} votes
                        </div>
                      </div>

                      <div
                        className={`mt-5 grid grid-cols-2 gap-3 text-sm ${
                          isLight ? "text-slate-700" : "text-slate-200"
                        }`}
                      >
                        <div className="rounded-2xl border border-cyan-700 bg-white/6 p-3">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-orange-300">
                            <MapPin className="h-3.5 w-3.5" />
                            Region
                          </div>
                          <div className="mt-2 font-semibold">
                            {station.state || station.country}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-700 bg-white/6 p-3">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-sky-300">
                            <Globe className="h-3.5 w-3.5" />
                            Language
                          </div>
                          <div className="mt-2 font-semibold">
                            {station.language}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-700 bg-white/6 p-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-pink-300">
                            Codec
                          </div>
                          <div className="mt-2 font-semibold">
                            {currentStream?.codec || "Unknown"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-700 bg-white/6 p-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-emerald-300">
                            Bitrate
                          </div>
                          <div className="mt-2 font-semibold">
                            {currentStream?.bitrate > 0
                              ? `${currentStream.bitrate} kbps`
                              : "Unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div
                          className={`mb-3 text-xs font-semibold uppercase tracking-[0.16em] ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          Available bitrates
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {station.streams.map((stream) => {
                            const isSelected = activeStreamId === stream.id;

                            return (
                              <button
                                key={stream.id}
                                type="button"
                                onClick={() =>
                                  handleStreamSelect(station, stream.id)
                                }
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                                  isSelected
                                    ? "border-cyan-500 bg-gradient-to-r from-gray-500 to-cyan-500 text-white shadow-lg shadow-orange-500/20"
                                    : isLight
                                      ? "border-slate-200 bg-white/85 text-slate-600 hover:border-orange-300"
                                      : "border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/40"
                                }`}
                              >
                                {stream.codec}{" "}
                                {stream.bitrate > 0
                                  ? `${stream.bitrate} kbps`
                                  : "Variable"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 mb-4 ">
                        {station.tags.length ? (
                          station.tags.map((tag) => (
                            <span
                              key={`${station.id}-${tag}`}
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                isLight
                                  ? "border-slate-200 bg-white/80 text-slate-600"
                                  : "border-white/10 bg-white/5 text-slate-300"
                              }`}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              isLight
                                ? "border-slate-200 bg-white/80 text-slate-500"
                                : "border-white/10 bg-white/5 text-slate-400"
                            }`}
                          >
                            No tags available
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-end gap-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handlePlayToggle(station)}
                          className={`inline-flex  items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            isActive && isPlaying
                              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                              : "bg-gradient-to-r from-sky-500 to-purple-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                          }`}
                        >
                          {isActive && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isActive && isPlaying ? "Pause" : "Play stream"}
                        </button>

                        {/* {station.homepage ? (
                          <a
                            href={station.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                              isLight
                                ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                                : "border-white/10 text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            Visit site
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null} */}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!visibleStations.length ? (
              <div
                className={`mt-10 rounded-[28px] border p-8 text-center ${
                  isLight
                    ? "border-slate-200 bg-white/85 text-slate-700"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                No radio channels are available for this page.
              </div>
            ) : null}

            {shouldShowPagination ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isLight
                      ? "border-slate-300 bg-white/90 text-slate-700 hover:bg-white"
                      : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {paginationNumbers.map((page) => (
                  <button
                    key={`radio-page-${page}`}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`h-11 min-w-11 rounded-full px-4 text-sm font-bold transition-all ${
                      page === currentPage
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25"
                        : isLight
                          ? "border border-slate-300 bg-white/90 text-slate-700 hover:bg-white"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isLight
                      ? "border-slate-300 bg-white/90 text-slate-700 hover:bg-white"
                      : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </Container>
    </div>
  );
};

export default RadioChannels;
