import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Minimize2,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import { RiRadioFill } from "react-icons/ri";
import { useTheme } from "../context/ThemeContext";
import { useRadioPlayer } from "../context/RadioPlayerContext";

const VIEWPORT_MARGIN = 16;
const DRAG_THRESHOLD = 6;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const stopEventPropagation = (event) => {
  event.stopPropagation();
};

const RadioMiniPlayer = () => {
  const { theme } = useTheme();
  const {
    currentStation,
    currentStream,
    hasNextStation,
    hasPreviousStation,
    isMiniPlayerExpanded,
    isMiniPlayerVisible,
    isPlaying,
    playNextStation,
    playPreviousStation,
    setMiniPlayerVisible,
    setMiniPlayerExpanded,
    setVolume,
    stopPlayback,
    togglePlayback,
    volume,
  } = useRadioPlayer();
  const playerRef = useRef(null);
  const dragStateRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const isLight = theme === "light";

  const clampPosition = useCallback((nextX, nextY) => {
    const playerElement = playerRef.current;

    if (!playerElement || typeof window === "undefined") {
      return { x: nextX, y: nextY };
    }

    const maxX = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - playerElement.offsetWidth - VIEWPORT_MARGIN,
    );
    const maxY = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - playerElement.offsetHeight - VIEWPORT_MARGIN,
    );

    return {
      x: clamp(nextX, VIEWPORT_MARGIN, maxX),
      y: clamp(nextY, VIEWPORT_MARGIN, maxY),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateInitialPosition = () => {
      const playerElement = playerRef.current;

      if (!playerElement) {
        return;
      }

      setPosition((previous) => {
        if (!previous) {
          return clampPosition(
            window.innerWidth - playerElement.offsetWidth - VIEWPORT_MARGIN,
            window.innerHeight - playerElement.offsetHeight - VIEWPORT_MARGIN,
          );
        }

        return clampPosition(previous.x, previous.y);
      });
    };

    updateInitialPosition();
    window.addEventListener("resize", updateInitialPosition);

    return () => {
      window.removeEventListener("resize", updateInitialPosition);
    };
  }, [clampPosition, isMiniPlayerExpanded]);

  const runFoldedAction = useCallback(
    (action) => {
      if (action === "toggle") {
        void togglePlayback();
        return;
      }

      if (action === "close") {
        handleCloseMiniPlayer();
        return;
      }

      setMiniPlayerExpanded(true);
    },
    [setMiniPlayerExpanded, togglePlayback],
  );

  const handleDragEnd = useCallback(() => {
    const dragState = dragStateRef.current;

    dragStateRef.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handleDragEnd);
    window.removeEventListener("pointercancel", handleDragEnd);

    if (!dragState?.didMove && !isMiniPlayerExpanded) {
      runFoldedAction(dragState?.action || "expand");
    }
  }, [isMiniPlayerExpanded, runFoldedAction]);

  const handlePointerMove = useCallback(
    (event) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (!dragState.didMove) {
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < DRAG_THRESHOLD) {
          return;
        }

        dragState.didMove = true;
        setIsDragging(true);
      }

      const nextPosition = clampPosition(
        event.clientX - dragState.offsetX,
        event.clientY - dragState.offsetY,
      );

      setPosition(nextPosition);
    },
    [clampPosition],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleDragEnd);
      window.removeEventListener("pointercancel", handleDragEnd);
    };
  }, [handleDragEnd, handlePointerMove]);

  const handleDragStart = (event) => {
    if (event.button !== 0) {
      return;
    }

    let action = "expand";

    if (isMiniPlayerExpanded) {
      const interactiveTarget = event.target.closest(
        "button, input, a, [data-no-drag='true']",
      );

      if (interactiveTarget) {
        return;
      }
    } else {
      action =
        event.target.closest("[data-folded-action]")?.dataset.foldedAction ||
        "expand";
    }

    const playerElement = playerRef.current;

    if (!playerElement) {
      return;
    }

    const bounds = playerElement.getBoundingClientRect();
    dragStateRef.current = {
      action,
      didMove: false,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: event.clientX,
      startY: event.clientY,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleDragEnd);
    window.addEventListener("pointercancel", handleDragEnd);
  };

  const playerStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {
        right: `${VIEWPORT_MARGIN}px`,
        bottom: `${VIEWPORT_MARGIN}px`,
      };

  const handleCloseMiniPlayer = () => {
    stopPlayback();
    setMiniPlayerExpanded(false);
    setMiniPlayerVisible(false);
  };

  if (!currentStation || !isMiniPlayerVisible) {
    return null;
  }

  if (!isMiniPlayerExpanded) {
    return (
      <div
        ref={playerRef}
        onPointerDown={handleDragStart}
        style={playerStyle}
        className={`fixed z-50 inline-flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border px-3 py-3 text-left shadow-[0_20px_60px_rgba(15,23,42,0.28)] backdrop-blur ${
          isLight
            ? "border-slate-200 bg-white/95 text-slate-900"
            : "border-white/10 bg-slate-950/90 text-white"
        } ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25"
          aria-label={isPlaying ? "Pause radio" : "Play radio"}
          data-folded-action="toggle"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          className="min-w-0 text-left"
          data-folded-action="expand"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
            Mini player
          </span>
          <span className="block max-w-40 truncate text-sm font-semibold">
            {currentStation.name}
          </span>
        </button>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
          aria-label="Close mini player"
          title="Close"
          data-folded-action="close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      onPointerDown={handleDragStart}
      style={playerStyle}
      className={`fixed z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border shadow-[0_26px_80px_rgba(15,23,42,0.35)] backdrop-blur ${
        isLight
          ? "border-slate-200 bg-white/95 text-slate-900"
          : "border-white/10 bg-slate-950/92 text-white"
      } ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
    >
      <div className="bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(236,72,153,0.14),rgba(59,130,246,0.16))] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">
              <RiRadioFill className="h-3.5 w-3.5" />
              Mini player
            </div>
            <h3 className="mt-3 truncate text-lg font-bold">
              {currentStation.name}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {currentStation.country}
              {currentStation.state ? `, ${currentStation.state}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                stopEventPropagation(event);
                setMiniPlayerExpanded(false);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
              aria-label="Minimize mini player"
              title="Minimize"
              data-no-drag="true"
            >
              <Minimize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                stopEventPropagation(event);
                handleCloseMiniPlayer();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
              aria-label="Close mini player"
              title="Close"
              data-no-drag="true"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(event) => {
              stopEventPropagation(event);
              void playPreviousStation();
            }}
            disabled={!hasPreviousStation}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous channel"
            data-no-drag="true"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              stopEventPropagation(event);
              void togglePlayback();
            }}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/25"
            data-no-drag="true"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            type="button"
            onClick={(event) => {
              stopEventPropagation(event);
              void playNextStation();
            }}
            disabled={!hasNextStation}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next channel"
            data-no-drag="true"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <Volume2 className="h-4 w-4 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-full accent-orange-500"
            aria-label="Mini player volume"
            data-no-drag="true"
          />
          <span className="w-10 text-right text-xs font-semibold text-slate-400">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-400">
          <span>{currentStream?.codec || "Unknown"}</span>
          <span>
            {currentStream?.bitrate > 0
              ? `${currentStream.bitrate} kbps`
              : "Variable bitrate"}
          </span>
        </div>

        <Link
          to="/radio"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-500 transition-colors hover:text-orange-400"
          data-no-drag="true"
        >
          Open radio page
        </Link>
      </div>
    </div>
  );
};

export default RadioMiniPlayer;
