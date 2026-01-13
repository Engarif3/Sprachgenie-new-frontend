import Container from "../../utils/Container";
import HomeCard from "./HomeCard";
import CircularText from "./CircularText";
import SplashCursor from "./SplashCursor";
import Marquee from "react-fast-marquee";
import { isLoggedIn } from "../../services/auth.services";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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
      { threshold: 0.1 }
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
        <div className="text-orange-600 text-xl md:text-2xl lg:text-2xl flex justify-center my-8 md:my-2 lg:my-2">
          {!userLoggedIn && (
            <div className="w-11/12 md:w-6/12 lg:w-6/12">
              <Marquee gradient={false} speed={30}>
                <p>
                  ✨Log in to unleash AI-powered magic and step into the future
                  of learning!✨
                </p>
              </Marquee>
            </div>
          )}
        </div>
        <SplashCursor />
        <CircularText
          text="PRACTICE*MAKES*PERFECT*"
          centerText1="Sprach"
          centerText2="Genie"
          onHover="speedUp"
          spinDuration={20}
          className="font-custom3"
        />

        {/* Hero Content */}
        <div className="text-center py-16 px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Master German with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              {" "}
              AI-Powered{" "}
            </span>
            Learning
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            From vocabulary to conversations, grammar to stories - your complete
            German learning journey starts here
          </p>

          {/* Featured Vocabulary Access */}
          <div className="mb-8">
            <Link
              to="/words"
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-bold rounded-full hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-105 transition-all duration-300 text-lg shadow-xl"
            >
              <span className="text-2xl">📚</span>
              <span>Explore 4000+ Vocabulary Words</span>
              <span className="text-xl">→</span>
            </Link>
          </div>

          {!userLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
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
        </div>
      </Container>

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
                AI-Powered Learning
              </h3>
              <p className="text-gray-300">
                Personalized learning experience with advanced AI that adapts to
                your pace and style
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

      {/* Testimonials Section */}
      <div className="py-20" id="testimonials" data-animate>
        <Container>
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              visibleSections.has("testimonials")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Our Learners Say
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Real experiences from our learning community
            </p>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 px-4 transition-all duration-1000 delay-300 ${
              visibleSections.has("testimonials")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-bold">Sarah M.</h4>
                  <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "The AI-powered learning is incredible! I've learned more in 2
                months than I did in a year with other apps. The conversations
                feature really helps build confidence."
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-bold">Michael K.</h4>
                  <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "Best language learning platform I've used! The vocabulary
                library is huge and the stories make learning fun. Passed my B2
                exam thanks to SprachGenie!"
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  A
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-bold">Anna L.</h4>
                  <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "Love the interactive approach! The grammar explanations are
                clear, and the quizzes make practice enjoyable. Highly recommend
                for serious learners."
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
                Practice daily with AI-powered tools and watch your skills grow
                exponentially
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Learning Resources Section */}
      <div className="bg-gray-800/50 py-20">
        <Container>
          <div className="min-h-screen mb-12">
            <h2 className="text-center text-4xl md:text-5xl font-bold text-white mb-4">
              Explore Learning Resources
            </h2>
            <p className="text-center text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Everything you need to master German in one place
            </p>
            <div className="flex justify-center items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
                <HomeCard
                  title="Vocabulary Library"
                  text="Explore 4000+ words"
                  link="/words"
                />
                <HomeCard
                  title="Conversations"
                  text="Conversations on various topics"
                  link="/conversation-titles"
                />
                <HomeCard
                  title="Words With Prefix"
                  text="Learn some prefix+word"
                  link="/prefix-types"
                />
                <HomeCard
                  title="Learn Grammar"
                  text="Learn grammar rules to become more perfect"
                  link="/grammar"
                />
                <HomeCard
                  title="German Stories"
                  text="Enrich your vocabulary"
                  link="/stories"
                />
                <HomeCard
                  title="Play Quiz"
                  text="Learn with fun with a friend or alone"
                  link="/quiz"
                />
              </div>
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
                100+
              </div>
              <p className="text-gray-300 text-lg font-semibold">Stories</p>
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
                Our AI analyzes your learning patterns, strengths, and
                weaknesses to create personalized content and recommendations.
                It adapts to your pace, focusing on areas where you need
                improvement while reinforcing what you've mastered.
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
                Learning speed varies by individual, but with consistent daily
                practice (30-60 minutes), most learners reach conversational
                fluency (B1-B2 level) within 6-12 months. Our AI helps optimize
                your learning path for faster progress.
              </p>
            </details>

            <details className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-700 group">
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
            </details>
          </div>
        </Container>
      </div>

      {/* CTA Section */}
      {!userLoggedIn && (
        <div
          className="bg-gradient-to-r from-orange-500 to-pink-500 py-20"
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
                className="inline-block px-12 py-5 bg-white text-orange-600 font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 text-xl"
              >
                Start Learning Now!
              </Link>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};

export default Home;
