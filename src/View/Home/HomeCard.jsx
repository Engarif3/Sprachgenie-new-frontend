import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

// Each tone gets a distinct look in BOTH themes, so a card keeps its visual
// identity whether the site is in light or dark mode — previously light
// mode ignored `tone` entirely and every card looked identical.
const tones = {
  blue: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(12,26,52,0.98),rgba(21,46,86,0.96),rgba(38,91,149,0.9))]",
      glow: "bg-sky-400/20",
      icon: "from-sky-300/35 to-blue-500/20",
      accent: "bg-sky-300/90",
      label: "text-sky-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-sky-50 to-sky-100",
      glow: "bg-sky-300/40",
      icon: "from-sky-100 to-sky-200",
      accent: "bg-sky-500",
      label: "text-sky-700",
      eyebrow: "text-sky-600",
      iconRing: "text-sky-600",
      title: "text-sky-900",
      openBg: "bg-sky-500",
      openHoverBg: "group-hover:bg-sky-600",
      openText: "text-white",
    },
  },
  teal: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(8,33,40,0.98),rgba(15,60,72,0.96),rgba(24,113,125,0.9))]",
      glow: "bg-teal-400/20",
      icon: "from-teal-300/35 to-cyan-500/20",
      accent: "bg-teal-300/90",
      label: "text-teal-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-teal-50 to-teal-100",
      glow: "bg-teal-300/40",
      icon: "from-teal-100 to-teal-200",
      accent: "bg-teal-500",
      label: "text-teal-700",
      eyebrow: "text-teal-600",
      iconRing: "text-teal-600",
      title: "text-teal-900",
      openBg: "bg-teal-500",
      openHoverBg: "group-hover:bg-teal-600",
      openText: "text-white",
    },
  },
  violet: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(25,18,52,0.98),rgba(45,35,89,0.96),rgba(91,61,164,0.9))]",
      glow: "bg-violet-400/18",
      icon: "from-violet-300/35 to-indigo-500/20",
      accent: "bg-violet-300/90",
      label: "text-violet-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-violet-50 to-violet-100",
      glow: "bg-violet-300/40",
      icon: "from-violet-100 to-violet-200",
      accent: "bg-violet-500",
      label: "text-violet-700",
      eyebrow: "text-violet-600",
      iconRing: "text-violet-600",
      title: "text-violet-900",
      openBg: "bg-violet-500",
      openHoverBg: "group-hover:bg-violet-600",
      openText: "text-white",
    },
  },
  amber: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(58,31,8,0.98),rgba(99,51,14,0.96),rgba(168,96,24,0.9))]",
      glow: "bg-amber-400/18",
      icon: "from-amber-300/35 to-orange-500/20",
      accent: "bg-amber-300/90",
      label: "text-amber-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-amber-50 to-amber-100",
      glow: "bg-amber-300/40",
      icon: "from-amber-100 to-amber-200",
      accent: "bg-amber-500",
      label: "text-amber-700",
      eyebrow: "text-amber-600",
      iconRing: "text-amber-600",
      title: "text-amber-900",
      openBg: "bg-amber-500",
      openHoverBg: "group-hover:bg-amber-600",
      openText: "text-white",
    },
  },
  rose: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(58,18,43,0.98),rgba(98,28,69,0.96),rgba(171,56,110,0.9))]",
      glow: "bg-rose-400/18",
      icon: "from-rose-300/35 to-pink-500/20",
      accent: "bg-rose-300/90",
      label: "text-rose-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-rose-50 to-rose-100",
      glow: "bg-rose-300/40",
      icon: "from-rose-100 to-rose-200",
      accent: "bg-rose-500",
      label: "text-rose-700",
      eyebrow: "text-rose-600",
      iconRing: "text-rose-600",
      title: "text-rose-900",
      openBg: "bg-rose-500",
      openHoverBg: "group-hover:bg-rose-600",
      openText: "text-white",
    },
  },
  emerald: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(10,35,28,0.98),rgba(18,67,53,0.96),rgba(37,126,98,0.9))]",
      glow: "bg-emerald-400/18",
      icon: "from-emerald-300/35 to-teal-500/20",
      accent: "bg-emerald-300/90",
      label: "text-emerald-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-emerald-50 to-emerald-100",
      glow: "bg-emerald-300/40",
      icon: "from-emerald-100 to-emerald-200",
      accent: "bg-emerald-500",
      label: "text-emerald-700",
      eyebrow: "text-emerald-600",
      iconRing: "text-emerald-600",
      title: "text-emerald-900",
      openBg: "bg-emerald-500",
      openHoverBg: "group-hover:bg-emerald-600",
      openText: "text-white",
    },
  },
  indigo: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(17,24,60,0.98),rgba(30,41,99,0.96),rgba(67,56,202,0.9))]",
      glow: "bg-indigo-400/20",
      icon: "from-indigo-300/35 to-blue-600/20",
      accent: "bg-indigo-300/90",
      label: "text-indigo-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-indigo-50 to-indigo-100",
      glow: "bg-indigo-300/40",
      icon: "from-indigo-100 to-indigo-200",
      accent: "bg-indigo-500",
      label: "text-indigo-700",
      eyebrow: "text-indigo-600",
      iconRing: "text-indigo-600",
      title: "text-indigo-900",
      openBg: "bg-indigo-500",
      openHoverBg: "group-hover:bg-indigo-600",
      openText: "text-white",
    },
  },
  cyan: {
    dark: {
      shell:
        "bg-[linear-gradient(160deg,rgba(8,40,45,0.98),rgba(14,72,80,0.96),rgba(21,130,140,0.9))]",
      glow: "bg-cyan-400/20",
      icon: "from-cyan-300/35 to-teal-500/20",
      accent: "bg-cyan-300/90",
      label: "text-cyan-100",
      eyebrow: "text-white/85",
      iconRing: "text-slate-50",
      title: "text-white",
      openBg: "bg-white/[0.08]",
      openHoverBg: "group-hover:bg-white/[0.12]",
      openText: "text-white/90",
    },
    light: {
      shell: "bg-gradient-to-br from-white via-cyan-50 to-cyan-100",
      glow: "bg-cyan-300/40",
      icon: "from-cyan-100 to-cyan-200",
      accent: "bg-cyan-500",
      label: "text-cyan-700",
      eyebrow: "text-cyan-600",
      iconRing: "text-cyan-600",
      title: "text-cyan-900",
      openBg: "bg-cyan-500",
      openHoverBg: "group-hover:bg-cyan-600",
      openText: "text-white",
    },
  },
};

