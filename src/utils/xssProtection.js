/**
 * XSS Protection Utility
 * Prevents Cross-Site Scripting attacks by sanitizing user input
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text safe for HTML rendering
 */
export function escapeHtml(text) {
  if (!text) return "";

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>\"']/g, "") // Remove HTML special chars
    .substring(0, 255); // Limit length to prevent DoS
}

/**
 * Validates and sanitizes URLs to prevent javascript: and data: URLs
 * @param {string} url - The URL to validate
 * @returns {string|null} - Safe URL or null if invalid
 */
export function safeUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url, window.location.origin);
    // Only allow http/https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Safely renders user content with XSS protection
 * Use this component to display user-generated content
 */
export function SafeUserContent({ content, className = "" }) {
  return (
    <div className={className}>
      {/* Content is rendered as text, not HTML, to prevent XSS */}
      {typeof content === "string" ? escapeHtml(content) : content}
    </div>
  );
}

export default {
  escapeHtml,
  sanitizeInput,
  safeUrl,
  SafeUserContent,
};
