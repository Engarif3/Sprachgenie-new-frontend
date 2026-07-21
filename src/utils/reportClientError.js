import { publicApi } from "../axios";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_STACK_LENGTH = 8000;

// Best-effort, fire-and-forget report of a client-side crash or network
// failure to the backend's error log (visible in the admin dashboard).
// Uses publicApi (no auth, no response interceptor) so a failure here can
// never itself throw or trigger another alert — this runs precisely when
// the app may already be in a broken state.
export const reportClientError = ({ message, stack, path } = {}) => {
  try {
    publicApi
      .post("/error-logs/client", {
        message: String(message || "Unknown client error").slice(
          0,
          MAX_MESSAGE_LENGTH,
        ),
        stack: stack ? String(stack).slice(0, MAX_STACK_LENGTH) : undefined,
        path:
          path || (typeof window !== "undefined" ? window.location.pathname : undefined),
      })
      .catch(() => {});
  } catch {
    // no-op — reporting an error must never itself throw
  }
};
