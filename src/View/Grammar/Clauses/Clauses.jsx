import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Container from "../../../utils/Container";
import { useTheme } from "../../../context/ThemeContext";
import coordinatingData from "./Coordinating/coordinating.json";
import subordinatingData from "./Subordinating/subordinating.json";
import conjunctiveData from "./ConjunctiveAdverb/conjunctive.json";
import othersData from "./Others/other.json";

// Same four categories the old /clause/:id sub-pages covered, now merged
// into one page with tabs instead of separate routes.
const CATEGORIES = [
  {
    key: "coordinating",
    label: "Coordinating",
    heading: "Coordinating Conjunctions",
    germanLabel: "Nebenordnende Konjunktionen",
    subheading:
      "These conjunctions do not affect the word order (verb position) in the sentence.",
    data: coordinatingData,
  },
  {
    key: "subordinating",
    label: "Subordinating",
    heading: "Subordinating Conjunctions",
    germanLabel: "Unterordnende Konjunktionen",
    subheading:
      "These conjunctions change the word order (the verb goes to the end).",
    data: subordinatingData,
  },
  {
    key: "conjunctive",
    label: "Conjunctive",
    heading: "Conjunctive Adverbs",
    germanLabel: "Konjunktive Adverbien",
    subheading:
      "These function like conjunctions, but the verb comes right after them.",
    data: conjunctiveData,
  },
  {
    key: "others",
    label: "Others",
    heading: "Non Conjunctions",
    germanLabel: "Nicht Konjunktion",
    subheading:
      "These words aren't conjunctions but are easily confused with them.",
    data: othersData,
  },
];

// Unchanged from the old per-category pages: bolds every token of the
// conjunction (which may be a multi-word/split pair like "entweder … oder")
// wherever it appears in an example sentence.
const highlightConjunction = (sentence, conjunction, isLight) => {
  const conjunctionParts = conjunction
    .split(" … ")
    .map((part) => part.trim().toLowerCase().split(/\s+/));

  const tokens = sentence.split(/(\s+)/).map((token, index) => ({
    original: token,
    clean: token
      .replace(/[.,!?;:()]/g, "")
      .toLowerCase()
      .trim(),
    index,
    isWhitespace: /^\s+$/.test(token),
  }));

  const nonWhitespaceTokens = tokens.filter((t) => !t.isWhitespace);
  const highlightedIndices = new Set();

  conjunctionParts.forEach((part) => {
    const partLength = part.length;
    for (let i = 0; i <= nonWhitespaceTokens.length - partLength; i++) {
      const sequence = nonWhitespaceTokens
        .slice(i, i + partLength)
        .map((t) => t.clean);

      if (sequence.join(" ") === part.join(" ")) {
        nonWhitespaceTokens
          .slice(i, i + partLength)
          .forEach((t) => highlightedIndices.add(t.index));
      }
    }
  });

  return tokens.map((token, index) =>
    highlightedIndices.has(token.index) ? (
      <span
        key={index}
        className={`font-bold ${isLight ? "text-sky-600" : "text-sky-400"}`}
      >
        {token.original}
      </span>
    ) : (
      token.original
    ),
  );
};

// Some example lists pair a main sentence with an alternative phrasing on
// the next line, marked in the source data with a leading "--" (e.g. a
// "wegen" sentence followed by its "weil" equivalent). Groups each
// alternative under the main sentence it belongs to instead of rendering
// the raw "--" marker as its own bullet.
const groupExamplesWithAlternatives = (examples) => {
  const groups = [];

  examples.forEach((example) => {
    const trimmed = example.trim();

    if (trimmed.startsWith("--") && groups.length > 0) {
      groups[groups.length - 1].alternatives.push(
        trimmed.replace(/^--+\s*/, ""),
      );
      return;
    }

    groups.push({ main: example, alternatives: [] });
  });

  return groups;
};

