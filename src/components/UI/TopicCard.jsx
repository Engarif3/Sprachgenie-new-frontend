import { IoArrowForwardOutline } from "react-icons/io5";

// Cycled by grid position so a page of otherwise-identical cards (same
// border, same layout) still reads as a set of distinct topics rather than
// one card repeated N times — mirrors the per-item accent palette Home.jsx
// already uses for its "How It Works" / feature cards.
const PALETTE = [
  {
    icon: "from-orange-500 to-pink-600 shadow-orange-500/30",
    glow: "bg-orange-500/40",
    ring: "hover:border-orange-300 dark:hover:border-orange-400/40",
    action: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
  },
  {
    icon: "from-sky-500 to-blue-600 shadow-sky-500/30",
    glow: "bg-sky-500/40",
    ring: "hover:border-sky-300 dark:hover:border-sky-400/40",
    action: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
  },
  {
    icon: "from-violet-500 to-purple-600 shadow-violet-500/30",
    glow: "bg-violet-500/40",
    ring: "hover:border-violet-300 dark:hover:border-violet-400/40",
    action: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
  },
  {
    icon: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    glow: "bg-emerald-500/40",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-400/40",
    action: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  {
    icon: "from-amber-500 to-orange-600 shadow-amber-500/30",
    glow: "bg-amber-500/40",
    ring: "hover:border-amber-300 dark:hover:border-amber-400/40",
    action: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  {
    icon: "from-rose-500 to-pink-600 shadow-rose-500/30",
    glow: "bg-rose-500/40",
    ring: "hover:border-rose-300 dark:hover:border-rose-400/40",
    action: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
  },
];

// A clickable topic tile for learner-facing "browse a list of subjects"
// pages (Grammar, Prefix Types). Replaces the old shine-sweep/scale-105
// gradient cards with the calmer lift-and-glow treatment Home.jsx already
// uses for its feature/step cards, so both pages match the rest of the app
// instead of having their own one-off card style.
const TopicCard = ({
  index = 0,
  icon: Icon,
  title,
  description,
  badge,
  actionLabel = "Learn More",
  onClick,
}) => {
  const tone = PALETTE[index % PALETTE.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none dark:backdrop-blur-sm ${tone.ring}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-2xl opacity-70 blur-xl ${tone.glow}`}
          />
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-105 ${tone.icon}`}
          >
            <Icon size={24} className="text-white" aria-hidden="true" />
          </div>
        </div>

        {badge && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="mb-5 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}

      <div
        className={`mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700 transition-colors duration-300 dark:border-white/10 dark:text-slate-300 ${tone.action}`}
      >
        <span>{actionLabel}</span>
        <IoArrowForwardOutline
          size={16}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </button>
  );
};

export default TopicCard;
