// Grammar datasets store the preposition either bare (e.g. "von") or fused
// with its case hint in one string, e.g. "von (jm/etw)", two alternatives
// joined by "&"/"/" such as "bei (jm) & für (etw)" or "von (jm/etw) / über
// (jn/etw)", or a single preposition that itself contains a slash, e.g.
// "auf/über (jn/etw)" (one shared hint, not two alternatives). Rendered as
// plain text the parenthetical hint wraps onto its own line at narrow
// widths and is visually indistinguishable from the preposition itself.
//
// The preposition itself is always colored; only split into separate pairs
// at a "&"/"/" that comes *after a closing paren* — that's what
// distinguishes "bei (jm) / über (etw)" (two pairs) from "auf/über
// (jn/etw)" (one compound preposition, one hint) or "mit/zu (etw)" (same).
const SPLIT_RE = /(?<=\))\s*([&/])\s*/;
const PAREN_RE = /^(.*?)\s*(\([^()]*\))\s*$/;

const PrepositionLabel = ({ text, className = "" }) => {
  if (!text) return null;

  const parts = text.split(SPLIT_RE);

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 ${className}`}
    >
      {parts.map((part, i) => {
        // Odd indices are the captured "&"/"/" separator between two pairs.
        if (i % 2 === 1) {
          return (
            <span
              key={`sep-${i}`}
              className="text-slate-400 dark:text-slate-500"
            >
              {part}
            </span>
          );
        }

        const match = part.match(PAREN_RE);
        const word = match ? match[1] : part;
        const hint = match ? match[2] : null;

        return (
          <span
            key={`combo-${i}`}
            className="inline-flex items-baseline gap-1 whitespace-nowrap"
          >
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {word}
            </span>
            {hint && (
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {hint}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

export default PrepositionLabel;
