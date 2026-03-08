import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const tones = {
  blue: {
    shell:
      "bg-[linear-gradient(160deg,rgba(12,26,52,0.98),rgba(21,46,86,0.96),rgba(38,91,149,0.9))]",
    glow: "bg-sky-400/20",
    icon: "from-sky-300/35 to-blue-500/20",
    accent: "bg-sky-300/90",
    label: "text-sky-100",
  },
  teal: {
    shell:
      "bg-[linear-gradient(160deg,rgba(8,33,40,0.98),rgba(15,60,72,0.96),rgba(24,113,125,0.9))]",
    glow: "bg-teal-400/20",
    icon: "from-teal-300/35 to-cyan-500/20",
    accent: "bg-teal-300/90",
    label: "text-teal-100",
  },
  violet: {
    shell:
      "bg-[linear-gradient(160deg,rgba(25,18,52,0.98),rgba(45,35,89,0.96),rgba(91,61,164,0.9))]",
    glow: "bg-violet-400/18",
    icon: "from-violet-300/35 to-indigo-500/20",
    accent: "bg-violet-300/90",
    label: "text-violet-100",
  },
  amber: {
    shell:
      "bg-[linear-gradient(160deg,rgba(58,31,8,0.98),rgba(99,51,14,0.96),rgba(168,96,24,0.9))]",
    glow: "bg-amber-400/18",
    icon: "from-amber-300/35 to-orange-500/20",
    accent: "bg-amber-300/90",
    label: "text-amber-100",
  },
  rose: {
    shell:
      "bg-[linear-gradient(160deg,rgba(58,18,43,0.98),rgba(98,28,69,0.96),rgba(171,56,110,0.9))]",
    glow: "bg-rose-400/18",
    icon: "from-rose-300/35 to-pink-500/20",
    accent: "bg-rose-300/90",
    label: "text-rose-100",
  },
  emerald: {
    shell:
      "bg-[linear-gradient(160deg,rgba(10,35,28,0.98),rgba(18,67,53,0.96),rgba(37,126,98,0.9))]",
    glow: "bg-emerald-400/18",
    icon: "from-emerald-300/35 to-teal-500/20",
    accent: "bg-emerald-300/90",
    label: "text-emerald-100",
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
  const palette = tones[tone] ?? tones.blue;

  return (
    <Link
      to={link}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] ${palette.shell} p-6 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_rgba(15,23,42,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
    >
      <div className="absolute inset-0 rounded-[28px] border border-white/[0.08] transition-colors duration-300 group-hover:border-white/[0.14] group-focus-visible:border-white/[0.16]" />
      <div className="absolute inset-[1px] rounded-[27px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_30%)]" />
      <div
        className={`absolute -right-8 top-4 h-28 w-28 rounded-full blur-3xl ${palette.glow}`}
      />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
      <div className="absolute left-6 right-6 top-0 h-px bg-white/[0.16]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <span className={`h-1.5 w-1.5 rounded-full ${palette.accent}`} />
              {eyebrow}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.07] text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[15px] bg-gradient-to-br ${palette.icon}`}
              >
                {icon}
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold tracking-[0.14em] text-white/80">
              {index}
            </div>
          </div>
        </div>

        <h3 className="mb-3 text-left text-[24px] font-semibold leading-[1.12] text-white md:text-[27px]">
          {title}
        </h3>

        <p className="min-h-[4.5rem] max-w-[34ch] text-left text-[15px] leading-7 text-white md:min-h-[4.9rem] md:text-[16px]">
          {text}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-5 text-sm transition-colors duration-300 group-hover:border-white/[0.14]">
          <span className={`font-medium ${palette.label}`}>
            {t("exploreNow")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-2 text-slate-100/95 transition-all duration-300 group-hover:bg-white/[0.12] group-hover:translate-x-1">
            <span className="text-[12px] font-semibold tracking-[0.08em] text-white/90">
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
