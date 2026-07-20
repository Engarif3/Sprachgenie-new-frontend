import { useEffect, useRef, useState } from "react";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_MS = 100;
const DANGER_THRESHOLD_SECONDS = 5;

const getRemainingSeconds = (deadlineAt, totalSeconds) => {
  if (!deadlineAt) {
    return totalSeconds;
  }

  return Math.max(0, (deadlineAt - Date.now()) / 1000);
};

// A circular per-question countdown driven by an absolute server-provided
// deadline (epoch ms), not a client-only timer. This is deliberate: if the
// countdown just restarted at `totalSeconds` on every mount, refreshing the
// page mid-question would hand the user a fresh 15 seconds indefinitely.
// Instead the deadline comes from the backend's own record of when the
// question was first shown, so a refresh just recomputes how much of the
// original window is left (possibly none).
const CountdownRing = ({ totalSeconds, deadlineAt, onExpire, paused = false }) => {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(deadlineAt, totalSeconds),
  );
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;

    if (paused || !deadlineAt) {
      return undefined;
    }

    const tick = () => {
      const nextRemaining = getRemainingSeconds(deadlineAt, totalSeconds);
      setRemaining(nextRemaining);

      if (nextRemaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const intervalId = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalId);
  }, [deadlineAt, totalSeconds, paused, onExpire]);

  const isDanger = remaining <= DANGER_THRESHOLD_SECONDS;
  const progress = Math.max(0, Math.min(1, remaining / totalSeconds));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="5"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={`transition-[stroke-dashoffset,stroke] duration-100 ease-linear ${
            isDanger ? "stroke-rose-500" : "stroke-emerald-500"
          }`}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums ${
          isDanger ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {Math.ceil(remaining)}
      </div>
    </div>
  );
};

export default CountdownRing;
