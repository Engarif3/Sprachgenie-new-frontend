// utility function
export const dateTimeFormatter = (dateString) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0"); // DD
  const month = String(date.getMonth() + 1).padStart(2, "0"); // MM
  const year = date.getFullYear(); // YYYY

  let hours = date.getHours(); // 0-23
  const minutes = String(date.getMinutes()).padStart(2, "0"); // MM
  const seconds = String(date.getSeconds()).padStart(2, "0"); // SS

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert 0 to 12 for 12 AM
  const formattedHours = String(hours).padStart(2, "0");

  return `${day}.${month}.${year} - ${formattedHours}:${minutes}:${seconds} ${ampm}`;
};
