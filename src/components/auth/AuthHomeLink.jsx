import { Link } from "react-router-dom";
import { IoChevronBack, IoHomeOutline } from "react-icons/io5";

const AuthHomeLink = () => {
  return (
    <Link
      to="/"
      className="fixed left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-sky-400/50 hover:bg-slate-900/85 hover:text-sky-100 hover:shadow-sky-950/30 md:left-6 md:top-6"
      aria-label="Go back to home page"
      title="Home"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-900/30">
        <IoHomeOutline size={16} />
      </span>
      <span>Home</span>
      <IoChevronBack size={16} className="opacity-70" />
    </Link>
  );
};

export default AuthHomeLink;
