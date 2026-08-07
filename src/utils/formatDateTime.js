// One date/time format used everywhere in the app, instead of each page
// picking its own toLocaleDateString options (which drifted into several
// different formats — 8/6/2026, "06 August 2026", "Aug 6", etc.).
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "06-Aug-2026" (or "06-Aug" with withYear: false, for tight spaces like
// chart axis labels).
export const formatDateOnly = (value, { withYear = true } = {}) => {
  const date = toValidDate(value);
  if (!date) {
    return "Unknown";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_ABBREVIATIONS[date.getMonth()];

  return withYear ? `${day}-${month}-${date.getFullYear()}` : `${day}-${month}`;
};

// "02:34 PM"
export const formatTimeOnly = (value) => {
  const date = toValidDate(value);
  if (!date) {
    return "";
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

// "06-Aug-2026 02:34 PM" — plain-string form for contexts that can't render
// JSX (title/tooltip attributes, toasts, alert text).
export const formatDateTimeText = (value) => {
  const date = toValidDate(value);
  if (!date) {
    return "Unknown";
  }

  const time = formatTimeOnly(date);
  return time ? `${formatDateOnly(date)} ${time}` : formatDateOnly(date);
};
