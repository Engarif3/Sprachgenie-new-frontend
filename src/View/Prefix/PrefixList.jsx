import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaPlus, FaMinus, FaFileAlt } from "react-icons/fa";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import api from "../../axios";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";

// Why German grammars group prefixes into these three buckets — shown under
// the page title so "Separable"/"Inseparable"/"Dual" isn't just a label.
// Kept to short, plain-English sentences plus a right/wrong example, since a
// grammar-textbook definition is exactly what a learner comes here to avoid.
// Dual gets two ✓ examples instead of a ✓/✗ pair — both sentences below are
// genuinely correct, just for different meanings of the same verb, so
// marking one "wrong" would teach the wrong lesson.
// Verb/prefix tokens wrapped in **...** are rendered in color by
// renderSentenceWithVerb below, so learners can spot the verb (and where
// its prefix landed) at a glance instead of parsing the whole sentence.
const PREFIX_TYPE_DEFINITIONS = {
  separable: {
    text: "The prefix breaks away from the verb and goes to the end of the sentence.",
    examples: [
      {
        ok: true,
        sentence: "Ich **stehe** früh **auf**.",
        note: "auf goes to the end",
      },
      {
        ok: false,
        sentence: "Ich **aufstehe** früh.",
        note: "auf must not stay on the verb",
      },
    ],
  },
  inseparable: {
    text: "The prefix always stays joined to the verb — it never breaks away.",
    examples: [
      {
        ok: true,
        sentence: "Ich **verstehe** das.",
        note: "ver stays on the verb",
      },
      {
        ok: false,
        sentence: "Ich **stehe** das **ver**.",
        note: "ver can't break away",
      },
    ],
  },
  dual: {
    text: "The same verb can be separable or inseparable, depending on its meaning.",
    // Both marked ✓ (not a ✓/✗ pair) — unlike Separable/Inseparable, there's
    // no "wrong" sentence here: both are genuinely correct German, just for
    // different meanings of the same verb, so marking either one "wrong"
    // would teach the wrong lesson. The full breakdown below covers more
    // verbs; this is just a quick at-a-glance illustration of the pattern.
    examples: [
      {
        ok: true,
        sentence: "Ich **übersetze** das Buch.",
        note: '"translate" — stays joined',
      },
      {
        ok: true,
        sentence: "Wir **setzen** mit der Fähre **über**.",
        note: '"cross over (by ferry)" — breaks away',
      },
    ],
    groups: [
      {
        prefix: "um",
        verbs: [
          {
            form: "umfahren",
            tag: "inseparable",
            meaning: "to drive around",
            examples: [
              {
                de: "Ich **umfahre** die Baustelle.",
                en: "I drive around the construction site.",
              },
              {
                de: "Wir **umfahren** den Stau.",
                en: "We drive around the traffic jam.",
              },
            ],
          },
          {
            form: "umfahren",
            tag: "separable",
            meaning: "to knock over / knock down with a vehicle",
            examples: [
              {
                de: "Das Auto **fährt** das Verkehrsschild **um**.",
                en: "The car knocks over the traffic sign.",
              },
              {
                de: "Er **fährt** fast den Mülleimer **um**.",
                en: "He almost knocks over the trash can.",
              },
            ],
          },
          {
            form: "umschreiben",
            tag: "inseparable",
            meaning: "to paraphrase / describe in other words",
            examples: [
              {
                de: "Ich **umschreibe** das Wort mit einfachen Worten.",
                en: "I describe the word using simple words.",
              },
              {
                de: "Kannst du den Begriff anders **umschreiben**?",
                en: "Can you paraphrase the term differently?",
              },
            ],
          },
          {
            form: "umschreiben",
            tag: "separable",
            meaning: "to rewrite",
            examples: [
              {
                de: "Ich **schreibe** den Satz **um**.",
                en: "I rewrite the sentence.",
              },
              {
                de: "Sie **schreibt** den Text komplett **um**.",
                en: "She completely rewrites the text.",
              },
            ],
          },
        ],
      },
      {
        prefix: "über",
        verbs: [
          {
            form: "übergehen",
            tag: "inseparable",
            meaning: "to ignore / skip / pass over",
            examples: [
              {
                de: "Er **übergeht** meine Frage.",
                en: "He ignores my question.",
              },
              {
                de: "Der Chef **übergeht** meine Meinung.",
                en: "The boss ignores my opinion.",
              },
            ],
          },
          {
            form: "übergehen",
            tag: "separable",
            meaning: "to move on / proceed to something",
            examples: [
              {
                de: "Wir **gehen** zum nächsten Thema **über**.",
                en: "We move on to the next topic.",
              },
              {
                de: "Jetzt **gehen** wir zur nächsten Frage **über**.",
                en: "Now we move on to the next question.",
              },
            ],
          },
          {
            form: "überziehen",
            tag: "inseparable",
            meaning: "to overdraw / exceed",
            examples: [
              {
                de: "Ich **überziehe** mein Konto nicht.",
                en: "I don't overdraw my bank account.",
              },
              {
                de: "Er **überzieht** ständig sein Konto.",
                en: "He constantly overdraws his account.",
              },
            ],
          },
          {
            form: "überziehen",
            tag: "separable",
            meaning: "to put/pull something on over something else",
            examples: [
              {
                de: "Ich **ziehe** mir eine Jacke **über**.",
                en: "I put a jacket on over my clothes.",
              },
              {
                de: "Sie **zieht** dem Kind einen Pullover **über**.",
                en: "She puts a sweater on the child.",
              },
            ],
          },
        ],
      },
      {
        prefix: "unter",
        verbs: [
          {
            form: "unterstellen",
            tag: "inseparable",
            meaning: "to accuse / imply something negative about someone",
            examples: [
              {
                de: "Du **unterstellst** mir, dass ich lüge.",
                en: "You're accusing me of lying.",
              },
              {
                de: "Er **unterstellt** ihr schlechte Absichten.",
                en: "He claims that she has bad intentions.",
              },
            ],
          },
          {
            form: "unterstellen",
            tag: "separable",
            meaning: "to store / put somewhere under shelter",
            examples: [
              {
                de: "Ich **stelle** mein Fahrrad in der Garage **unter**.",
                en: "I store my bicycle in the garage.",
              },
              {
                de: "Wir **stellen** die Fahrräder im Keller **unter**.",
                en: "We store the bicycles in the basement.",
              },
            ],
          },
        ],
      },
      {
        prefix: "durch",
        verbs: [
          {
            form: "durchfahren",
            tag: "inseparable",
            meaning: "to drive / travel through",
            examples: [
              {
                de: "Wir **durchfahren** die Stadt.",
                en: "We drive through the city.",
              },
              {
                de: "Der Zug **durchfährt** mehrere Städte.",
                en: "The train passes through several cities.",
              },
            ],
          },
          {
            form: "durchfahren",
            tag: "separable",
            meaning: "to continue straight through / go all the way without stopping",
            examples: [
              {
                de: "Der Zug **fährt** bis Berlin **durch**.",
                en: "The train goes straight through to Berlin.",
              },
              {
                de: "Wir **fahren** ohne Pause **durch**.",
                en: "We drive straight through without a break.",
              },
            ],
          },
        ],
      },
    ],
  },
};