const Clauses = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Flattened once with a stable id + its category attached, so search and
  // the "All" tab can work across every category without re-deriving this
  // on every render.
  const allItems = useMemo(
    () =>
      CATEGORIES.flatMap((category) =>
        category.data.map((item, index) => ({
          ...item,
          _id: `${category.key}-${index}`,
          _categoryKey: category.key,
        })),
      ),
    [],
  );

  const normalizedSearch = searchInput.trim().toLowerCase();

  const matchesSearch = (item) =>
    !normalizedSearch ||
    item.conjunction.toLowerCase().includes(normalizedSearch) ||
    item.meaning.toLowerCase().includes(normalizedSearch);

  const visibleCategories =
    activeTab === "all"
      ? CATEGORIES
      : CATEGORIES.filter((category) => category.key === activeTab);

  const sections = visibleCategories
    .map((category) => ({
      ...category,
      items: allItems.filter(
        (item) => item._categoryKey === category.key && matchesSearch(item),
      ),
    }))
    .filter((category) => category.items.length > 0);

  const toggleExpanded = (itemId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const tabClass = (isActive) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
        : isLight
          ? "border border-slate-200 bg-white text-slate-600 hover:border-orange-300"
          : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/50"
    }`;

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-6xl p-4 pb-12">
        {/* Header */}
        <div className="mb-10 mt-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-6 py-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
            📖 Learn Grammar
          </span>
          <h2 className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Types of Clauses
          </h2>
          <p
            className={`mx-auto mt-3 max-w-2xl text-lg ${isLight ? "text-slate-600" : "text-slate-300"}`}
          >
            German conjunctions and connectors, grouped by how they affect
            word order.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mb-8 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder='Search clauses, e.g. "dass", "weil"...'
            className={`w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                : "border-slate-700 bg-slate-900 text-white placeholder-slate-500"
            }`}
          />
        </div>

        {/* Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={tabClass(activeTab === "all")}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setActiveTab(category.key)}
              className={tabClass(activeTab === category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>

        {sections.length === 0 ? (
          <p
            className={`text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            No clauses match your search.
          </p>
        ) : (
          sections.map((category) => (
            <div key={category.key} className="mb-12 last:mb-0">
              <div className="mb-4">
                <h3
                  className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}
                >
                  {category.heading}
                </h3>
                <p
                  className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  <span className="italic">{category.germanLabel}</span> —{" "}
                  {category.subheading}
                </p>
              </div>

              <div className="space-y-4">
                {category.items.map((item) => {
                  const isExpanded = expandedIds.has(item._id);

                  return (
                    <div
                      key={item._id}
                      className={`w-full overflow-hidden rounded-3xl border shadow-sm transition-colors duration-200 ${
                        isLight
                          ? "border-slate-200 bg-white hover:border-orange-300"
                          : "border-slate-800 bg-slate-900/70 hover:border-orange-500/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item._id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-left md:px-7 md:py-4"
                      >
                        <span
                          className={`text-xl font-bold leading-snug ${isLight ? "text-slate-900" : "text-white"}`}
                        >
                          <span className="uppercase">{item.conjunction}</span>
                          <span
                            className={`ml-2 text-base font-normal normal-case ${isLight ? "text-slate-500" : "text-slate-400"}`}
                          >
                            ({item.meaning})
                          </span>
                          {item.type && (
                            <span
                              className={`ml-2 text-sm font-semibold normal-case ${isLight ? "text-orange-600" : "text-orange-400"}`}
                            >
                              {item.type}
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                            isExpanded ? "rotate-45" : ""
                          } ${
                            isLight
                              ? "border-orange-300 text-orange-500"
                              : "border-orange-500/40 text-orange-400"
                          }`}
                        >
                          <Plus size={18} />
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          className={`space-y-4 border-t pb-6 pl-10 pr-6 pt-4 md:pb-7 md:pl-14 md:pr-7 ${
                            isLight ? "border-slate-100" : "border-slate-800"
                          }`}
                        >
                          {item.ruleName && item.rules && (
                            <div>
                              <span
                                className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${
                                  isLight
                                    ? "border-rose-700 bg-rose-600 text-white"
                                    : "border-rose-500 bg-rose-600 text-white"
                                }`}
                              >
                                {item.ruleName}
                              </span>
                              <ul
                                className={`mt-2 space-y-1 border-l-4 pl-4 text-sm ${
                                  isLight
                                    ? "border-rose-300 text-slate-700"
                                    : "border-rose-500/40 text-slate-300"
                                }`}
                              >
                                {item.rules.map((rule, ruleIndex) => (
                                  <li key={ruleIndex}>{rule}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div>
                            <span
                              className={`inline-block rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white`}
                            >
                              Examples
                            </span>
                            <ul
                              className={`mt-2.5 space-y-2 border-l-4 pl-4 text-base font-medium leading-relaxed ${
                                isLight
                                  ? "border-pink-500 text-slate-700"
                                  : "border-pink-500 text-slate-200"
                              }`}
                            >
                              {groupExamplesWithAlternatives(
                                item.examples,
                              ).map((group, groupIndex) => (
                                <li key={groupIndex}>
                                  {highlightConjunction(
                                    group.main,
                                    item.conjunction,
                                    isLight,
                                  )}
                                  {group.alternatives.map(
                                    (alternative, altIndex) => (
                                      <div
                                        key={altIndex}
                                        className={`mt-1 text-sm font-normal italic ${
                                          isLight
                                            ? "text-purple-600"
                                            : "text-purple-400"
                                        }`}
                                      >
                                        <span className="font-semibold not-italic">
                                          Alternative:
                                        </span>{" "}
                                        {alternative}
                                      </div>
                                    ),
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  );
};

export default Clauses;
