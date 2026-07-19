import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const RadioPlayerContext = createContext(null);

const syncAudioSource = (audio, streamUrl) => {
  if (!audio || !streamUrl) {
    return false;
  }

  if (audio.src !== streamUrl) {
    audio.src = streamUrl;
    audio.load();
  }

  return true;
};

const getNextFallbackStream = (station, currentStreamId) => {
  if (!station?.streams?.length) {
    return null;
  }

  const currentIndex = station.streams.findIndex(
    (stream) => stream.id === currentStreamId,
  );

  if (currentIndex === -1) {
    return null;
  }

  return station.streams[currentIndex + 1] || null;
};

export const RadioPlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const currentStationRef = useRef(null);
  const currentStreamRef = useRef(null);
  const stationQueueRef = useRef([]);

  const [stationQueue, setStationQueue] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [volume, setVolume] = useState(1);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);

  useEffect(() => {
    currentStationRef.current = currentStation;
    currentStreamRef.current = currentStream;
    stationQueueRef.current = stationQueue;
  }, [currentStation, currentStream, stationQueue]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
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
      const station = currentStationRef.current;
      const stream = currentStreamRef.current;
      const fallbackStream = getNextFallbackStream(station, stream?.id);

      if (station && fallbackStream) {
        const fallbackLabel =
          fallbackStream.bitrate > 0
            ? `${fallbackStream.bitrate} kbps`
            : "variable bitrate";

        setPlayerError(
          `Primary stream failed. Switched to ${fallbackStream.codec} ${fallbackLabel}.`,
        );
        setCurrentStream(fallbackStream);

        if (syncAudioSource(audio, fallbackStream.streamUrl)) {
          void audio.play().catch(() => {
            setIsPlaying(false);
            setPlayerError("This stream could not be played in your browser.");
          });
        }

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

  const setQueue = useCallback((stations) => {
    setStationQueue(stations);

    if (!currentStationRef.current) {
      return;
    }

    const matchedStation = stations.find(
      (station) => station.id === currentStationRef.current.id,
    );

    if (!matchedStation) {
      return;
    }

    setCurrentStation(matchedStation);

    const matchedStream =
      matchedStation.streams.find(
        (stream) => stream.id === currentStreamRef.current?.id,
      ) || matchedStation.streams[0];

    if (matchedStream) {
      setCurrentStream(matchedStream);
    }
  }, []);

  const playSelection = useCallback(
    async (
      station,
      stream,
      { autoplay = true, openMiniPlayer = false } = {},
    ) => {
      const audio = audioRef.current;

      if (!station || !stream?.streamUrl || !audio) {
        return false;
      }

      setCurrentStation(station);
      setCurrentStream(stream);
      setPlayerError("");

      if (openMiniPlayer) {
        setIsMiniPlayerVisible(true);
        setIsMiniPlayerExpanded(true);
      }

      if (!syncAudioSource(audio, stream.streamUrl)) {
        return false;
      }

      if (!autoplay) {
        return true;
      }

      try {
        await audio.play();
        return true;
      } catch {
        setIsPlaying(false);
        setPlayerError("Playback was blocked or the stream is unavailable.");
        return false;
      }
    },
    [],
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    const station = currentStationRef.current;
    const stream = currentStreamRef.current;

    if (!audio || !station || !stream?.streamUrl) {
      return false;
    }

    if (!audio.paused) {
      audio.pause();
      return true;
    }

    try {
      setPlayerError("");

      if (!syncAudioSource(audio, stream.streamUrl)) {
        return false;
      }

      await audio.play();
      return true;
    } catch {
      setIsPlaying(false);
      setPlayerError("Playback was blocked or the stream is unavailable.");
      return false;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setIsPlaying(false);
    setPlayerError("");
    return true;
  }, []);

  const currentStationIndex = stationQueue.findIndex(
    (station) => station.id === currentStation?.id,
  );
  const hasPreviousStation = currentStationIndex > 0;
  const hasNextStation =
    currentStationIndex >= 0 && currentStationIndex < stationQueue.length - 1;

  const playStationAtIndex = useCallback(
    async (stationIndex) => {
      const nextStation = stationQueueRef.current[stationIndex];
      const nextStream = nextStation?.streams?.[0] || null;

      if (!nextStation || !nextStream) {
        return false;
      }

      return playSelection(nextStation, nextStream, {
        autoplay: true,
      });
    },
    [playSelection],
  );

  const playPreviousStation = useCallback(async () => {
    if (!hasPreviousStation) {
      return false;
    }

    return playStationAtIndex(currentStationIndex - 1);
  }, [currentStationIndex, hasPreviousStation, playStationAtIndex]);

  const playNextStation = useCallback(async () => {
    if (!hasNextStation) {
      return false;
    }

    return playStationAtIndex(currentStationIndex + 1);
  }, [currentStationIndex, hasNextStation, playStationAtIndex]);

  return (
    <RadioPlayerContext.Provider
      value={{
        currentStation,
        currentStream,
        hasNextStation,
        hasPreviousStation,
        isMiniPlayerExpanded,
        isMiniPlayerVisible,
        isPlaying,
        playNextStation,
        playPreviousStation,
        playerError,
        playSelection,
        setMiniPlayerVisible: setIsMiniPlayerVisible,
        setMiniPlayerExpanded: setIsMiniPlayerExpanded,
        setQueue,
        stopPlayback,
        setVolume,
        togglePlayback,
        volume,
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" className="hidden" />
    </RadioPlayerContext.Provider>
  );
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);

  if (!context) {
    throw new Error("useRadioPlayer must be used within a RadioPlayerProvider");
  }

  return context;
};