// Small category badge next to each dual-prefix verb form below.
const TAG_STYLES = {
  inseparable:
    "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  separable:
    "border-orange-300/60 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
};

// Splits a sentence on the **verb** markers above and colors those parts,
// leaving the rest of the sentence in the default text color.
const renderSentenceWithVerb = (sentence) =>
  sentence.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className="font-bold text-orange-600 dark:text-orange-400"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );

// Best-effort verb highlighting for the real, database-sourced sentences in
// the word list below — unlike the hardcoded examples above, these have no
// **markers** telling us exactly where the verb is. Approximated from the
// one piece of grammar we do know for certain about every word here (its
// prefix, its full infinitive, and whether this type is separable or
// inseparable):
//  - separable: the prefix almost always shows up as its own word at the
//    end of the clause, so highlight it wherever it appears standalone.
//  - inseparable: matching on the bare 2-3 letter prefix alone is too
//    broad — plenty of unrelated words happen to start with "er" too (the
//    pronoun "er", or nouns like "Erfolg" sitting right next to the verb
//    they have nothing to do with). Match on the verb's own stem instead
//    (its infinitive minus the last two letters, tolerant of the a/o/u ->
//    ä/ö/ü change some strong verbs make when conjugated, e.g. erhalten ->
//    erhält) so only that specific verb's forms ever get colored.
const highlightPrefixInSentence = (
  sentence,
  prefixName,
  prefixWord,
  isSeparable,
) => {
  if (!prefixName) return sentence;

  // Plain \b/\w treat "ü", "ö", etc. as non-word characters, which breaks
  // boundary detection right at the start of prefixes like "über" — \p{L}
  // (with the u flag) recognizes accented letters correctly.
  let pattern;
  if (isSeparable) {
    const escapedPrefix = prefixName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(
      `(?<![\\p{L}\\p{N}_])(${escapedPrefix})(?![\\p{L}\\p{N}_])`,
      "giu",
    );
  } else {
    const rawStem = (prefixWord || "").slice(0, -2);
    if (!rawStem) return sentence;

    const stemPattern = rawStem
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/a/gi, "[aä]")
      .replace(/o/gi, "[oö]")
      .replace(/u/gi, "[uü]");
    pattern = new RegExp(
      `(?<![\\p{L}\\p{N}_])(${stemPattern}[\\p{L}\\p{N}_]*)`,
      "giu",
    );
  }

  return sentence.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className="font-bold text-orange-600 dark:text-orange-400"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const PrefixList = () => {
  const { id: prefixTypeId } = useParams();
  const [prefixData, setPrefixData] = useState(null);
  const [expandedWords, setExpandedWords] = useState({});
  const [expandedDualVerbs, setExpandedDualVerbs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrefixData = async () => {
      try {
        const response = await api.get(`/prefix/prefix-type/${prefixTypeId}`);
        const data = response.data;
        console.log(data.data);

        if (data.success) {
          // Normalize verb values to boolean
          const normalizedData = {
            ...data.data,
            prefixes: data.data.prefixes.map((prefix) => ({
              ...prefix,
              verb: Boolean(prefix.verb),
              // Force boolean conversion
            })),
          };
          setPrefixData(normalizedData);
        }
      } catch (error) {
        console.error("Error fetching prefix data:", error);
      }
    };

    fetchPrefixData();
  }, [prefixTypeId]);

  const toggleExpand = (wordId) => {
    setExpandedWords((prev) => ({
      ...prev,
      [wordId]: !prev[wordId],
    }));
  };

  const toggleDualVerb = (form) => {
    setExpandedDualVerbs((prev) => ({
      ...prev,
      [form]: !prev[form],
    }));
  };

  // if (!prefixData) {
  //   return <Loader loading={loading} />;
  // }

  if (!prefixData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader loading={loading} />
      </div>
    );
  }

  const groupedPrefixes = prefixData.prefixes.reduce((acc, prefix) => {
    const key = prefix.prefixName.trim().toLowerCase();
    if (!acc[key]) {
      acc[key] = { verbs: [], noVerbs: [] };
    }

    // Handle different verb value types
    if (prefix.verb === true || prefix.verb === "true") {
      acc[key].verbs.push(prefix);
    } else {
      acc[key].noVerbs.push(prefix);
    }
    return acc;
  }, {});

  const sortAlphabetically = (a, b) => a.prefixWord.localeCompare(b.prefixWord);

  const renderWordList = (words) => (
    <div>
      {[...words] // Create copy to avoid mutation
        .sort(sortAlphabetically)
        .map((word, index) => (
          <div key={word.id} className={index !== words.length - 1 ? "" : ""}>
            {/* <div
              className="flex justify-between items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 border border-b-sky-400 "
              onClick={() => toggleExpand(word.id)}
            > */}
            <div
              key={word.id}
              className={`flex justify-between items-center p-3 cursor-pointer transition-all duration-300 border border-gray-700 border-dotted ${
                index % 2 === 0
                  ? " dark:bg-gray-800/40 hover:bg-gray-800/60"
                  : "dark:bg-gray-900/40 hover:bg-gray-900/60"
              }`}
              onClick={() => toggleExpand(word.id)}
            >
              <div>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {word.prefixWord}
                </span>
                <span className="ml-2 text-purple-600 dark:text-purple-300">
                  ({word.meaning.join(", ")})
                </span>
              </div>
              <Button variant="secondary" size="sm">
                {expandedWords[word.id] ? <FaMinus /> : <FaPlus />}
              </Button>
            </div>
            {expandedWords[word.id] && (
              <div className="p-4 dark:bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-black/60 border border-gray-700 border-dotted text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full font-semibold text-green-600 dark:text-green-400 mb-3">
                  <FaFileAlt size={14} aria-hidden="true" />
                  Sentences
                </div>
                <ul className="space-y-2 ml-4 border-l-4 border-pink-500 pl-4">
                  {word.sentences.map((sentence, idx) => (
                    <li
                      key={idx}
                      className="normal-case text-black dark:text-gray-200 leading-relaxed"
                    >
                      {word.verb
                        ? highlightPrefixInSentence(
                            sentence,
                            word.prefixName,
                            word.prefixWord,
                            prefixData.name?.toLowerCase() === "separable",
                          )
                        : sentence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
    </div>
  );

  const definition = PREFIX_TYPE_DEFINITIONS[prefixData.name?.toLowerCase()];

  return (
    <Container>
      <div className="max-w-4xl mx-auto p-4 ">
        <PageHeader
          title={`${prefixData.name} Prefixes`}
          accent="brand"
          align="center"
          className="mb-4"
        />

        {definition && definition.examples && (
          <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              {definition.text}
            </p>
            <div className="mt-4 space-y-2">
              {definition.examples.map((example) => (
                <div
                  key={example.sentence}
                  className="flex items-start gap-2 text-sm"
                >
                  {example.ok ? (
                    <IoCheckmarkCircle
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                  ) : (
                    <IoCloseCircle
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                  )}
                  <span className="text-slate-700 dark:text-slate-200">
                    <span className="font-mono">
                      {renderSentenceWithVerb(example.sentence)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      — {example.note}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {definition && definition.groups && (
          <div className="mb-4">
            {definition.groups.map((group) => (
              <div key={group.prefix} className="mb-4">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 ml-2">
                  {group.prefix.toUpperCase()}
                </h3>
                <div className="rounded-md shadow-sm overflow-hidden">
                  {group.verbs.map((verb, index) => {
                    // Separable/inseparable pairs share the same spelling
                    // (e.g. "umfahren" for both) now that the "|" split
                    // marker is gone, so `verb.form` alone can't tell them
                    // apart as a state/React key — include the tag too.
                    const verbKey = `${group.prefix}-${verb.tag}-${verb.form}`;
                    return (
                    <div key={verbKey}>
                      <div
                        className={`flex justify-between items-center p-3 cursor-pointer transition-all duration-300 border border-gray-700 border-dotted ${
                          index % 2 === 0
                            ? " dark:bg-gray-800/40 hover:bg-gray-800/60"
                            : "dark:bg-gray-900/40 hover:bg-gray-900/60"
                        }`}
                        onClick={() => toggleDualVerb(verbKey)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${TAG_STYLES[verb.tag]}`}
                          >
                            {verb.tag}
                          </span>
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {verb.form}
                          </span>
                          <span className="text-purple-600 dark:text-purple-300">
                            ({verb.meaning})
                          </span>
                        </div>
                        <Button variant="secondary" size="sm">
                          {expandedDualVerbs[verbKey] ? (
                            <FaMinus />
                          ) : (
                            <FaPlus />
                          )}
                        </Button>
                      </div>
                      {expandedDualVerbs[verbKey] && (
                        <div className="p-4 dark:bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-black/60 border border-gray-700 border-dotted text-white">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full font-semibold text-green-600 dark:text-green-400 mb-3">
                            <FaFileAlt size={14} aria-hidden="true" />
                            Sentences
                          </div>
                          <ul className="space-y-2 ml-4 border-l-4 border-pink-500 pl-4">
                            {verb.examples.map((example, idx) => (
                              <li
                                key={idx}
                                className="normal-case text-black dark:text-gray-200 leading-relaxed"
                              >
                                <p className="font-mono">
                                  {renderSentenceWithVerb(example.de)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  → {example.en}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dual already shows its own curated reference above (definition.groups)
            — the raw DB word list would just repeat the same prefixes again,
            so it's skipped for that type and only shown for Separable/Inseparable. */}
        {!definition?.groups &&
          Object.entries(groupedPrefixes).map(
            ([prefixName, { verbs, noVerbs }]) => (
              <div key={prefixName} className="mb-4">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 ml-2">
                  {prefixName.toUpperCase()}
                </h3>
                <div className=" rounded-md shadow-sm overflow-hidden">
                  <div className="space-y-6">
                    {verbs.length > 0 && (
                      <div>
                        <h4 className="p-3 font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600   text-white">
                          Verbs ({verbs.length})
                        </h4>
                        <span className="lowercase text-stone-950">
                          {renderWordList(verbs)}
                        </span>
                      </div>
                    )}
                    {noVerbs.length > 0 && (
                      <div>
                        <h4 className="p-3 font-semibold bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600   text-white rounded-t-md ">
                          Non-Verbs ({noVerbs.length})
                        </h4>
                        <span className="lowercase text-stone-950">
                          {renderWordList(noVerbs)}{" "}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
      </div>
    </Container>
  );
};

export default PrefixList;
