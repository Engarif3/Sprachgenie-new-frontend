import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Bot, Crown, LoaderCircle, Pencil, Rocket, Trophy } from "lucide-react";
import Container from "../../utils/Container";
import api from "../../axios";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../services/auth.services";

const LEVELS = [
  { key: "easy", label: "Easy" },
  { key: "intermediate", label: "Intermediate" },
  { key: "difficult", label: "Difficult" },
];

// Per-level accent used for tabs and XP badges.
const LEVEL_THEME = {
  easy: {
    tabActive:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-300",
    ring: "ring-emerald-400/60",
    glow: "from-emerald-400/20 via-teal-400/10 to-transparent",
  },
  intermediate: {
    tabActive:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-300",
    ring: "ring-amber-400/60",
    glow: "from-amber-400/20 via-orange-400/10 to-transparent",
  },
  difficult: {
    tabActive:
      "bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-rose-500/30",
    chip: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    text: "text-fuchsia-600 dark:text-fuchsia-300",
    ring: "ring-fuchsia-400/60",
    glow: "from-fuchsia-400/20 via-rose-400/10 to-transparent",
  },
};

// Gold / silver / bronze crown accent for the top 3 rows. The rank number
// itself always stays visible in the badge — the crown is a small corner
// accessory, not a replacement for it.
const RANK_BADGE = {
  1: {
    badgeBg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500",
    ring: "ring-2 ring-yellow-300",
    crownColor: "text-yellow-500",
  },
  2: {
    badgeBg: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500",
    ring: "ring-2 ring-slate-300",
    crownColor: "text-slate-400",
  },
  3: {
    badgeBg: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700",
    ring: "ring-2 ring-amber-500",
    crownColor: "text-amber-600",
  },
};

const AVATAR_PALETTE = [
  "bg-gradient-to-br from-sky-400 to-blue-500",
  "bg-gradient-to-br from-violet-400 to-purple-500",
  "bg-gradient-to-br from-rose-400 to-pink-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-cyan-400 to-sky-500",
];

const getInitials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getAvatarClass = (seed) =>
  AVATAR_PALETTE[Math.abs(hashString(seed)) % AVATAR_PALETTE.length];

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < (value || "").length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};

// 20 questions/day × 10 XP × 7 days — the same theoretical weekly ceiling
// the backend validates a self-XP edit against.
const MAX_WEEKLY_XP_PER_LEVEL = 20 * 10 * 7;

const isValidLevel = (value) => LEVELS.some((level) => level.key === value);

const loadLeaderboard = async (level) => {
  const response = await api.get(
    `/challenge/levels/${level}/leaderboard?limit=20`,
  );
  return (
    response.data?.data || {
      entries: [],
      me: { rank: null, weeklyXp: 0, totalXp: 0 },
    }
  );
};

