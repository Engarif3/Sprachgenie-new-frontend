import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const H2 = ({ children }) => (
  <h2 className="mt-10 mb-3 text-xl font-bold text-slate-900 first:mt-0 dark:text-white md:text-2xl">
    {children}
  </h2>
);

export const P = ({ children }) => (
  <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-300">
    {children}
  </p>
);

export const Ul = ({ children }) => (
  <ul className="mb-4 list-disc space-y-2 pl-6 leading-relaxed text-slate-600 dark:text-slate-300">
    {children}
  </ul>
);

const LegalPageLayout = ({ title, lastUpdated, children }) => {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 md:py-14">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400"
      >
        <ArrowLeft size={16} /> Back to SprachGenie
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
        Last updated: {lastUpdated}
      </p>

      <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
        {children}
      </div>
    </div>
  );
};

export default LegalPageLayout;
