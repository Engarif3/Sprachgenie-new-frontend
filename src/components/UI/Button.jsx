import { forwardRef } from "react";
import { Link } from "react-router-dom";

// One button system for the whole app: a fixed set of variants/sizes so
// every page reuses the same solid colors and radius instead of each
// screen inventing its own gradient/rounded-full/rounded-md button.
// Gradients are intentionally NOT part of this system — reserved for the
// marketing hero on Home, not for everyday UI actions.
const VARIANT_CLASSES = {
  primary:
    "bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:outline-sky-600 disabled:bg-sky-300 dark:bg-sky-500 dark:hover:bg-sky-400 dark:disabled:bg-sky-800",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-slate-400 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-emerald-600 disabled:bg-emerald-300 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-rose-600 disabled:bg-rose-300 dark:bg-rose-600 dark:hover:bg-rose-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400 disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800",
};

// Some admin cards (AI story generator, word-creation forms) are always
// rendered on a fixed dark surface regardless of the site-wide light/dark
// toggle — `dark:` variants don't help there since there may be no `.dark`
// ancestor class at all. `surface="dark"` swaps in colors that read
// correctly on that fixed-dark background unconditionally.
const DARK_SURFACE_VARIANT_CLASSES = {
  primary:
    "bg-sky-500 text-white shadow-sm hover:bg-sky-400 focus-visible:outline-sky-400 disabled:bg-sky-800",
  secondary:
    "border border-slate-600 bg-slate-800 text-slate-200 shadow-sm hover:bg-slate-700 focus-visible:outline-slate-500 disabled:text-slate-500",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-emerald-500 disabled:bg-emerald-900",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:outline-rose-500 disabled:bg-rose-900",
  ghost:
    "text-slate-300 hover:bg-slate-800 focus-visible:outline-slate-500 disabled:text-slate-600",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      surface = "auto",
      to,
      href,
      fullWidth = false,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const variantClasses =
      surface === "dark"
        ? DARK_SURFACE_VARIANT_CLASSES[variant] ||
          DARK_SURFACE_VARIANT_CLASSES.primary
        : VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

    const classes = [
      "inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "disabled:cursor-not-allowed",
      variantClasses,
      SIZE_CLASSES[size] || SIZE_CLASSES.md,
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    if (href) {
      return (
        <a ref={ref} href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} type={rest.type || "button"} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
