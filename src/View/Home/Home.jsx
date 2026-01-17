import Container from "../../utils/Container";
import HomeCard from "./HomeCard";
import CircularText from "./CircularText";
import SplashCursor from "./SplashCursor";
import Marquee from "react-fast-marquee";
import { isLoggedIn } from "../../services/auth.services";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Contact from "./Contact";

const Home = () => {
  const userLoggedIn = isLoggedIn();
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.2, rootMargin: "50px" }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen">
      {/* Hero Section */}
      <Container className="flex flex-col">
        {!userLoggedIn && (
          <div className="text-orange-600 text-xl md:text-2xl lg:text-2xl flex justify-center py-8 md:mb-12 lg:mb-12 overflow-hidden">
            <div className="w-11/12 md:w-8/12 lg:w-6/12">
              <Marquee
                gradient={true}
                gradientColor="#030712"
                speed={50}
                pauseOnHover={true}
              >
                <p className="mx-4">
                  ✨Log in to unleash AI-powered magic and step into the future
                  of learning!✨
                </p>
              </Marquee>
            </div>
          </div>
        )}
        <CircularText
          text="PRACTICE*MAKES*PERFECT*"
          centerText1="Sprach"
          centerText2="Genie"
          onHover="speedUp"
          spinDuration={25}
          className="font-custom3"
        />

        {/* Hero Content */}
        <div className="text-center pt-16 pb-[280px] px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Master German with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              {" "}
              AI-Powered{" "}
            </span>
            Learning
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            From vocabulary to conversations, grammar to stories - your complete
            German learning journey starts here
          </p>

          {/* Featured Vocabulary Access */}
          <div className="mt-16 mb-6">
            {/* <Link
              to="/words"
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-orange-900 via-pink-900 to-purple-900 text-white font-bold rounded-full hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-105 transition-all duration-300 text-lg shadow-xl "
            >
              <span className="text-2xl">📚</span>
              <span>Explore 4000+ Vocabulary Words</span>
              <span className="text-xl">→</span>
            </Link> */}
            {/* ================== */}
            <Link
              to="/words"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-12 py-5 bg-slate-950 text-white font-bold transition-all duration-300 hover:scale-105"
            >
              {/* 1. The Full-Border Spark Layer */}
              <span className="absolute inset-0 block rounded-full">
                <span className="absolute aspect-square w-[200%] animate-rotate bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] [left:50%] [top:50%] [transform-origin:0_0] blur-sm" />
              </span>

              {/* 2. The Thick Glow Effect (Extra layer for "thickness") */}
              <span className="absolute inset-0 block rounded-full">
                <span className="absolute aspect-square w-[200%] animate-rotate bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.8)_360deg)] [left:50%] [top:50%] [transform-origin:0_0] blur-xl opacity-50" />
              </span>

              {/* 3. The Center Background (Covers the middle of the spark) */}
              <span className="absolute inset-[3px] rounded-full bg-gradient-to-r from-orange-900 via-pink-900 to-purple-900" />

              {/* 4. Content */}
              <span className="relative z-10 flex items-center gap-3 text-lg">
                <span className="text-2xl">📚</span>
                <span>Explore 4000+ Vocabulary Words</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform">
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
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-transparent border-2 border-orange-500 text-orange-500 font-bold rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 text-lg"
              >
                Sign In
              </Link>
            </div>
          )}
          {/* Scroll Hint */}
          <div className=" absolute  left-1/2 -translate-x-1/2 flex flex-col items-center text-white/80 pointer-events-none mb-2">
            <span className="text-xs font-bold tracking-widest uppercase mt-20">
              Scroll to explore more
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
        className="relative bg-gradient-to-b from-gray-900 via-gray-800/50 to-gray-900 py-20 overflow-hidden"
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
                🚀 Your Learning Hub
              </span>
            </div>
            <h2 className="text-center text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-8">
              Explore Learning Resources
            </h2>
            <p className="text-center text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to master German in one place
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
              title="Vocabulary Library"
              text="Master 4000+ German words with examples, audio, and contextual usage"
              link="/words"
              icon="📚"
            />
            <HomeCard
              title="Conversations"
              text="Practice real-world dialogues on diverse topics to build fluency"
              link="/conversation-titles"
              icon="💬"
            />
            <HomeCard
              title="Words With Prefix"
              text="Understand German word formation with prefix combinations"
              link="/prefix-types"
              icon="🔤"
            />
            <HomeCard
              title="Learn Grammar"
              text="Master German grammar rules with clear explanations and exercises"
              link="/grammar"
              icon="📖"
            />
            <HomeCard
              title="German Stories"
              text="Immerse yourself in engaging stories to enhance reading skills"
              link="/stories"
              icon="📗"
            />
            <HomeCard
              title="Play Quiz"
              text="Test your knowledge with interactive quizzes and challenges"
              link="/quiz"
              icon="🎮"
            />
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/50 py-20" id="features" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("features")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose SprachGenie?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powered by cutting-edge AI to make your German learning journey
              efficient and enjoyable
            </p>
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
                AI-Powered Content
              </h3>
              <p className="text-gray-300">
                AI-generated example sentences and in-depth word explanations to
                help you understand vocabulary in context
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                4000+ Words
              </h3>
              <p className="text-gray-300">
                Comprehensive vocabulary library with examples, audio, and
                contextual usage
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Real Conversations
              </h3>
              <p className="text-gray-300">
                Practice with realistic dialogues on various topics to build
                confidence
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Interactive Stories
              </h3>
              <p className="text-gray-300">
                Immerse yourself in engaging German stories that enhance your
                reading skills
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Grammar Mastery
              </h3>
              <p className="text-gray-300">
                Master German grammar with clear explanations and practical
                exercises
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-700">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Fun Quizzes
              </h3>
              <p className="text-gray-300">
                Test your knowledge with interactive quizzes that make learning
                enjoyable
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-800/30" id="how-it-works" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("how-it-works")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start your journey in three simple steps
            </p>
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
              <h3 className="text-2xl font-bold text-white mb-4">Sign Up</h3>
              <p className="text-gray-300 text-lg">
                Create your free account in seconds and start your personalized
                learning journey
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-orange-500/50">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Choose Your Path
              </h3>
              <p className="text-gray-300 text-lg">
                Select from vocabulary, grammar, stories, or conversations based
                on your goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-orange-500/50">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Learn & Practice
              </h3>
              <p className="text-gray-300 text-lg">
                Practice daily with AI-powered tools and build your German
                skills consistently
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Stats Section */}
      <div className="py-20" id="stats" data-animate>
        <Container>
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 px-4 transition-all duration-1000 ${
              visibleSections.has("stats")
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                4000+
              </div>
              <p className="text-gray-300 text-lg font-semibold">Words</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                50+
              </div>
              <p className="text-gray-300 text-lg font-semibold">
                Conversation Topics
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                A1-B2
              </div>
              <p className="text-gray-300 text-lg font-semibold">CEFR Levels</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                AI
              </div>
              <p className="text-gray-300 text-lg font-semibold">Powered</p>
            </div>
          </div>
        </Container>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800/50 py-20" id="faq" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("faq")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about SprachGenie
            </p>
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
                <span>Is SprachGenie free?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                Yes! SprachGenie is completely free to use. Access thousands of
                words, conversations, grammar lessons, stories, and AI-powered
                learning features at no cost.
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>What German levels does SprachGenie cover?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                SprachGenie currently covers A1 (beginner) to B2
                (upper-intermediate) levels. C1 and C2 (advanced) levels are
                coming soon! Our content is carefully curated to match CEFR
                standards, making it perfect for learners at any stage of their
                journey.
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>How does the AI-powered learning work?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                SprachGenie uses OpenAI to enhance your learning experience. For
                each vocabulary word, the AI can generate contextual example
                sentences and provide in-depth explanations through the "Learn
                More" feature. This helps you understand not just the
                definition, but how the word is used in real German
                conversations. You can also report any AI-generated content if
                you notice inaccuracies, ensuring quality learning materials.
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>Can I use SprachGenie offline?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                Currently, SprachGenie requires an internet connection to access
                AI-powered features and sync your progress. However, we're
                working on offline mode for downloaded content in future
                updates.
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
              <summary className="text-xl font-bold text-white cursor-pointer list-none flex items-center justify-between">
                <span>How long does it take to become fluent?</span>
                <span className="text-orange-500 text-2xl group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-300 mt-4 leading-relaxed">
                Learning speed varies by individual and depends on many factors
                including prior language experience, study time, and
                consistency. SprachGenie provides comprehensive materials for
                A1-B2 levels to support your learning journey at your own pace.
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
          className="bg-gradient-to-r from-gray-800 to-gray-900 py-20"
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
                Ready to Master German?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
                Start your free learning journey today with AI-powered tools
              </p>
              <Link
                to="/register"
                className="inline-block px-12 py-5 bg-pink-700 text-white font-bold rounded-full hover:bg-pink-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-xl"
              >
                Start Learning Now!
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
