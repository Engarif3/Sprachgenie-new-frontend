// One page-title treatment for the whole app. Default is a plain,
// professional solid heading (industry-standard dashboards don't gradient
// every title) — the "brand" accent is opt-in, for the handful of
// learner-facing pages that want the orange/pink identity, so that
// gradient stays a deliberate choice instead of copy-pasted everywhere.
const EYEBROW_TONE_CLASSES = {
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  rose: "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  emerald:
    "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  neutral:
    "border-slate-300/60 bg-slate-100 text-slate-700 dark:border-slate-600/30 dark:bg-slate-800/80 dark:text-slate-200",
};

const PageHeader = ({
  eyebrow,
  eyebrowTone = "sky",
  title,
  subtitle,
  accent = "neutral",
  align = "left",
  // Some admin cards render on a fixed-dark surface regardless of the
  // site-wide theme toggle — `dark:` variants can't help there since
  // there may be no `.dark` ancestor. surface="dark" forces readable
  // colors unconditionally instead of relying on that class.
  surface = "auto",
  className = "",
}) => {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const isDarkSurface = surface === "dark";

  const titleClass =
    accent === "brand"
      ? "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
      : isDarkSurface
        ? "text-white"
        : "text-slate-900 dark:text-white";

  const subtitleClass = isDarkSurface
    ? "text-slate-400"
    : "text-slate-600 dark:text-slate-400";

  return (
    <div className={`${alignClass} ${className}`}>
      {eyebrow && (
        <span
          className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${EYEBROW_TONE_CLASSES[eyebrowTone] || EYEBROW_TONE_CLASSES.sky}`}
        >
          {eyebrow}
        </span>
      )}
      <h1
        className={`text-2xl font-bold sm:text-3xl md:text-4xl ${titleClass}`}
      >
        {title}
      </h1>
      {subtitle && (
        <p className={`mt-2 text-sm sm:text-base ${subtitleClass}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
