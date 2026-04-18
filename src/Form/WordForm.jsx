import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../axios";
import { invalidateWordsCache } from "../utils/storage";

import { useAuth } from "../services/auth.services";

const normalizeWordValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getSelfReferenceMessage = (value, relations) => {
  const normalizedValue = normalizeWordValue(value);

  if (!normalizedValue) {
    return null;
  }

  const invalidLabels = [
    ["synonyms", "synonym"],
    ["antonyms", "antonym"],
    ["similarWords", "similar word"],
  ]
    .filter(([field]) =>
      Array.isArray(relations[field])
        ? relations[field].some(
            (item) => normalizeWordValue(item) === normalizedValue,
          )
        : false,
    )
    .map(([, label]) => label);

  if (!invalidLabels.length) {
    return null;
  }

  return `The word cannot reference itself as a ${invalidLabels.join(", ")}.`;
};

const WordForm = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;

  const [wordData, setWordData] = useState({
    value: "",
    meaning: "",
    sentences: "",
    pluralForm: "",
    levelId: "",
    topicId: "",
    articleId: "",
    partOfSpeechId: "",
    synonyms: "",
    antonyms: "",
    similarWords: "",
  });
  const [loading, setLoading] = useState(true); // Loading state
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  const initialWordData = {
    value: "",
    meaning: "",
    sentences: "",
    pluralForm: "",
    levelId: "",
    topicId: "",
    articleId: "",
    partOfSpeechId: "",
    synonyms: "",
    antonyms: "",
    similarWords: "",
  };

  // Fetch the options for level, topic, article, and partOfSpeech
  useEffect(() => {
    const fetchData = async () => {
      try {
        const levelResponse = await api.get("/level/all");
        const topicResponse = await api.get("/topic/all");
        const articleResponse = await api.get("/articles");
        const partOfSpeechResponse = await api.get("/part-of-speech");

        setLevels(levelResponse.data.data);
        setTopics(topicResponse.data.data);
        setArticles(articleResponse.data);
        setPartsOfSpeech(partOfSpeechResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error); // Log the error for debugging
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setWordData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!wordData.levelId) {
      Swal.fire({
        title: "Level Required",
        text: "Please select a level before creating the word.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    if (!wordData.partOfSpeechId) {
      Swal.fire({
        title: "Part of Speech Required",
        text: "Please select a part of speech before creating the word.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    const newWordData = {
      value: wordData.value,
      meaning:
        typeof wordData.meaning === "string"
          ? wordData.meaning.split(",").map((item) => item.trim())
          : [],
      sentences:
        typeof wordData.sentences === "string"
          ? wordData.sentences
              .split("|")
              .map((item) => item.trim())
              .filter((item) => item) // Removes empty strings
          : [],
      pluralForm: wordData.pluralForm,
      levelId: wordData.levelId,
      topicId: wordData.topicId || "1",
      articleId: wordData.articleId || "4",
      partOfSpeechId: wordData.partOfSpeechId,
      synonyms:
        typeof wordData.synonyms === "string"
          ? wordData.synonyms
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item) // Add filter here
          : [],
      antonyms:
        typeof wordData.antonyms === "string"
          ? wordData.antonyms
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item) // Add filter here
          : [],
      similarWords:
        typeof wordData.similarWords === "string"
          ? wordData.similarWords
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item) // Add filter here
          : [],
      createdBy: userId,
    };

    const selfReferenceMessage = getSelfReferenceMessage(
      newWordData.value,
      newWordData,
    );

    if (selfReferenceMessage) {
      Swal.fire({
        title: "Invalid relation",
        text: selfReferenceMessage,
        icon: "warning",
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    try {
      // Directly submit the wordData state
      // const response = await instance({
      //   url: "https://sprcahgenie-new-backend.vercel.app/api/v1/word/create",
      //   // url: "http://localhost:5000/api/v1/word/create",
      //   method: "POST",
      //   data: newWordData,
      // });
      await api.post("/word/create", newWordData);
      await invalidateWordsCache();

      setWordData(initialWordData); // Reset form state

      Swal.fire({
        title: "Created",
        text: "The word created successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Stay on the same page after creating word
    } catch (error) {
      // catch (error) {
      //   Swal.fire({
      //     title: "Error",
      //     text: "There was an error creating the word.",
      //     icon: "error",
      //     timer: 1500,
      //     showConfirmButton: false,
      //   });
      // }
      const errorMessage =
        error.response?.data?.message ||
        "There was an error creating the word.";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Show loading message if data is still being fetched
  // if (loading) {
  //   return <p>Loading...</p>;
  // }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full  p-0 md:p-6  lg:p-6 mt-4">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        Create a Word
      </h2>
      <form onSubmit={handleSubmit} className="w-full shadow-lg ">
        <div className="w-full bg-stone-800 rounded-md p-1   md:p-8 lg:p-8 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            <div className="space-y-6">
              {/* Word Input */}
              <div className="text-lg">
                <label
                  htmlFor="value"
                  className="block text-sm font-medium text-white"
                >
                  Word
                </label>
                <input
                  type="text"
                  id="value"
                  name="value"
                  value={wordData.value}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Meaning Input */}
              <div>
                <label
                  htmlFor="meaning"
                  className="block text-sm font-medium text-white"
                >
                  Meaning (comma separated)
                </label>
                <input
                  type="text"
                  id="meaning"
                  name="meaning"
                  value={wordData.meaning}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Sentences Input */}
              <div>
                <label
                  htmlFor="sentences"
                  className="block text-sm font-medium text-white"
                >
                  Sentences(Optional, eg. sentence A. | Sentence B.)
                </label>
                <input
                  type="text"
                  id="sentences"
                  name="sentences"
                  value={wordData.sentences}
                  onChange={handleChange}
                  className=" input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Article Dropdown */}
              <div>
                <label
                  htmlFor="articleId"
                  className="block text-sm font-medium text-white"
                >
                  Article
                </label>
                <select
                  id="articleId"
                  name="articleId"
                  value={wordData.articleId}
                  onChange={handleChange}
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 "
                >
                  <option value="">Select Article</option>
                  {articles && articles.length > 0 ? (
                    articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {/* {article.name} */}
                        {article.name.trim() === ""
                          ? "No Article"
                          : article.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No articles available</option>
                  )}
                </select>
              </div>

              {/* Plural Form Input */}
              <div>
                <label
                  htmlFor="pluralForm"
                  className="block text-sm font-medium text-white"
                >
                  Plural Form (Optional)
                </label>
                <input
                  type="text"
                  id="pluralForm"
                  name="pluralForm"
                  value={wordData.pluralForm}
                  onChange={handleChange}
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                />
              </div>

              {/* Level Dropdown */}
              <div>
                <label
                  htmlFor="levelId"
                  className="block text-sm font-medium text-white"
                >
                  Level
                </label>
                <select
                  id="levelId"
                  name="levelId"
                  value={wordData.levelId}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Level</option>
                  {levels && levels.length > 0 ? (
                    levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.level}
                      </option>
                    ))
                  ) : (
                    <option disabled>No levels available</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {/* Part of Speech Dropdown */}
              <div>
                <label
                  htmlFor="partOfSpeechId"
                  className="block text-sm font-medium text-white"
                >
                  Part of Speech
                </label>
                <select
                  id="partOfSpeechId"
                  name="partOfSpeechId"
                  value={wordData.partOfSpeechId}
                  onChange={handleChange}
                  required
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Part of Speech</option>
                  {partsOfSpeech && partsOfSpeech.length > 0 ? (
                    partsOfSpeech.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No parts of speech available</option>
                  )}
                </select>
              </div>

              {/* Topic Dropdown */}
              <div>
                <label
                  htmlFor="topicId"
                  className="block text-sm font-medium text-white"
                >
                  Topic
                </label>
                <select
                  id="topicId"
                  name="topicId"
                  value={wordData.topicId}
                  onChange={handleChange}
                  className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <option value="">Select Topic</option>
                  {topics && topics.length > 0 ? (
                    topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No topics available</option>
                  )}
                </select>
              </div>

              {/* Optional Inputs */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="synonyms"
                    className="block text-sm font-medium text-white"
                  >
                    Synonyms (comma separated, Optional)
                  </label>
                  <input
                    type="text"
                    id="synonyms"
                    name="synonyms"
                    value={wordData.synonyms}
                    onChange={handleChange}
                    className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="antonyms"
                    className="block text-sm font-medium text-white"
                  >
                    Antonyms (comma separated, Optional)
                  </label>
                  <input
                    type="text"
                    id="antonyms"
                    name="antonyms"
                    value={wordData.antonyms}
                    onChange={handleChange}
                    className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="similarWords"
                    className="block text-sm font-medium text-white"
                  >
                    Word to Watch (comma separated, Optional)
                  </label>
                  <input
                    type="text"
                    id="similarWords"
                    name="similarWords"
                    value={wordData.similarWords}
                    onChange={handleChange}
                    className="input-md mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2 text-white font-medium bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 my-8"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default WordForm;
