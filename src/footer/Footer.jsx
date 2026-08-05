import { Link } from "react-router-dom";
import { FaLinkedinIn, FaGlobe, FaEnvelope } from "react-icons/fa";

const EXPLORE_LINKS = [
  { to: "/words", label: "Vocabulary" },
  { to: "/grammar", label: "Grammar" },
  { to: "/stories", label: "Stories" },
  { to: "/conversation-titles", label: "Conversations" },
  { to: "/how-to-say-in-german", label: "How to Say It" },
  { to: "/radio", label: "Radio" },
];

const LEGAL_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/impressum", label: "Impressum" },
];

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/in/engarif3",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
  {
    href: "mailto:arif.aust.eng@gmail.com",
    label: "Email",
    Icon: FaEnvelope,
  },
  {
    href: "https://md-arifur-rahman-portfolio.netlify.app/",
    label: "Portfolio",
    Icon: FaGlobe,
  },
];

const FooterHeading = ({ children }) => (
  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </h3>
);

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-sm text-slate-400 transition-colors hover:text-white"
  >
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-2xl font-bold">
              <span className="text-orange-500">Sprach</span>
              <span className="text-sky-400">Genie</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              A German learning platform for vocabulary, grammar, and
              real-world phrases.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Created by{" "}
              <span className="font-semibold text-slate-300">
                Md Arifur Rahman
              </span>
              <br />
              Chemnitz, Germany
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <FooterHeading>Explore</FooterHeading>
            {EXPLORE_LINKS.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <FooterHeading>Legal</FooterHeading>
            {LEGAL_LINKS.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <FooterHeading>Connect</FooterHeading>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-orange-500/60 hover:text-orange-400"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <a
              href="mailto:arif.aust.eng@gmail.com"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              arif.aust.eng@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} SprachGenie. All rights reserved.</p>
          <p>Topic titles inspired by Telc A1–B2 books.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
