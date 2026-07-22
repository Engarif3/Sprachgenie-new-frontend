import { publicApi } from "../axios";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_STACK_LENGTH = 8000;

// Best-effort, fire-and-forget report to the backend's error log (visible in
// the admin dashboard). Uses publicApi (no auth, no response interceptor) so
// a failure here can never itself throw or trigger another alert — this runs
// precisely when the app may already be in a broken state.
const postErrorReport = (endpoint, { message, stack, path } = {}) => {
  try {
    publicApi
      .post(endpoint, {
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

// A client-side crash or a network failure calling the Main Backend itself.
export const reportClientError = (payload) =>
  postErrorReport("/error-logs/client", payload);

// A network failure calling the separate AI microservice (aiApi) — kept
// distinct so the admin dashboard can tell "Main Backend down" apart from
// "AI service unreachable".
export const reportAiServiceError = (payload) =>
  postErrorReport("/error-logs/ai-service-client", payload);
