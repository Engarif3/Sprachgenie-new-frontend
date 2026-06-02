import React, { useEffect } from "react";

const TENSE_LABELS = {
  präsens: "Präsens",
  perfekt: "Perfekt",
  präteritum: "Präteritum",
};

const ConjugationTable = ({ rows }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left py-2 px-3 text-gray-400 font-semibold w-1/3">
          Pronoun
        </th>
        <th className="text-left py-2 px-3 text-gray-400 font-semibold">
          Conjugation
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(({ pronoun, conjugation }) => (
        <tr
          key={pronoun}
          className="border-b border-gray-800 hover:bg-white/5 transition-colors"
        >
          <td className="py-2 px-3 text-cyan-400 font-medium">{pronoun}</td>
          <td className="py-2 px-3 text-white font-semibold">{conjugation}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TenseSection = ({ label, children }) => (
  <div className="rounded-xl border border-gray-700 overflow-hidden">
    <div className="px-4 py-2.5 bg-gray-800 border-b border-gray-700">
      <span className="text-sm font-bold text-violet-300 tracking-wide">
        {label}
      </span>
    </div>
    <div className="bg-gray-900/60">{children}</div>
  </div>
);

const ConjugationModal = ({ isOpen, onClose, word, data, isLoading, error }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const verbLabel = data?.verb || word?.value || "";
  const meaning = data?.meaning ? `(${data.meaning})` : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">
              AI Conjugation
            </p>
            <h2 className="text-2xl font-bold text-white">
              {verbLabel}{" "}
              {meaning && (
                <span className="text-base font-normal text-gray-400">
                  {meaning}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="mt-1 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">
                Generating conjugation table…
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-red-400 font-semibold">
                Failed to generate conjugation
              </p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Präsens */}
              <TenseSection label={TENSE_LABELS.präsens}>
                <ConjugationTable rows={data.präsens} />
              </TenseSection>

              {/* Perfekt */}
              <TenseSection label={TENSE_LABELS.perfekt}>
                {data.perfekt?.auxiliary && data.perfekt?.participleForm && (
                  <div className="px-4 py-2.5 bg-violet-900/20 border-b border-gray-800 text-sm">
                    <span className="text-gray-400">Auxiliary: </span>
                    <span className="text-violet-300 font-bold">
                      {data.perfekt.auxiliary}
                    </span>
                    <span className="text-gray-500 mx-2">+</span>
                    <span className="text-emerald-300 font-bold">
                      {data.perfekt.participleForm}
                    </span>
                  </div>
                )}
                <ConjugationTable rows={data.perfekt?.conjugations ?? []} />
              </TenseSection>

              {/* Präteritum */}
              <TenseSection label={TENSE_LABELS.präteritum}>
                <ConjugationTable rows={data.präteritum} />
              </TenseSection>
            </>
          )}
        </div>

        {/* Footer */}
        {data && !isLoading && (
          <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              Generated by AI · verify with a grammar reference
            </span>
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConjugationModal;
