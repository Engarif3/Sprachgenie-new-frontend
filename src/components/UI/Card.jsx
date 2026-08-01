// One card container for grid/list pages — a single border/shadow/radius
// recipe instead of each page mixing its own (border-2 + glow shadow vs.
// border + shadow-sm vs. ring-1, all at once across the app).
const Card = ({
  as: Component = "div",
  interactive = false,
  className = "",
  children,
  ...rest
}) => {
  const classes = [
    "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
    interactive
      ? "text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/60 hover:shadow-md dark:hover:border-sky-500/40"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
};

export default Card;
