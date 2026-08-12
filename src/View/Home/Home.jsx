import Container from "../../utils/Container";
import HomeCard from "./HomeCard";
import CircularText from "./CircularText";
import SplitText from "./SplitText";
import { useAuth } from "../../services/auth.services";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Contact from "./Contact";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import ScrollStack, { ScrollStackItem } from "./ScrollStack";
import TodaysWordBalloon from "./TodaysWordBalloon";
import { publicApi } from "../../axios";
import {
  IoHeartOutline,
  IoSparklesOutline,
  IoGlobeOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoFlashOutline,
  IoHardwareChipOutline,
  IoLibraryOutline,
  IoChatbubblesOutline,
  IoBookOutline,
  IoSchoolOutline,
  IoGameControllerOutline,
  IoPersonAddOutline,
  IoCompassOutline,
  IoRocketOutline,
  IoChevronDownOutline,
  IoHelpCircleOutline,
} from "react-icons/io5";

// Rounds down to the nearest hundred and appends "+", so the displayed
// count never needs a manual edit as the vocabulary grows (4680 -> "4600+",
// 5145 -> "5100+") and never overstates how many words actually exist.
const formatWordCountLabel = (totalWords) => {
  if (!Number.isFinite(totalWords) || totalWords <= 0) {
    return null;
  }

  const rounded = Math.floor(totalWords / 100) * 100;
  return `${rounded}+`;
};

