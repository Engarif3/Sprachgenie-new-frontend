import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

// One consistent card style for every resource — previously each card had
// its own color theme (8 different hues across 8 cards), which read as
// inconsistent rather than intentional. A single accent lets each card's
// own icon do the differentiating instead.
const HomeCard = ({ title, text, link, icon, eyebrow }) => {
  const { t } = useTranslation("home");
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <Link
      to={link}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border p-6 transition-all duration-300 hover:-translate-y-1.5 md:p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isLight
          ? "border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-sky-300 hover:shadow-[0_24px_56px_rgba(15,23,42,0.12)] focus-visible:ring-sky-300 focus-visible:ring-offset-white"
          : "border-white/10 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-sky-400/40 hover:shadow-[0_24px_56px_rgba(15,23,42,0.35)] focus-visible:ring-sky-400/40 focus-visible:ring-offset-slate-950"
      }`}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-white/10 bg-white/[0.06] text-white/80"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {eyebrow}
          </div>

          <div
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${
              isLight
                ? "border-sky-200 bg-sky-50 text-sky-600"
                : "border-sky-500/20 bg-sky-500/10 text-sky-400"
            }`}
          >
            {icon}
          </div>
        </div>

        <h3
          className={`mb-3 text-left text-[24px] font-semibold leading-[1.12] md:text-[27px] ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          {title}
        </h3>

        <p
          className={`min-h-[4.5rem] max-w-[34ch] text-left text-[15px] leading-7 md:min-h-[4.9rem] md:text-[16px] ${
            isLight ? "text-slate-600" : "text-gray-300"
          }`}
        >
          {text}
        </p>

        <div
          className={`mt-6 flex items-center justify-between border-t pt-5 text-sm transition-colors duration-300 ${
            isLight
              ? "border-slate-200 group-hover:border-sky-200"
              : "border-white/[0.08] group-hover:border-white/[0.14]"
          }`}
        >
          <span className="font-medium text-sky-600 dark:text-sky-400">
            {t("exploreNow")}
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 transition-all duration-300 group-hover:translate-x-1 ${
              isLight
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-white/10 bg-white/[0.06] text-sky-300"
            }`}
          >
            <span className="text-[12px] font-semibold tracking-[0.08em]">
              Open
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 6l6 6-6 6"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default HomeCard;