const HomeCard = ({
  title,
  text,
  link,
  icon,
  eyebrow,
  index,
  tone = "blue",
}) => {
  const { t } = useTranslation("home");
  const { theme } = useTheme();
  const isLight = theme === "light";
  const palette = (tones[tone] ?? tones.blue)[isLight ? "light" : "dark"];

  return (
    <Link
      to={link}
      className={` group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] ${palette.shell}  p-6 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_rgba(15,23,42,0.22)] focus-visible:outline-none focus-visible:ring-2 ${
        isLight
          ? " border border-gray-200/90 focus-visible:ring-gray-300/80 focus-visible:ring-offset-white "
          : "focus-visible:ring-white/30 focus-visible:ring-offset-slate-950"
      } focus-visible:ring-offset-2`}
    >
      <div
        className={` absolute inset-0 rounded-[28px] border transition-colors duration-300 ${
          isLight
            ? "hidden"
            : "border-white/[0.08] group-hover:border-white/[0.14] group-focus-visible:border-white/[0.16]"
        }`}
      />
      <div
        className={`absolute inset-0 rounded-[28px] ${
          isLight
            ? "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_36%)]"
            : "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_30%)]"
        }`}
      />
      <div
        className={`absolute -right-8 top-4 h-28 w-28 rounded-full blur-3xl ${palette.glow}`}
      />
      <div
        className={`absolute inset-x-0 top-0 h-24 ${
          isLight
            ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0))]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]"
        }`}
      />
      <div
        className={`absolute left-6 right-6 top-0 h-px ${
          isLight ? "bg-gray-200/90" : "bg-white/[0.16]"
        }`}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
                isLight
                  ? "border-gray-200 bg-white/90"
                  : "border-white/10 bg-white/[0.06]"
              } ${palette.eyebrow}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${palette.accent}`} />
              {eyebrow}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                isLight
                  ? "border border-gray-200 bg-white/60"
                  : "bg-white/[0.07]"
              } ${palette.iconRing}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[15px] bg-gradient-to-br ${palette.icon} `}
              >
                {icon}
              </div>
            </div>
            {/* <div
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-[0.14em] ${
                isLight
                  ? "border-gray-200 bg-white/90 text-gray-700"
                  : "border-white/10 bg-white/[0.06] text-white/80"
              }`}
            >
              {index}
            </div> */}
          </div>
        </div>

        <h3
          className={`mb-3 text-left text-[24px] font-semibold leading-[1.12] md:text-[27px] ${palette.title}`}
        >
          {title}
        </h3>

        <p
          className={`min-h-[4.5rem] max-w-[34ch] text-left text-[15px] leading-7 md:min-h-[4.9rem] md:text-[16px] ${
            isLight ? "text-slate-700" : "text-white"
          }`}
        >
          {text}
        </p>

        <div
          className={`mt-6 flex items-center justify-between border-t pt-5 text-sm transition-colors duration-300 ${
            isLight
              ? "border-gray-200/90 group-hover:border-gray-300 "
              : "border-white/[0.08] group-hover:border-white/[0.14]"
          }`}
        >
          <span className={`font-medium ${palette.label}`}>
            {t("exploreNow")}
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 transition-all duration-300 group-hover:translate-x-1 ${
              isLight ? "border-gray-200" : "border-white/10"
            } ${palette.openBg} ${palette.openHoverBg}`}
          >
            <span
              className={`text-[12px] font-semibold tracking-[0.08em] ${palette.openText}`}
            >
              Open
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-4 w-4 ${palette.openText}`}
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