const Home = () => {
  const { isLoggedIn: userLoggedIn } = useAuth();
  const [visibleSections, setVisibleSections] = useState(new Set());
  // The ScrollStack cards are much taller than their title marker, so by
  // the time you've scrolled partway through the sticky stack, the title
  // has long since scrolled out of view and visibleSections would flip
  // its fade back to invisible mid-scroll. Reveal once and keep it that
  // way instead of toggling with the (now offscreen) title.
  const [featureCardsRevealed, setFeatureCardsRevealed] = useState(false);
  // The hero benefit icons used to render instantly while their labels
  // faded in via SplitText's staggered initialDelay (up to 3s apart), so
  // an icon could sit alone for seconds before its text appeared. Fading
  // the icon in on the same delay keeps each icon+label pair in sync —
  // but SplitText's own GSAP timeline doesn't start at mount, it waits
  // for document.fonts.ready (see SplitText.jsx's fontsLoaded state), so
  // this has to wait on the same signal or the icon still jumps the gun.
  const [pillsRevealed, setPillsRevealed] = useState(false);
  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setPillsRevealed(true);
    } else {
      document.fonts.ready.then(() => setPillsRevealed(true));
    }
  }, []);
  const { t } = useTranslation("home");
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [wordCountLabel, setWordCountLabel] = useState(null);
  // Counts up (never down) through placeholder numbers while the real
  // count is loading, instead of a static "many" — looping back to the
  // start if it reaches the cap before the real count arrives.
  const [randomCount, setRandomCount] = useState(1000);
  const wordCountText = wordCountLabel || `${randomCount}+`;
  // Split the translated "Explore {{count}} Vocabulary Words" string around
  // the count placeholder so the number can get its own loading styling,
  // regardless of where the placeholder falls in a given language.
  const [beforeCount, afterCount] = t("exploreVocabulary", {
    count: "__COUNT__",
  }).split("__COUNT__");

  useEffect(() => {
    let isMounted = true;

    publicApi
      .get("/word/all", { params: { limit: 1 } })
      .then((response) => {
        if (!isMounted) return;
        setWordCountLabel(
          formatWordCountLabel(response.data?.data?.totalWords),
        );
      })
      .catch((error) => {
        console.error("Failed to load total word count:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (wordCountLabel) return;

    const intervalId = setInterval(() => {
      setRandomCount((prev) => {
        const step = (Math.floor(Math.random() * 2) + 1) * 100;
        const next = prev + step;
        return next > 5000 ? 1000 : next;
      });
    }, 350);

    return () => clearInterval(intervalId);
  }, [wordCountLabel]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Reveal-once: once a section has faded in, it stays visible. A
    // toggling observer (hide again on scroll-away) breaks on refresh when
    // the page loads scrolled past the top (browsers restore scroll
    // position on reload) — sections above the fold never get their
    // "entering" intersection and can be crossed going the other direction
    // without ever registering as visible. Matches the same fix already
    // applied to the ScrollStack title below.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          setVisibleSections((prev) => {
            if (prev.has(entry.target.id)) return prev;
            const next = new Set(prev);
            next.add(entry.target.id);
            return next;
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "50px" },
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visibleSections.has("features-title")) {
      setFeatureCardsRevealed(true);
    }
  }, [visibleSections]);

  const featureCards = [
    {
      icon: IoHardwareChipOutline,
      eyebrow: "Smart Engine",
      title: t("aiPoweredContent"),
      description: t("aiContentDesc"),
      accent: "from-sky-200 via-cyan-300 to-teal-400",
      shell:
        "bg-[linear-gradient(135deg,#0f172a_0%,#10243f_30%,#123a5a_68%,#1d5b72_100%)]",
      edge: " border-cyan-100/25",
      glow: "bg-cyan-300/25",
      chip: "AI-first",
    },
    {
      icon: IoLibraryOutline,
      eyebrow: "Vocabulary System",
      title: t("wordsLibrary", { count: wordCountText }),
      description: t("wordsLibraryDesc"),
      accent: "from-blue-200 via-indigo-300 to-sky-400",
      shell:
        "bg-[linear-gradient(135deg,#111827_0%,#14213d_34%,#1d3557_70%,#345b8c_100%)]",
      edge: "border-sky-100/25",
      glow: "bg-sky-300/25",
      chip: "Structured",
    },
    {
      icon: IoChatbubblesOutline,
      eyebrow: "Practical Speaking",
      title: t("realConversations"),
      description: t("realConversationsDesc"),
      accent: "from-violet-200 via-fuchsia-200 to-indigo-300",
      shell:
        "bg-[linear-gradient(135deg,#16112b_0%,#221b3a_32%,#31265a_68%,#4b3f72_100%)]",
      edge: "border-violet-100/25",
      glow: "bg-violet-300/22",
      chip: "Real-world",
    },
    {
      icon: IoBookOutline,
      eyebrow: "Immersive Reading",
      title: t("interactiveStories"),
      description: t("interactiveStoriesDesc"),
      accent: "from-teal-200 via-cyan-200 to-sky-300",
      shell:
        "bg-[linear-gradient(135deg,#0b132b_0%,#102542_28%,#1c3d5a_68%,#2c5364_100%)]",
      edge: "border-teal-100/25",
      glow: "bg-teal-300/25",
      chip: "Context-rich",
    },
    {
      icon: IoSchoolOutline,
      eyebrow: "Deep Understanding",
      title: t("grammarMastery"),
      description: t("grammarMasteryDesc"),
      accent: "from-emerald-200 via-teal-200 to-cyan-300",
      shell:
        "bg-[linear-gradient(135deg,#0a1f1c_0%,#12332f_30%,#1b4d46_68%,#2b6a63_100%)]",
      edge: "border-emerald-100/25",
      glow: "bg-emerald-300/22",
      chip: "Clarity",
    },
    {
      icon: IoGameControllerOutline,
      eyebrow: "Motivation Loop",
      title: t("funQuizzes"),
      description: t("funQuizzesDesc"),
      accent: "from-slate-200 via-blue-200 to-indigo-300",
      shell:
        "bg-[linear-gradient(135deg,#111827_0%,#1e293b_24%,#2b3a55_62%,#44506b_100%)]",
      edge: "border-slate-100/25",
      glow: "bg-indigo-300/20",
      chip: "Playful",
    },
  ];

  const resourceCards = [
    {
      title: t("vocabCardTitle"),
      text: t("vocabCardDesc", { count: wordCountText }),
      link: "/words",
      eyebrow: "Core Library",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 5.5A2.5 2.5 0 0 1 8.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H6V5.5Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 16v2.5A2.5 2.5 0 0 0 8.5 21H20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 7h6M10 10h6"
          />
        </svg>
      ),
    },
    {
      title: t("challengeCardTitle"),
      text: t("challengeCardDesc"),
      link: "/challenge",
      eyebrow: "Daily Challenge",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-5h-5" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.5 15a7 7 0 0 0 12.6 2.5M18.5 9a7 7 0 0 0-12.6-2.5"
          />
        </svg>
      ),
    },
    {
      title: t("radioCardTitle"),
      text: t("radioCardDesc"),
      link: "/radio",
      eyebrow: "Live Listening",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 10.5A2.5 2.5 0 0 1 7.5 8H19a2 2 0 0 1 2 2v6.5A2.5 2.5 0 0 1 18.5 19h-11A2.5 2.5 0 0 1 5 16.5v-6Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 8 15.5 4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 13h.01M12 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM18.5 13h.01"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h3" />
        </svg>
      ),
    },
    {
      title: t("storiesCardTitle"),
      text: t("storiesCardDesc"),
      link: "/stories",
      eyebrow: "Narrative Practice",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6.5C4 5.12 5.12 4 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5V6.5Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 8h8M8 11h8M8 14h5"
          />
        </svg>
      ),
    },
    {
      title: t("conversationCardTitle"),
      text: t("conversationCardDesc"),
      link: "/conversation-titles",
      eyebrow: "Speaking Flows",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 17.5c-2.485 0-4.5-1.79-4.5-4V8.5c0-2.21 2.015-4 4.5-4h10c2.485 0 4.5 1.79 4.5 4v5c0 2.21-2.015 4-4.5 4H12l-4 3v-3H7Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h8M8 13h5"
          />
        </svg>
      ),
    },
    {
      title: t("grammarCardTitle"),
      text: t("grammarCardDesc"),
      link: "/grammar",
      eyebrow: "Rule System",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 6v12" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 10h7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 14h4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
        </svg>
      ),
    },
    {
      title: t("prefixCardTitle"),
      text: t("prefixCardDesc"),
      link: "/prefix-types",
      eyebrow: "Word Building",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h8v8H4z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 4h4v4h-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 16h4v4h-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12h4M18 8v8"
          />
        </svg>
      ),
    },
    {
      title: t("quizCardTitle"),
      text: t("quizCardDesc"),
      link: "/quiz",
      eyebrow: "Retention Check",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v3M12 17v3M4 12h3M17 12h3"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 6.5l2.1 2.1M15.4 15.4l2.1 2.1M17.5 6.5l-2.1 2.1M8.6 15.4l-2.1 2.1"
          />
        </svg>
      ),
    },
  ];

  const howItWorksSteps = [
    {
      icon: IoPersonAddOutline,
      color: "from-sky-500 to-blue-600 shadow-sky-500/30",
      glow: "bg-sky-500/50",
      title: t("signUp"),
      description: t("signUpDesc"),
    },
    {
      icon: IoCompassOutline,
      color: "from-violet-500 to-purple-600 shadow-violet-500/30",
      glow: "bg-violet-500/50",
      title: t("chooseYourPath"),
      description: `${t("chooseYourPathDesc")} on your goals`,
    },
    {
      icon: IoRocketOutline,
      color: "from-orange-500 to-pink-500 shadow-orange-500/30",
      glow: "bg-orange-500/50",
      title: t("learnAndPractice"),
      description: `${t("learnAndPracticeDesc")} skills consistently`,
    },
  ];

  const statTiles = [
    {
      icon: IoLibraryOutline,
      value: t("wordCount", { count: wordCountText }),
      label: t("words"),
    },
    {
      icon: IoChatbubblesOutline,
      value: t("practicalConversations"),
      label: t("conversationTopics"),
    },
    {
      icon: IoSchoolOutline,
      value: t("cefrLevels"),
      label: t("cefrLabel"),
    },
    {
      icon: IoHardwareChipOutline,
      value: t("aiPowered"),
      label: t("powered"),
    },
  ];

  const faqItems = [
    { question: t("isFree"), answer: t("isFreeAnswer") },
    { question: t("levelsQuestion"), answer: t("levelsAnswer") },
    { question: t("aiQuestion"), answer: t("aiAnswer") },
    { question: t("offlineQuestion"), answer: t("offlineAnswer") },
    { question: t("fluencyQuestion"), answer: t("fluencyAnswer") },
  ];

  return (
    // <div className="bg-gray-950 min-h-screen">
    // <div className="min-h-screen">
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      {/* Hero Section */}
      <Container className="flex flex-col">
        {/* {!userLoggedIn && (
          <div className="text-orange-600 text-lg md:text-2xl lg:text-2xl flex justify-center py-8 md:mb-8 lg:mb-8 overflow-hidden ">
            <div className="w-11/12 md:w-7/12 lg:w-7/12">
              <Marquee
                gradient={true}
                gradientColor={theme === "light" ? "" : ""}
                speed={50}
                pauseOnHover={true}
              >
                <p className="mx-4 italic text-gray-950 dark:text-orange-600 ">
                  <span className="text-cyan-500 font-bold">
                    {t("loginToUnlock")}
                  </span>{" "}
                  {t("bannerMessage")}
                </p>
              </Marquee>
            </div>
          </div>
        )} */}

        <div className="relative">
          <div className="pointer-events-none absolute -top-8 z-10 hidden origin-top-left md:scale-[0.6] md:-left-1 md:block lg:scale-[0.7] lg:-left-2 xl:scale-[0.8] xl:-left-2 2xl:scale-[0.8] 2xl:-left-2">
            <CircularText
              text="PRACTICE *MAKES *PERFECT *"
              centerText1="Sprach"
              centerText2="Genie"
              onHover="speedUp"
              spinDuration={25}
              className="font-custom3"
            />
          </div>

          {/* Hero Content */}
          <div className="text-center pt-6 md:pt-28 xl:pt-16 pb-36 px-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white mb-4 leading-tight">
              {t("heroTitle")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                {" "}
                {t("heroTitleHighlight")}{" "}
              </span>
              {t("heroTitleEnd")}
            </h1>
            <p className="text-sm md:text-2xl text-gray-800 dark:text-gray-300 mb-1 max-w-3xl mx-auto">
              {t("heroDescription")}
            </p>

            <TodaysWordBalloon />

            {/* Benefits Section */}
            {!userLoggedIn && (
              <div className="mb-4 mt-0 max-w-4xl mx-auto">
                <p className="text-lg text-cyan-500 dark:text-cyan-400 font-semibold mb-3">
                  {t("featuresUnlocked")}
                </p>
                <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 md:gap-x-8 md:gap-y-2 lg:gap-x-8 lg:gap-y-2">
                  <div className="inline-flex items-center gap-1.5">
                    <IoHeartOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "0ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("favoriteWords")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("favoriteWords")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={0}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <IoSparklesOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "600ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("aiPoweredLearning")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("aiPoweredLearning")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={600}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <IoGlobeOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "1200ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("translationFeatures")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("translationFeatures")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={1200}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <IoStatsChartOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "1800ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("personalDashboard")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("personalDashboard")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={1800}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <IoTrendingUpOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "2400ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("progressTracking")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("progressTracking")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={2400}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <IoFlashOutline
                      aria-hidden="true"
                      className={`${isMobile ? "" : `transition-opacity duration-500 ${pillsRevealed ? "opacity-100" : "opacity-0"}`} ${theme === "dark" ? "text-white" : "text-black"}`}
                      style={isMobile ? undefined : { transitionDelay: "3000ms" }}
                    />
                    {isMobile ? (
                      <div
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                      >
                        {t("muchMore")}
                      </div>
                    ) : (
                      <SplitText
                        text={t("muchMore")}
                        delay={20}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 20 }}
                        to={{ opacity: 1, y: 0 }}
                        className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-lg`}
                        threshold={0.1}
                        rootMargin="-100px"
                        initialDelay={3000}
                        scrollTrigger={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${
                userLoggedIn ? "mt-12 -mb-5" : "mt-1 mb-6"
              }`}
            >
              <Link
                to="/words"
                className={`group relative inline-flex items-center gap-2 md:gap-3 overflow-hidden rounded-full px-6 py-2.5 md:px-5 md:py-4 font-bold transition-all duration-300 hover:scale-[1.03] ${
                  theme === "light"
                    ? "border border-slate-200 bg-white text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                    : "bg-slate-950 text-white"
                }`}
              >
                {/* 1. The Full-Border Spark Layer */}
                <span className="absolute inset-0 block rounded-full">
                  <span
                    className="absolute aspect-square w-[200%] animate-rotate [left:50%] [top:50%] [transform-origin:0_0] blur-sm"
                    style={{
                      backgroundImage:
                        theme === "light"
                          ? "conic-gradient(from 0deg, transparent 0deg 340deg, rgba(59,130,246,0.95) 360deg)"
                          : "conic-gradient(from 0deg, transparent 0deg 340deg, white 360deg)",
                    }}
                  />
                </span>

                {/* 2. The Thick Glow Effect (Extra layer for "thickness") */}
                <span className="absolute inset-0 block rounded-full">
                  <span
                    className="absolute aspect-square w-[200%] animate-rotate [left:50%] [top:50%] [transform-origin:0_0] blur-xl opacity-50"
                    style={{
                      backgroundImage:
                        theme === "light"
                          ? "conic-gradient(from 0deg, transparent 0deg 340deg, rgba(56,189,248,0.7) 360deg)"
                          : "conic-gradient(from 0deg, transparent 0deg 340deg, rgba(255,255,255,0.8) 360deg)",
                    }}
                  />
                </span>

                {/* 3. The Center Background (Covers the middle of the spark) */}
                <span
                  className={`absolute inset-[3px] rounded-full ${
                    theme === "light"
                      ? "bg-[linear-gradient(135deg,#ffffff,#f8fafc)]"
                      : "bg-gradient-to-r from-orange-900 via-pink-900 to-purple-900"
                  }`}
                />

                {/* 4. Content */}
                <span
                  className={`relative z-10 flex items-center gap-2 md:gap-3 text-sm md:text-lg ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  <IoBookOutline aria-hidden="true" size={20} />
                  <span
                    className={
                      theme === "light" ? "text-slate-900" : "text-white"
                    }
                  >
                    {beforeCount}
                    <span className="tabular-nums">{wordCountText}</span>
                    {afterCount}
                  </span>
                </span>
              </Link>

              {!userLoggedIn && (
                <Link
                  to="/login"
                  className={`px-6 py-1.5 md:px-5 md:py-2 bg-transparent border-2 border-sky-500 ${theme === "dark" ? "text-white" : "text-black"} font-bold rounded-full hover:bg-sky-700 hover:text-white transition-all duration-300 text-sm md:text-lg capitalize`}
                >
                  {t("login")}
                </Link>
              )}
            </div>

            {/* Scroll Hint */}
            <div className=" absolute  left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-800 dark:text-white/80 pointer-events-none mb-2">
              <span className="text-xs font-bold tracking-widest uppercase mt-20">
                {t("scrollToExplore")}
              </span>
              <svg
                className="w-5 h-5 animate-bounce mt-2 font-bolder text-orange-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Container>

      {/* Learning Resources Section */}
      <div
        className="relative py-20 overflow-hidden"
        id="resources"
        data-animate
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Container>
          <div
            className={`mb-16  relative transition-all duration-1000 ${
              visibleSections.has("resources")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center mb-4">
              <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm mb-6">
                {t("learningHub")}
              </span>
            </div>
            <h2 className="text-center text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 dark:text-white pb-8">
              {t("learningResources")}
            </h2>
            <p className="text-center  text-xl md:text-2xl text-gray-950 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t("everythingYouNeed")}
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          <div
            className={`mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3 xl:max-w-[86rem] transition-all duration-1000 delay-300 ${
              visibleSections.has("resources")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {resourceCards.map((card, cardIndex) => {
              // Only the LAST card of the LAST row needs special treatment,
              // and only when it's truly alone in that row (a 3-column grid
              // leaves exactly one card stranded when the total count % 3
              // === 1). At any other remainder (0 = full rows, 2 = a normal
              // two-card row), every card renders as a plain grid item —
              // forcing the solo-center treatment there was what made an
              // 8-card grid (2 leftover) look broken, with the 7th card
              // sitting alone above a full-width-centered 8th card.
              const isLastCard = cardIndex === resourceCards.length - 1;
              const isStrandedAlone = resourceCards.length % 3 === 1;

              if (!isLastCard || !isStrandedAlone) {
                return (
                  <HomeCard
                    key={card.title}
                    title={card.title}
                    text={card.text}
                    link={card.link}
                    icon={card.icon}
                    eyebrow={card.eyebrow}
                  />
                );
              }

              return (
                <div key={card.title} className="md:col-span-2 lg:col-span-3">
                  <div className="mx-auto w-full max-w-md">
                    <HomeCard
                      title={card.title}
                      text={card.text}
                      link={card.link}
                      icon={card.icon}
                      eyebrow={card.eyebrow}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Why Choose SprachGenie? */}
      <div className="py-20" id="features">
        {/* TITLE inside Container (safe) — data-animate lives on just this
        block (not the whole section) so the fade-in triggers based on the
        title's own visibility, not on 20% of the entire ScrollStack below
        it being in view, which could take a long scroll to satisfy. */}
        <Container>
          <div
            id="features-title"
            data-animate
            className={`text-center mb-16  transition-all duration-1000 ${
              visibleSections.has("features-title")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 dark:text-white pb-8">
              {t("whyChooseSprachGenie")}
            </h2>

            <p className="text-xl text-gray-950 dark:text-gray-300 max-w-2xl mx-auto">
              {t("poweredByAI")}
            </p>

            <div className="flex justify-center mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </Container>

        {/* ScrollStack — always rendered at full opacity, no scroll-gated
        fade for the section as a whole. It used to hide behind a
        scroll-triggered reveal (matching the fade-in used elsewhere on the
        page), but the section's own height is several times the viewport,
        so any single small trigger marker — above it, below it, wherever —
        could only ever catch ONE scroll direction quickly; approaching from
        the other direction meant scrolling through the whole (invisible)
        stack first. Only the first card's own small slide-up-and-fade
        entrance (via `revealed`, scoped to that one card in ScrollStack.jsx)
        still plays, since that can't hide the rest of the section. */}
        {isDesktop ? (
          <div className="mx-auto w-full max-w-6xl px-4">
            <ScrollStack
              layoutVersion={userLoggedIn ? "logged-in" : "guest"}
              revealed={featureCardsRevealed}
            >
              {featureCards.map((feature, index) => (
                <ScrollStackItem
                  key={feature.title}
                  itemClassName={`group overflow-hidden border ${feature.edge} ${feature.shell} shadow-[0_30px_80px_rgba(15,23,42,0.28)]`}
                >
                  <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_34%)] opacity-80 " />
                  <div
                    className={`absolute -right-16 top-0 h-56 w-56 rounded-full blur-3xl ${feature.glow}`}
                  />
                  <div
                    className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${feature.accent} opacity-55`}
                  />
                  <div className="relative flex h-full flex-col justify-between pb-4 text-left text-white ">
                    <div>
                      <div className="mb-5 flex items-start justify-between gap-5 rounded-[24px] bg-slate-950/28 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.06)] backdrop-blur-md  border-b-2 border-cyan-950 ">
                        <div>
                          <div className="mb-3 inline-flex items-center rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
                            {feature.eyebrow}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/30 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_rgba(0,0,0,0.18)]">
                              <feature.icon size={28} aria-hidden="true" />
                            </div>
                            <div className="rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold tracking-[0.14em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-[12px] font-semibold tracking-[0.08em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                          {feature.chip}
                        </div>
                      </div>

                      <h3 className="max-w-lg text-[27px] font-semibold leading-[1.1] text-white">
                        {feature.title}
                      </h3>

                      <p className="mt-3  w-full text-[14px] leading-6 text-white/88">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4 pb-5 text-sm text-white/80">
                      <span className="font-medium ">
                        Built for modern learners
                      </span>
                      <span className="text-white/60">SprachGenie</span>
                    </div>
                  </div>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        ) : (
          <Container>
            <div
              className={`grid grid-cols-1 gap-6 px-4 md:grid-cols-2 transition-all duration-1000 delay-300 ${
                featureCardsRevealed
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {featureCards.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-[28px] border ${feature.edge} ${feature.shell} p-7 shadow-[0_20px_60px_rgba(15,23,42,0.22)]`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
                  <div
                    className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${feature.accent} opacity-55`}
                  />

                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between gap-4 rounded-[22px] bg-slate-950/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(0,0,0,0.18)]">
                        <feature.icon size={24} aria-hidden="true" />
                      </div>
                      <div className="rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>

                    <div className="mb-3 inline-flex items-center rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_18px_rgba(0,0,0,0.14)]">
                      {feature.eyebrow}
                    </div>

                    <h3 className="text-2xl font-semibold leading-tight text-white">
                      {feature.title}
                    </h3>

                    <p className="mt-4 text-base leading-7 text-white">
                      {feature.description}
                    </p>

                    <div className="mt-6 inline-flex rounded-full border border-white/30 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                      {feature.chip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        )}
      </div>

      {/* How It Works Section */}
      <div className="pb-20" id="how-it-works" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("how-it-works")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 dark:text-white pb-8 ">
              {t("howItWorks")}
            </h2>
            <p className="text-xl text-gray-950 dark:text-gray-300 max-w-2xl mx-auto">
              {t("startYourJourneySteps")}
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-8 px-4 transition-all duration-1000 delay-300 md:grid-cols-3 ${
              visibleSections.has("how-it-works")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {howItWorksSteps.map((step) => (
              <div
                key={step.title}
                className={`group relative flex flex-col rounded-3xl border p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${
                  theme === "dark"
                    ? "border-white/10 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-orange-400/40"
                    : "border-slate-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-2xl blur-xl ${step.glow}`}
                  />
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-105 ${step.color}`}
                  >
                    <step.icon
                      size={32}
                      className="text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <h3
                  className={`mb-3 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-slate-600"}`}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Stats Section */}
      <div
        className={`py-20 mx-0 md:mx-8 lg:mx-8 rounded-none md:rounded-[40px] ${
          theme === "dark"
            ? "bg-[linear-gradient(135deg,#111827_0%,#0f172a_50%,#1e1b2e_100%)]"
            : "bg-gradient-to-br from-slate-50 via-orange-50/40 to-slate-50 border border-slate-200"
        }`}
        id="stats"
        data-animate
      >
        <Container>
          <div
            className={`grid grid-cols-2 gap-4 px-4 transition-all duration-1000 md:gap-6 lg:grid-cols-4 ${
              visibleSections.has("stats")
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            {statTiles.map((stat) => (
              <div
                key={stat.label}
                className={`group flex flex-col items-center rounded-3xl border px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 ${
                  theme === "dark"
                    ? "border-white/10 bg-white/5 hover:border-orange-400/30 hover:bg-white/[0.08]"
                    : "border-slate-200 bg-white hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-500 transition-transform duration-300 group-hover:scale-105 dark:text-orange-400">
                  <stat.icon size={22} aria-hidden="true" />
                </div>
                <div className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 pb-2">
                  {stat.value}
                </div>
                <p className="text-slate-600 dark:text-gray-300 text-base md:text-lg font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* FAQ Section */}
      <div className=" py-20" id="faq" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("faq")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 dark:text-white pb-8">
              {t("frequentlyAskedQuestions")}
            </h2>
            <p className="text-xl text-gray-950 dark:text-gray-300 max-w-2xl mx-auto">
              {t("everythingYouNeedToKnow")}
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          <div
            className={`max-w-4xl mx-auto px-4 space-y-6 transition-all duration-1000 delay-300 ${
              visibleSections.has("faq")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {faqItems.map((item) => (
              <details
                key={item.question}
                className={`group rounded-2xl border p-6 transition-colors duration-300 ${
                  theme === "dark"
                    ? "border-white/10 bg-gradient-to-br from-gray-800/80 to-gray-900/80 open:border-orange-400/40"
                    : "border-slate-200 bg-white open:border-orange-300"
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span
                    className={`flex items-center gap-3 text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
                  >
                    <IoHelpCircleOutline
                      aria-hidden="true"
                      size={22}
                      className="shrink-0 text-orange-500"
                    />
                    {item.question}
                  </span>
                  <IoChevronDownOutline
                    aria-hidden="true"
                    size={20}
                    className={`shrink-0 transition-transform duration-300 group-open:rotate-180 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}
                  />
                </summary>
                <p
                  className={`mt-4 leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-slate-600"}`}
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </div>

      {/* CTA Section */}
      {!userLoggedIn && (
        <div
          className="bg-gradient-to-r from-gray-800 to-gray-900 py-20 mx-8"
          id="cta"
          data-animate
        >
          <Container>
            <div
              className={`text-center px-4 transition-all duration-1000 ${
                visibleSections.has("cta")
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t("readyToMaster")}
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t("startYourFreeJourney")}
              </p>
              <Link
                to="/register"
                className="inline-block px-12 py-5 bg-pink-700 text-white font-bold rounded-full hover:bg-pink-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-xl"
              >
                {t("startLearning")}
              </Link>
            </div>
          </Container>
        </div>
      )}

      {/* Contact Section */}
      <Contact />
    </div>
  );
};

export default Home;
