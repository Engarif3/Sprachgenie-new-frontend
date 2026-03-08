import Container from "../../utils/Container";
import HomeCard from "./HomeCard";
import CircularText from "./CircularText";
import SplashCursor from "./SplashCursor";
import SplitText from "./SplitText";
import Marquee from "react-fast-marquee";
import { isLoggedIn } from "../../services/auth.services";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Contact from "./Contact";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

const Home = () => {
  const userLoggedIn = isLoggedIn();
  const [visibleSections, setVisibleSections] = useState(new Set());
  const { t } = useTranslation("home");
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.2, rootMargin: "50px" },
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    // <div className="bg-gray-950 min-h-screen">
    // <div className="min-h-screen">
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      {/* Hero Section */}
      <Container className="flex flex-col">
        {!userLoggedIn && (
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
        )}
        <CircularText
          text="PRACTICE *MAKES *PERFECT *"
          centerText1="Sprach"
          centerText2="Genie"
          onHover="speedUp"
          spinDuration={25}
          className="font-custom3"
        />

        {/* Hero Content */}
        <div className="text-center pt-6 pb-24 md:pb-[280px] px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
            {t("heroTitle")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              {" "}
              {t("heroTitleHighlight")}{" "}
            </span>
            {t("heroTitleEnd")}
          </h1>
          <p className="text-sm md:text-2xl text-gray-800 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            {t("heroDescription")}
          </p>

          {/* Benefits Section */}
          {!userLoggedIn && (
            <div className="mb-16 max-w-4xl mx-auto">
              <p className="text-lg text-cyan-500 dark:text-cyan-400 font-semibold mb-8">
                {t("featuresUnlocked")}
              </p>
              <div className="flex flex-wrap justify-center gap-1 md:gap-8 lg:gap-8">
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    ❤️ {t("favoriteWords")}
                  </div>
                ) : (
                  <SplitText
                    text={`❤️ ${t("favoriteWords")}`}
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
                  />
                )}
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    🤖 {t("aiPoweredLearning")}
                  </div>
                ) : (
                  <SplitText
                    text={`🤖 ${t("aiPoweredLearning")}`}
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
                  />
                )}
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    🌐 {t("translationFeatures")}
                  </div>
                ) : (
                  <SplitText
                    text={`🌐 ${t("translationFeatures")}`}
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
                  />
                )}
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    📊 {t("personalDashboard")}
                  </div>
                ) : (
                  <SplitText
                    text={`📊 ${t("personalDashboard")}`}
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
                  />
                )}
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    📈 {t("progressTracking")}
                  </div>
                ) : (
                  <SplitText
                    text={`📈 ${t("progressTracking")}`}
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
                  />
                )}
                {isMobile ? (
                  <div
                    className={`${theme === "dark" ? "text-white" : "text-black"} font-semibold text-md`}
                  >
                    ⚡ {t("muchMore")}
                  </div>
                ) : (
                  <SplitText
                    text={`⚡ ${t("muchMore")}`}
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
                  />
                )}
              </div>
            </div>
          )}

          {/* Featured Vocabulary Access */}
          <div className="mt-16 mb-6">
            <Link
              to="/words"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-12 py-5 bg-slate-950 text-white font-bold transition-all duration-300 hover:scale-105"
            >
              {/* 1. The Full-Border Spark Layer */}
              <span className="absolute inset-0 block rounded-full">
                <span
                  className="absolute aspect-square w-[200%] animate-rotate [left:50%] [top:50%] [transform-origin:0_0] blur-sm"
                  style={{
                    backgroundImage:
                      theme === "light"
                        ? "conic-gradient(from 0deg, transparent 0deg 340deg, #4b5563 360deg)"
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
                        ? "conic-gradient(from 0deg, transparent 0deg 340deg, rgba(75, 85, 99, 0.8) 360deg)"
                        : "conic-gradient(from 0deg, transparent 0deg 340deg, rgba(255,255,255,0.8) 360deg)",
                  }}
                />
              </span>

              {/* 3. The Center Background (Covers the middle of the spark) */}
              <span className="absolute inset-[3px] rounded-full bg-gradient-to-r from-orange-900 via-pink-900 to-purple-900" />

              {/* 4. Content */}
              <span className="relative z-10 flex items-center gap-3 text-lg text-white">
                <span className="text-2xl">📚</span>
                <span className="text-white">{t("exploreVocabulary")}</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform text-white">
                  →
                </span>
              </span>
            </Link>
            {/* ================== */}
          </div>

          {!userLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-blue-900 text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                {t("startLearning")}
              </Link>
              <Link
                to="/login"
                className={`px-8 py-4 bg-transparent border-2 border-orange-500 ${theme === "dark" ? "text-white" : "text-black"} font-bold rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 text-lg`}
              >
                {t("login")}
              </Link>
            </div>
          )}
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
            className={`mb-16 relative transition-all duration-1000 ${
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
            <p className="text-center text-xl md:text-2xl text-gray-950 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t("everythingYouNeed")}
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 transition-all duration-1000 delay-300 ${
              visibleSections.has("resources")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <HomeCard
              title={t("vocabCardTitle")}
              text={t("vocabCardDesc")}
              link="/words"
              icon="📚"
            />
            <HomeCard
              title={t("storiesCardTitle")}
              text={t("storiesCardDesc")}
              link="/stories"
              icon="📗"
            />
            <HomeCard
              title={t("grammarCardTitle")}
              text={t("grammarCardDesc")}
              link="/grammar"
              icon="📖"
            />
            <HomeCard
              title={t("prefixCardTitle")}
              text={t("prefixCardDesc")}
              link="/prefix-types"
              icon="🔤"
            />

            <HomeCard
              title={t("conversationCardTitle")}
              text={t("conversationCardDesc")}
              link="/conversation-titles"
              icon="💬"
            />
            <HomeCard
              title={t("quizCardTitle")}
              text={t("quizCardDesc")}
              link="/quiz"
              icon="🎮"
            />
          </div>
        </Container>
      </div>

      {/* Why Choose SprachGenie? */}
      <div className="py-20" id="features" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("features")
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

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 transition-all duration-1000 delay-300 ${
              visibleSections.has("features")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("aiPoweredContent")}
              </h3>
              <p className="text-white">{t("aiContentDesc")}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("wordsLibrary")}
              </h3>
              <p className="text-white">{t("wordsLibraryDesc")}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("realConversations")}
              </h3>
              <p className="text-white">{t("realConversationsDesc")}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("interactiveStories")}
              </h3>
              <p className="text-white">{t("interactiveStoriesDesc")}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4"></div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("grammarMastery")}
              </h3>
              <p className="text-white">{t("grammarMasteryDesc")}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("funQuizzes")}
              </h3>
              <p className="text-white">{t("funQuizzesDesc")}</p>
            </div>
          </div>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="py-20" id="how-it-works" data-animate>
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
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 px-4 transition-all duration-1000 delay-300 ${
              visibleSections.has("how-it-works")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-orange-500/50">
                1
              </div>
              <h3
                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-black"} mb-4`}
              >
                {t("signUp")}
              </h3>
              <p
                className={`${theme === "dark" ? "text-white" : "text-black"} text-lg`}
              >
                {t("signUpDesc")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-orange-500/50">
                2
              </div>
              <h3
                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-black"} mb-4`}
              >
                {t("chooseYourPath")}
              </h3>
              <p
                className={`${theme === "dark" ? "text-white" : "text-black"} text-lg`}
              >
                {t("chooseYourPathDesc")}
                on your goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-orange-500/50">
                3
              </div>
              <h3
                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-black"} mb-4`}
              >
                {t("learnAndPractice")}
              </h3>
              <p
                className={`${theme === "dark" ? "text-white" : "text-black"} text-lg`}
              >
                {t("learnAndPracticeDesc")}
                skills consistently
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Stats Section */}
      <div
        className="bg-gradient-to-r from-gray-800 to-gray-900 py-20 mx-8"
        id="stats"
        data-animate
      >
        <Container>
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 px-4 transition-all duration-1000 ${
              visibleSections.has("stats")
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 pb-3">
                {t("wordCount")}
              </div>
              <p className="text-white dark:text-gray-300 text-lg font-semibold">
                {t("words")}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 pb-3">
                {t("practicalConversations")}
              </div>
              <p className="text-white dark:text-gray-300 text-lg font-semibold">
                {t("conversationTopics")}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                {t("cefrLevels")}
              </div>
              <p className="text-white dark:text-gray-300 text-lg font-semibold">
                {t("cefrLabel")}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 pb-3">
                {t("aiPowered")}
              </div>
              <p className="text-white dark:text-gray-300 text-lg font-semibold">
                {t("powered")}
              </p>
            </div>
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
            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>{t("isFree")}</span>
                <span className="text-cyan-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                {t("isFreeAnswer")}
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>{t("levelsQuestion")}</span>
                <span className="text-cyan-500  text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                {t("levelsAnswer")}
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>{t("aiQuestion")}</span>
                <span className="text-cyan-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                {t("aiAnswer")}
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>{t("offlineQuestion")}</span>
                <span className="text-cyan-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                {t("offlineAnswer")}
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>{t("fluencyQuestion")}</span>
                <span className="text-cyan-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                {t("fluencyAnswer")}
              </p>
            </details>

            {/* <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>Can I get a certificate?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                While SprachGenie doesn't offer official language certificates,
                our comprehensive learning system prepares you excellently for
                recognized exams like Goethe-Zertifikat, TestDaF, and TELC.
              </p>
            </details> */}
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
