import React from "react";

const CONSENT_STORAGE_KEY = "sg_visitor_location_consent";

export const getStoredLocationConsent = () => {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredLocationConsent = (value) => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Private browsing / storage disabled — decision just won't persist.
  }
};

// Styled like a familiar cookie-consent bar (full-width, flush to the
// bottom) since that's a pattern visitors already recognize — the wording
// itself stays specific to what's actually being requested (this device's
// exact location, not cookies), since consent has to describe what it's
// actually consent for. "Exact" (vs. the "approximate" one mentioned right
// after) carries the same distinction as "precise" did, just in plainer
// language.
const VisitorLocationConsent = ({ onDecision }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-700 bg-gray-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-sm text-gray-200 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="flex-1">
          Allow SprachGenie to use your device&apos;s exact location for more
          accurate visit analytics? We always record an approximate,
          network-based location either way. Declining has no effect on using
          the site.
        </p>
        <div className="flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={() => onDecision(false)}
            className="rounded-md border border-gray-600 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-400 hover:bg-white/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onDecision(true)}
            className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-cyan-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorLocationConsent;
