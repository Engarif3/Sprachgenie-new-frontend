import { formatDateOnly, formatTimeOnly } from "../../utils/formatDateTime";

// The one date+time display used everywhere in the app — same pill design
// originally used on /dashboard/update-user-status (UserManagementTable):
// the date in a slate pill, the time in an emerald pill, so a mixed
// date/time value is easy to scan at a glance instead of running together
// as one block of text. Colors/pill styling are overridable per call site
// (e.g. a card that's already on a colored background) but default to this
// exact look everywhere else.
const DateTime = ({
  value,
  showTime = true,
  className = "",
  dateClassName = "rounded-lg bg-slate-500/30 dark:bg-gray-700 px-1 py-1 font-medium text-slate-700 dark:text-gray-200",
  timeClassName = "rounded-lg bg-emerald-500/30 dark:bg-emerald-500/50 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300",
}) => {
  const datePart = formatDateOnly(value);
  const timePart = showTime ? formatTimeOnly(value) : "";

  return (
    <span
      className={`inline-flex items-center gap-1 leading-tight ${className}`}
    >
      <span className={dateClassName}>{datePart}</span>
      {timePart && <span className={timeClassName}>{timePart}</span>}
    </span>
  );
};

export default DateTime;
