import React, { useState, useEffect } from "react";
import api from "../../axios";
import stories from "./stories.json";
import Container from "../../utils/Container";

// Import Google Font - Roboto for clean, professional look (like Todaii)
import "@fontsource/roboto";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";

// Modal component removed (vocabulary colorization disabled)

const Stories = () => {
  // Modal state removed
  const [allStories, setAllStories] = useState(stories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stories from API on component mount
  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/stories/all`);

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        // Transform API response to match the expected format
        const transformedStories = response.data.data.map((story) => ({
          id: story.id,
          title: story.title,
          image: story.image || "/images/default-story.webp",
          description: {
            text: story.description,
          },
        }));

        setAllStories(transformedStories);
        setError(null);
      } else {
        // If no stories from API, use static stories
        setAllStories(stories);
      }
    } catch (err) {
      console.log(
        "Info: Using static stories (API may be unavailable):",
        err.message,
      );
      // Fallback to static stories if API fails
      setAllStories(stories);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Modal functionality removed (no longer needed)

  // Helper function to intelligently split text into paragraphs
  const splitIntoParagraphs = (text) => {
    // First check if text already has paragraph breaks
    if (text.includes("\n\n")) {
      return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    }

    // If no paragraph breaks, intelligently split by sentences
    // Match sentences: ends with . ! ? followed by space and capital letter
    const sentenceRegex = /[^.!?]*[.!?]+(?=\s+[A-ZÄÖÜ]|\s*$)/g;
    const sentences = text.match(sentenceRegex) || [];

    if (sentences.length < 4) {
      // If fewer than 4 sentences, return as single paragraph
      return text.trim().length > 0 ? [text.trim()] : [];
    }

    // Group sentences into paragraphs (roughly 4-5 sentences per paragraph)
    const paragraphs = [];
    let currentParagraph = "";
    const sentencesPerParagraph = Math.ceil(sentences.length / 4);

    sentences.forEach((sentence, idx) => {
      currentParagraph += sentence.trim();
      if (
        (idx + 1) % sentencesPerParagraph === 0 ||
        idx === sentences.length - 1
      ) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = "";
      } else {
        currentParagraph += " ";
      }
    });

    return paragraphs.filter((p) => p.trim().length > 0);
  };

  return (
    <div>
      <div className="min-h-screen p-1 md:p-4 lg:4 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-black/50">
        {/* Header Section */}
        <div className="text-center mb-12 mt-8">
          <div className="mb-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
              📗 Read & Learn
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pb-4">
            German Stories
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Immerse yourself in engaging stories to enhance reading skills
          </p>
          <div className="flex justify-center mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">Loading stories...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 px-4">
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={fetchStories}
              className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="text-2xl text-white p-2 md:p-4">
          {allStories.map(({ title, image, description }, index) => (
            <div
              key={index}
              className={`mb-12 ${
                index === allStories.length - 1 ? "" : "border-b border-dotted"
              } border-cyan-950 p-1 md:p-4 flex justify-center items-center flex-col mt-4`}
            >
              {/* Title */}
              <h2 className="text-xl md:text-3xl lg:text-3xl text-center font-bold mb-4 md:mb-12 lg:mb-12">
                {title}
              </h2>

              {/* Image */}
              {image && (
                <img
                  src={image}
                  alt={title}
                  className="mb-4 w-96 md:w-6/12 h-auto object-cover rounded-lg "
                />
              )}

              {/* Description */}
              <div className="[font-family:'Roboto',sans-serif] text-base md:text-lg lg:text-lg leading-8 text-gray-200 text-justify mb-2 md:mb-8 lg:mb-8 w-full md:w-8/12 bg-gradient-to-br from-gray-900/70 to-gray-800/50 backdrop-blur-md border border-gray-700/50 p-2 md:p-8 rounded-2xl shadow-2xl font-normal">
                {splitIntoParagraphs(description.text).map((paragraph, idx) => (
                  <p key={idx} className="mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Vocabulary list removed - focus on story flow */}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {/* Modal removed - no vocabulary colorization */}
    </div>
  );
};

export default Stories;
