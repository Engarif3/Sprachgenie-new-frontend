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

const VisitorLocationConsent = ({ onDecision }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-gray-900 via-slate-950 to-black p-4 text-sm text-gray-200 shadow-2xl">
        <p>
          Allow SprachGenie to use your device&apos;s precise location for
          more accurate visit analytics? We always record an approximate,
          network-based location either way. Declining has no effect on using
          the site.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDecision(false)}
            className="rounded-full border border-gray-700 px-4 py-2 font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-white/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onDecision(true)}
            className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
          >
            Allow precise location
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorLocationConsent;
