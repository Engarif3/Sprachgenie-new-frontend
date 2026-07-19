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
import { useRadioPlayer } from "../../context/RadioPlayerContext";
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
  {
    stationuuid: "custom-radio-1live",
    name: "1LIVE",
    url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    homepage: "https://einslive.de/",
    favicon:
      "https://www1.wdr.de/radio/1live/resources/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "ard,public radio,rock,top 40",
    codec: "MP3",
    bitrate: 128,
    votes: 31736,
    clickcount: 246,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr2",
    name: "WDR 2",
    url: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr2/",
    favicon:
      "https://www1.wdr.de/resources-v5.139.1/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "music,news,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 6861,
    clickcount: 54,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr4",
    name: "WDR 4",
    url: "https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr4/index.html",
    favicon: "https://www1.wdr.de/resources/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "schlager,pop,hits",
    codec: "MP3",
    bitrate: 128,
    votes: 5225,
    clickcount: 37,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr5",
    name: "WDR 5",
    url: "https://wdr-wdr5-live.icecastssl.wdr.de/wdr/wdr5/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr5-live.icecastssl.wdr.de/wdr/wdr5/live/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr5/",
    favicon:
      "https://www1.wdr.de/resources-v5.134.1/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "information,news,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 23556,
    clickcount: 180,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ndr2",
    name: "NDR 2",
    url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    url_resolved:
      "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    homepage: "https://www.ndr.de/ndr2/",
    favicon: "https://www.ndr.de/apple-touch-icon-120x120.png",
    country: "Germany",
    state: "Niedersachsen",
    language: "German",
    tags: "pop,hits",
    codec: "MP3",
    bitrate: 128,
    votes: 4500,
    clickcount: 40,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ndrinfo",
    name: "NDR Info",
    url: "https://icecast.ndr.de/ndr/ndrinfo/hamburg/mp3/128/stream.mp3",
    url_resolved:
      "https://icecast.ndr.de/ndr/ndrinfo/hamburg/mp3/128/stream.mp3",
    homepage: "https://www.ndr.de/info/",
    favicon: "https://www.ndr.de/apple-touch-icon-120x120.png",
    country: "Germany",
    state: "Hamburg",
    language: "German",
    tags: "culture,information,news,regional",
    codec: "MP3",
    bitrate: 128,
    votes: 5099,
    clickcount: 50,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-swr3",
    name: "SWR3",
    url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
    url_resolved: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
    homepage: "https://swr3.de/",
    favicon: "https://swr3.de/assets/swr3/icons/apple-touch-icon.png",
    country: "Germany",
    state: "Baden-Württemberg",
    language: "German",
    tags: "news,pop,rock",
    codec: "MP3",
    bitrate: 128,
    votes: 18518,
    clickcount: 289,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-bayern3",
    name: "Bayern 3",
    url: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid",
    url_resolved: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid",
    homepage: "https://www.br.de/radio/bayern-3/",
    favicon: "",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "top 40,pop,hits",
    codec: "MP3",
    bitrate: 96,
    votes: 4200,
    clickcount: 30,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-hr3",
    name: "hr3",
    url: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high",
    url_resolved: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high",
    homepage: "https://www.hr3.de/",
    favicon: "",
    country: "Germany",
    state: "Hessen",
    language: "German",
    tags: "pop,news",
    codec: "MP3",
    bitrate: 192,
    votes: 3800,
    clickcount: 25,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-mdraktuell",
    name: "MDR Aktuell",
    url: "https://mdr-284340-0.sslcast.mdr.de/mdr/284340/0/mp3/high/stream.mp3",
    url_resolved:
      "https://mdr-284340-0.sslcast.mdr.de/mdr/284340/0/mp3/high/stream.mp3",
    homepage: "https://mdraktuell.de/",
    favicon:
      "https://cdn.mdr.de/resources/global/img/mdrde/favicons/apple-icon-120x120.png",
    country: "Germany",
    state: "Sachsen",
    language: "German",
    tags: "information,news",
    codec: "MP3",
    bitrate: 128,
    votes: 6146,
    clickcount: 38,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-mdrklassik",
    name: "MDR Klassik",
    url: "https://mdr-284350-0.sslcast.mdr.de/mdr/284350/0/mp3/high/stream.mp3",
    url_resolved:
      "https://mdr-284350-0.sslcast.mdr.de/mdr/284350/0/mp3/high/stream.mp3",
    homepage: "https://mdrklassik.de/",
    favicon:
      "https://cdn.mdr.de/resources/global/img/mdrde/favicons/apple-icon-120x120.png",
    country: "Germany",
    state: "Sachsen",
    language: "German",
    tags: "classical",
    codec: "MP3",
    bitrate: 128,
    votes: 5470,
    clickcount: 23,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-radioeins",
    name: "radioeins",
    url: "https://dispatcher.rndfnk.com/rbb/radioeins/live/mp3/128/stream.mp3",
    url_resolved:
      "https://dispatcher.rndfnk.com/rbb/radioeins/live/mp3/128/stream.mp3",
    homepage: "https://www.radioeins.de/",
    favicon:
      "https://www.radioeins.de/content/dam/rbb/rbb/logos/touch/rad-128.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "adult contemporary,alternative,information,rock,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 12128,
    clickcount: 78,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-inforadio",
    name: "Inforadio",
    url: "https://dispatcher.rndfnk.com/rbb/inforadio/live/mp3/mid",
    url_resolved: "https://dispatcher.rndfnk.com/rbb/inforadio/live/mp3/mid",
    homepage: "https://www.inforadio.de/",
    favicon:
      "https://www.inforadio.de/content/dam/rbb/rbb/logos/touch/inf-128.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "information,news",
    codec: "MP3",
    bitrate: 96,
    votes: 11776,
    clickcount: 66,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-rbb888",
    name: "RBB 88.8",
    url: "https://dispatcher.rndfnk.com/rbb/rbb888/live/mp3/mid",
    url_resolved: "https://dispatcher.rndfnk.com/rbb/rbb888/live/mp3/mid",
    homepage: "https://www.rbb888.de/",
    favicon: "",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "hits,pop",
    codec: "MP3",
    bitrate: 96,
    votes: 3600,
    clickcount: 20,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-fritz",
    name: "Fritz",
    url: "https://dispatcher.rndfnk.com/rbb/fritz/live/mp3/128/stream.mp3",
    url_resolved:
      "https://dispatcher.rndfnk.com/rbb/fritz/live/mp3/128/stream.mp3",
    homepage: "https://www.fritz.de/",
    favicon: "",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "alternative,indie,youth",
    codec: "MP3",
    bitrate: 128,
    votes: 3400,
    clickcount: 18,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-rbbkultur",
    name: "rbbKultur",
    url: "https://dispatcher.rndfnk.com/rbb/rbbkultur/live/mp3/high",
    url_resolved: "https://dispatcher.rndfnk.com/rbb/rbbkultur/live/mp3/high",
    homepage: "https://www.rbb-online.de/rbbkultur/",
    favicon: "",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "culture,classical,jazz",
    codec: "MP3",
    bitrate: 192,
    votes: 3200,
    clickcount: 15,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-antennebayern",
    name: "Antenne Bayern",
    url: "https://mp3channels.webradio.antenne.de/antenne",
    url_resolved: "https://mp3channels.webradio.antenne.de/antenne",
    homepage: "https://www.antenne.de/",
    favicon:
      "https://www.antenne.de/logos/station-antenne-bayern/apple-touch-icon.png",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "top 40,pop",
    codec: "MP3",
    bitrate: 128,
    votes: 20970,
    clickcount: 69,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ffh",
    name: "Hit Radio FFH",
    url: "https://mp3.ffh.de/radioffh/hqlivestream.mp3",
    url_resolved: "https://mp3.ffh.de/radioffh/hqlivestream.mp3",
    homepage: "https://www.ffh.de/",
    favicon: "https://www.ffh.de/android-icon.png",
    country: "Germany",
    state: "Hessen",
    language: "German",
    tags: "pop,top 40",
    codec: "MP3",
    bitrate: 128,
    votes: 6632,
    clickcount: 56,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-rockantenne",
    name: "Rock Antenne",
    url: "https://mp3channels.webradio.rockantenne.de/rockantenne",
    url_resolved: "https://mp3channels.webradio.rockantenne.de/rockantenne",
    homepage: "https://www.rockantenne.de/",
    favicon:
      "https://www.rockantenne.de/logos/rock-antenne/apple-touch-icon.png",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "rock",
    codec: "MP3",
    bitrate: 128,
    votes: 25284,
    clickcount: 124,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-kissfm",
    name: "98.8 Kiss FM",
    url: "https://stream.kissfm.de/kissfm/mp3-128/internetradio/",
    url_resolved: "https://stream.kissfm.de/kissfm/mp3-128/internetradio/",
    homepage: "https://www.kissfm.de/",
    favicon:
      "https://upload.kissfm.de/production/static/1699276434696/icons/icon_64.be8y2280000.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "hits,pop",
    codec: "MP3",
    bitrate: 128,
    votes: 5089,
    clickcount: 14,
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

const getStationPage = (stationIndex) =>
  Math.floor(stationIndex / STATIONS_PER_PAGE) + 1;

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
  const {
    currentStation: selectedStation,
    currentStream: activeStream,
    hasNextStation,
    hasPreviousStation,
    isMiniPlayerExpanded,
    isMiniPlayerVisible,
    isPlaying,
    playNextStation,
    playPreviousStation,
    playerError,
    playSelection,
    setMiniPlayerExpanded,
    setMiniPlayerVisible,
    setQueue,
    setVolume,
    togglePlayback,
    volume,
  } = useRadioPlayer();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStreams, setSelectedStreams] = useState({});
  const [brokenFavicons, setBrokenFavicons] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const selectedStationRef = useRef(selectedStation);
  const isPlayingRef = useRef(isPlaying);
  const lastNonZeroVolumeRef = useRef(1);

  useEffect(() => {
    selectedStationRef.current = selectedStation;
    isPlayingRef.current = isPlaying;
  }, [isPlaying, selectedStation]);

  useEffect(() => {
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

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
        const nextSelectedStreams = nextStations.reduce(
          (accumulator, channel) => {
            const defaultStream = getDefaultStream(channel);

            if (defaultStream) {
              accumulator[channel.id] = defaultStream.id;
            }

            return accumulator;
          },
          {},
        );
        const matchedCurrentStation = selectedStationRef.current
          ? nextStations.find(
              (station) => station.id === selectedStationRef.current.id,
            )
          : null;
        const initialStation = matchedCurrentStation || nextStations[0] || null;
        const initialStream = initialStation
          ? initialStation.streams.find(
              (stream) => stream.id === nextSelectedStreams[initialStation.id],
            ) || getDefaultStream(initialStation)
          : null;

        setStations(nextStations);
        setQueue(nextStations);
        setBrokenFavicons({});
        setSelectedStreams(nextSelectedStreams);

        if (initialStation && initialStream) {
          void playSelection(initialStation, initialStream, {
            autoplay: matchedCurrentStation ? isPlayingRef.current : false,
          });
        }

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
  }, [playSelection, reloadKey, setQueue]);

  const totalPages = Math.max(
    1,
    Math.ceil(stations.length / STATIONS_PER_PAGE),
  );
  const shouldShowPagination = stations.length > STATIONS_PER_PAGE;

  useEffect(() => {
    if (!stations.length || !selectedStation) {
      return;
    }

    const matchedStationIndex = stations.findIndex(
      (station) => station.id === selectedStation.id,
    );

    if (matchedStationIndex === -1 || !shouldShowPagination) {
      return;
    }

    setCurrentPage(getStationPage(matchedStationIndex));
  }, [selectedStation, shouldShowPagination, stations]);

  useEffect(() => {
    if (!selectedStation || !activeStream) {
      return;
    }

    setSelectedStreams((previous) => {
      if (previous[selectedStation.id] === activeStream.id) {
        return previous;
      }

      return {
        ...previous,
        [selectedStation.id]: activeStream.id,
      };
    });
  }, [activeStream, selectedStation]);

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
    const selectedStream = getChannelStream(station, selectedStreams);

    if (!selectedStream?.streamUrl) {
      return;
    }

    if (selectedStation?.id === station.id) {
      await togglePlayback();
      return;
    }

    await playSelection(station, selectedStream, { autoplay: true });
  };

  const handleStreamSelect = (station, streamId) => {
    setSelectedStreams((previous) => ({
      ...previous,
      [station.id]: streamId,
    }));

    if (selectedStation?.id === station.id) {
      const nextStream =
        station.streams.find((stream) => stream.id === streamId) ||
        getDefaultStream(station);

      if (nextStream) {
        void playSelection(station, nextStream, { autoplay: isPlaying });
      }
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
    if (!selectedStation) {
      return;
    }

    await togglePlayback();
  };

  const handleMuteToggle = () => {
    if (volume === 0) {
      setVolume(lastNonZeroVolumeRef.current || 1);
      return;
    }

    setVolume(0);
  };

  const handleSelectPreviousStation = () => {
    void playPreviousStation();
  };

  const handleSelectNextStation = () => {
    void playNextStation();
  };

  const isLight = theme === "light";

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
        <div className="md:min-h-[700px] lg:min-h-[700px] relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] md:p-10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage: "url('/radio.webp')",
              transform: "scaleX(-1)",
            }}
          />
          {/* <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(249,115,22,0.22),rgba(59,130,246,0.20))]" /> */}
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                <RiRadioFill className="h-4 w-4" />
                Live radio channels
              </div>

              <h1 className="max-w-3xl  font-black leading-tight text-2xl md:text-6xl text-center md:text-center lg:text-left text-white">
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
                  <div className="mt-2 text-2xl font-bold text-white">
                    {stations.length}
                  </div>
                </div>
                <div className="rounded-2xl  bg-white/10 px-4 py-3 shadow-lg backdrop-blur text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-orange-600">
                    Pages
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {totalPages}
                  </div>
                </div>
                <div className="rounded-2xl  bg-white/10 px-4 py-3 shadow-lg backdrop-blur text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-orange-600">
                    Source
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    Online Radio
                  </div>
                </div>
              </div>
            </div>

            <div className="md:absolute  lg:absolute top-[343px]  -right-9 w-full md:w-8/12 lg:w-5/12 rounded-[28px] border border-sky-600 bg-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur p-4">
              {/* bg-slate-950/50 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                    Now playing
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {selectedStation?.name || "Select a station"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
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
              <div className="mt-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between ">
                  <button
                    type="button"
                    onClick={handleNowPlayingToggle}
                    disabled={!selectedStation}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-1 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
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

                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMiniPlayerVisible) {
                        setMiniPlayerExpanded(false);
                        setMiniPlayerVisible(false);
                        return;
                      }

                      setMiniPlayerVisible(true);
                      setMiniPlayerExpanded(false);
                    }}
                    disabled={!selectedStation}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-semibold text-pink-500 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 animate-pulse"
                  >
                    {isMiniPlayerVisible
                      ? "Close mini player"
                      : "Open mini player"}
                  </button>
                </div>
              </div>

              {playerError ? (
                <p className="mt-3 text-sm text-rose-300">{playerError}</p>
              ) : null}

              {selectedStation ? (
                <div className="mt-2 flex flex-wrap gap-2">
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

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={handleSelectPreviousStation}
                  disabled={!hasPreviousStation}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous channel
                </button>

                <button
                  type="button"
                  onClick={handleSelectNextStation}
                  disabled={!hasNextStation}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next channel
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
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
                    className={` group relative overflow-hidden rounded-[30px] border bg-red-700  p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)]  ${
                      isLight
                        ? "border-slate-200 bg-[linear-gradient(155deg,#ffffff_0%,#fff8ee_52%,#f1f7ff_100%)]"
                        : "border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,0.92)_0%,rgba(30,41,59,0.92)_48%,rgba(17,24,39,0.95)_100%)]"
                    }`}
                  >
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

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