const Leaderboard = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { isSuperAdmin, userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedLevel = searchParams.get("level");
  const activeLevel = isValidLevel(requestedLevel) ? requestedLevel : "easy";
  const levelTheme = LEVEL_THEME[activeLevel];

  const [entries, setEntries] = useState([]);
  const [me, setMe] = useState({ rank: null, weeklyXp: 0, totalXp: 0 });
  const [daysUntilReset, setDaysUntilReset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // null until a SUPER_ADMIN's fetch tells us the real state — the backend
  // only ever sends this field to a SUPER_ADMIN viewer, so it also doubles
  // as "am I allowed to see the toggle at all".
  const [botsEnabled, setBotsEnabled] = useState(null);
  const [togglingBots, setTogglingBots] = useState(false);
  const [deployingBots, setDeployingBots] = useState(false);

  const refresh = useCallback(
    async (signal) => {
      setLoading(true);

      try {
        const data = await loadLeaderboard(activeLevel);
        if (signal?.cancelled) return;
        setEntries(data.entries);
        setMe(data.me);
        setDaysUntilReset(
          typeof data.daysUntilReset === "number" ? data.daysUntilReset : null,
        );
        setBotsEnabled(
          typeof data.botsEnabled === "boolean" ? data.botsEnabled : null,
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (!signal?.cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    },
    [activeLevel],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void refresh(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [refresh]);

  const toggleBots = async () => {
    const nextEnabled = !botsEnabled;
    setTogglingBots(true);

    try {
      await api.patch(`/challenge/levels/${activeLevel}/bots`, {
        enabled: nextEnabled,
      });
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingBots(false);
    }
  };

  // Manual override of the automatic staggered rollout — force a batch of
  // this week's still-dormant bots live right now, without changing the
  // automatic schedule for the rest.
  const deployBots = async () => {
    const levelLabel = LEVELS.find((level) => level.key === activeLevel)?.label;

    const { value: countInput } = await Swal.fire({
      title: `Deploy bots (${levelLabel})`,
      input: "text",
      html: `
    <div style="text-align:left; margin-bottom:8px;">
      <div>How many still-dormant bots to bring live right now?</div>
      <div style="text-align:center; font-size:15px; color:#888;">
        Leave blank to deploy all remaining.
      </div>
    </div>
  `,
      inputPlaceholder: "e.g. 10",
      showCancelButton: true,
      confirmButtonText: "Deploy",
      inputValidator: (value) => {
        if (value.trim() === "") return undefined;
        const num = Number(value);
        if (!Number.isInteger(num) || num <= 0) {
          return "Enter a positive whole number, or leave blank for all";
        }
      },
    });

    if (countInput === undefined) {
      return;
    }

    const count =
      countInput.trim() === "" ? "all" : Math.round(Number(countInput));

    setDeployingBots(true);

    try {
      const response = await api.post(
        `/challenge/levels/${activeLevel}/bots/deploy`,
        {
          count,
        },
      );
      const deployedCount = response.data?.data?.deployedCount ?? 0;
      await refresh();
      void Swal.fire({
        title: "Deployed",
        text:
          deployedCount > 0
            ? `${deployedCount} bot(s) are now live.`
            : "No dormant bots were left to deploy.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setDeployingBots(false);
    }
  };

  const editBot = async (entry) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit bot",
      html:
        `<input id="swal-bot-name" class="swal2-input" placeholder="Name" value="${entry.displayName.replace(/"/g, "&quot;")}">` +
        `<input id="swal-bot-xp" type="number" min="0" class="swal2-input" placeholder="Weekly XP" value="${entry.weeklyXp}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const name = document.getElementById("swal-bot-name").value.trim();
        const weeklyXp = Number(document.getElementById("swal-bot-xp").value);

        if (!name) {
          Swal.showValidationMessage("Name is required");
          return false;
        }

        if (!Number.isFinite(weeklyXp) || weeklyXp < 0) {
          Swal.showValidationMessage("XP must be a non-negative number");
          return false;
        }

        return { name, weeklyXp: Math.round(weeklyXp) };
      },
    });

    if (!formValues) {
      return;
    }

    try {
      const requests = [];

      if (formValues.name !== entry.displayName) {
        requests.push(
          api.patch(`/challenge/bots/${entry.userId}/name`, {
            name: formValues.name,
          }),
        );
      }

      if (formValues.weeklyXp !== entry.weeklyXp) {
        requests.push(
          api.patch(`/challenge/bots/${entry.userId}/xp`, {
            level: activeLevel,
            weeklyXp: formValues.weeklyXp,
          }),
        );
      }

      await Promise.all(requests);
      await refresh();
    } catch (error) {
      console.error(error);
    }
  };

  // Super-admin-only testing tool: edit your OWN weekly XP for this level.
  // Unlike bots, your name is tied to your real account and isn't editable
  // here — only the score.
  const editOwnXp = async (currentWeeklyXp) => {
    const { value: newXp } = await Swal.fire({
      title: "Edit your XP",
      input: "number",
      inputLabel: `Weekly XP (0 - ${MAX_WEEKLY_XP_PER_LEVEL})`,
      inputValue: currentWeeklyXp,
      inputAttributes: { min: 0, max: MAX_WEEKLY_XP_PER_LEVEL, step: 1 },
      showCancelButton: true,
      confirmButtonText: "Save",
      inputValidator: (value) => {
        const num = Number(value);
        if (
          !Number.isInteger(num) ||
          num < 0 ||
          num > MAX_WEEKLY_XP_PER_LEVEL
        ) {
          return `Enter a whole number between 0 and ${MAX_WEEKLY_XP_PER_LEVEL}`;
        }
      },
    });

    if (newXp === undefined || newXp === "") {
      return;
    }

    try {
      await api.patch(`/challenge/levels/${activeLevel}/my-xp`, {
        weeklyXp: Math.round(Number(newXp)),
      });
      await refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const cardClass = isLight
    ? "border-slate-200 bg-white"
    : "border-slate-800 bg-slate-900";

  return (
    <Container>
      <div className="mx-auto flex min-h-[75vh] max-w-lg flex-col gap-6 py-4">
        <div className="flex items-center  flex-col">
          <h1
            className={`flex items-center gap-2 text-3xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
          >
            <Trophy className="h-8 w-8 text-amber-500" />
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>

          <Link
            to="/challenge"
            className={`text-sm underline ${isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-slate-200 mt-2"}`}
          >
            Back to Challenge
          </Link>
        </div>

        <div className={`relative flex rounded-xl border p-1 ${cardClass}`}>
          {loading && hasLoadedOnce ? (
            <LoaderCircle
              size={16}
              className={`absolute -top-2 right-2 animate-spin ${isLight ? "text-slate-400" : "text-slate-500"}`}
            />
          ) : null}
          {LEVELS.map(({ key, label }) => {
            const isActive = key === activeLevel;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSearchParams({ level: key })}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? `shadow-lg ${LEVEL_THEME[key].tabActive}`
                    : isLight
                      ? "text-slate-600 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p
          className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
        >
          Top 20 ranked by XP earned answering{" "}
          {LEVELS.find(
            (level) => level.key === activeLevel,
          )?.label.toLowerCase()}{" "}
          questions this week. Resets every Monday.
          <span className="text-orange-500 font-semibold">
            {typeof daysUntilReset === "number"
              ? ` ${daysUntilReset === 1 ? "1 day" : `${daysUntilReset} days`} left.`
              : ""}
          </span>
        </p>

        <div
          className={`relative flex items-center justify-between overflow-hidden rounded-2xl border p-4 ring-1 ${cardClass} ${levelTheme.ring}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${levelTheme.glow}`}
          />
          <div className="relative">
            <p
              className={`text-xs  font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}
            >
              Your rank this week
            </p>
            <p
              className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}
            >
              {me.rank ? (
                <>
                  <span className={levelTheme.text}>#{me.rank}</span> ·{" "}
                  {me.weeklyXp} XP
                </>
              ) : (
                "Unranked"
              )}
            </p>
          </div>
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={() => editOwnXp(me.weeklyXp)}
              className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                isLight
                  ? "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              }`}
              aria-label="Edit your XP"
            >
              <Pencil size={14} />
            </button>
          ) : null}
        </div>

        {isSuperAdmin && botsEnabled !== null ? (
          <button
            type="button"
            onClick={toggleBots}
            disabled={togglingBots}
            className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cardClass}`}
          >
            <span
              className={`flex items-center gap-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}
            >
              <Bot size={16} />
              Leaderboard bots (
              {LEVELS.find((level) => level.key === activeLevel)?.label})
            </span>
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                botsEnabled
                  ? "bg-emerald-500"
                  : isLight
                    ? "bg-slate-300"
                    : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  botsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        ) : null}

        {isSuperAdmin && botsEnabled ? (
          <button
            type="button"
            onClick={deployBots}
            disabled={deployingBots}
            className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isLight
                ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Rocket size={16} />
            {deployingBots ? "Deploying…" : "Deploy dormant bots now"}
          </button>
        ) : null}

        {loading && !hasLoadedOnce ? (
          <p className={isLight ? "text-slate-600" : "text-slate-300"}>
            Loading leaderboard…
          </p>
        ) : (
          <div
            className={`flex flex-col gap-6 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-40" : "opacity-100"}`}
          >
            {entries.length === 0 ? (
              <div
                className={`overflow-hidden rounded-2xl border ${cardClass}`}
              >
                <p
                  className={`p-6 text-center text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  No one has earned XP at this level yet this week. Be the first
                  —{" "}
                  <Link to="/challenge" className="underline">
                    start a challenge
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div
                className={`overflow-hidden rounded-2xl border ${cardClass}`}
              >
                <ul>
                  {entries.map((entry) => {
                    const badge = RANK_BADGE[entry.rank];
                    // Match by userId, not rank — entry.rank is a
                    // positional index while me.rank comes from a
                    // separate count query, so tied XP values can make
                    // the two numbers legitimately disagree.
                    const isMe = !entry.isBot && entry.userId === userId;
                    return (
                      <li
                        key={entry.userId}
                        className={`flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0 ${
                          isLight ? "border-slate-100" : "border-slate-800"
                        } ${isMe ? `bg-gradient-to-r ${levelTheme.glow}` : ""}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                badge
                                  ? `${badge.badgeBg} ${badge.ring} text-white`
                                  : isLight
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {entry.rank}
                            </div>
                            {badge ? (
                              <Crown
                                size={14}
                                fill="currentColor"
                                className={`absolute -right-1.5 -top-1.5 drop-shadow-sm ${badge.crownColor}`}
                              />
                            ) : null}
                          </div>
                          <p className="h-6 border-dotted border-l-[2px] border-pink-600"></p>
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md  text-xs font-bold text-white ${getAvatarClass(entry.displayName || String(entry.userId))}`}
                          >
                            {getInitials(entry.displayName)}
                          </div>
                          <span
                            className={`truncate text-sm font-medium ${isLight ? "text-slate-800" : "text-slate-100"}`}
                          >
                            {entry.displayName}
                          </span>
                          {isMe ? (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelTheme.chip}`}
                            >
                              You
                            </span>
                          ) : null}
                          {entry.isBot ? (
                            <span
                              className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                isLight
                                  ? "bg-slate-200 text-slate-500"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              <Bot size={10} /> Bot
                            </span>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSuperAdmin && (entry.isBot || isMe) ? (
                            <button
                              type="button"
                              onClick={() =>
                                entry.isBot
                                  ? editBot(entry)
                                  : editOwnXp(entry.weeklyXp)
                              }
                              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                                isLight
                                  ? "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                              }`}
                              aria-label={`Edit ${entry.displayName}`}
                            >
                              <Pencil size={12} />
                            </button>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${levelTheme.chip}`}
                          >
                            {entry.weeklyXp} XP
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Leaderboard;
