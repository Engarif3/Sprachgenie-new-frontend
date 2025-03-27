import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../utils/Container";
import api from "../axios";

const UpdateWord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState({
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });

  const [formData, setFormData] = useState({
    id: 1,
    value: "",
    meaning: [],
    sentences: [],
    levelId: "",
    topicId: "",
    articleId: "",
    partOfSpeechId: "",
    pluralForm: "",
    synonyms: [],
    antonyms: [],
    similarWords: [],
    level: {},
    topic: {},
    article: {},
    partOfSpeech: {},
  });

  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const [partOfSpeeches, setPartOfSpeeches] = useState([]);

  const [inputData, setInputData] = useState({
    meaning: "",
    sentences: "",
    synonyms: "",
    antonyms: "",
    similarWords: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch existing word data
  useEffect(() => {
    const controller = new AbortController();
    const fetchWordData = async () => {
      try {
        const response = await api.get(`/words/${id}`, {
          signal: controller.signal,
        });
        const word = response.data;
        console.log(word);
        setFormData({
          id: word.id,
          value: word.value,
          meaning: word.meaning,
          sentences: word.sentences,
          //   levelId: word.levelId.toString(), // Keep only IDs, not the entire object
          levelId: word.levelId, // Keep only IDs, not the entire object
          topicId: word.topicId,
          articleId: word.articleId,
          partOfSpeechId: word.partOfSpeechId?.toString() || "",
          pluralForm: word.pluralForm || "",
          synonyms: word.synonyms?.map((item) => item.value) || [],
          antonyms: word.antonyms?.map((item) => item.value) || [],
          similarWords: word.similarWords?.map((item) => item.value) || [],
        });
      } catch (error) {
        // console.error("Error fetching word data:", error);
        if (!controller.signal.aborted) {
          console.error("Error fetching word data:", error);
        }
      }
    };

    // const fetchLevels = async () => {
    //   const response = await api.get("/levels");
    //   setLevels(response.data);
    // };
    const fetchLevels = async () => {
      try {
        const response = await api.get("/levels", {
          signal: controller.signal,
        });
        setLevels(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching levels:", error);
        }
      }
    };

    const fetchTopics = async () => {
      const response = await api.get("/topics");
      setTopics(response.data);
    };

    const fetchArticles = async () => {
      const response = await api.get("/articles");
      setArticles(response.data);
    };

    const fetchPartOfSpeeches = async () => {
      const response = await api.get("/part-of-speech");
      setPartOfSpeeches(response.data);
    };

    fetchWordData();
    fetchLevels();
    fetchTopics();
    fetchArticles();
    fetchPartOfSpeeches();
    return () => controller.abort();
  }, [id]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    // If it's a select field (levelId, topicId, articleId, partOfSpeechId), update formData directly
    if (
      name === "levelId" ||
      name === "topicId" ||
      name === "articleId" ||
      name === "partOfSpeechId"
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else if (name === "value" || name === "pluralForm") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else if (
      name === "meaning" ||
      name === "sentences" ||
      name === "synonyms" ||
      name === "antonyms" ||
      name === "similarWords"
    ) {
      setInputData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      if (value.length >= 2) {
        try {
          const res = await fetch(
            `/words/suggestions?query=${value}&type=${name}`
          );
          const contentType = res.headers.get("Content-Type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setSuggestions((prevSuggestions) => ({
              ...prevSuggestions,
              [name]: data,
            }));
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions((prevSuggestions) => ({
          ...prevSuggestions,
          [name]: [],
        }));
      }
    }
  };

  const handleRemoveItem = async (field, index) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Remove",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));

      await Swal.fire({
        title: "Removed!",
        text: "The item has been removed successfully.",
        timer: 1000,
        showConfirmButton: false,
        icon: "success",
      });
    }
  };

  const updateWordData = async (updatedFormData) => {
    try {
      // Send the updated data to the backend
      const response = await api.put(`/word/update/${updatedFormData.id}`);
      console.log("Response:", response);
    } catch (error) {
      console.error("Error updating word:", error.response || error);
    }
  };

  // 2. Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate required fields first
    if (!formData.levelId || !formData.topicId || !formData.articleId) {
      setMessage("Please select Level, Topic, and Article");
      setLoading(false);
      return;
    }

    // Construct dataToSend with proper validation
    const dataToSend = {
      value: formData.value,
      meaning: [
        ...new Set([
          // Add deduplication
          ...formData.meaning,
          ...inputData.meaning
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
      sentences: [
        ...new Set([
          // Add deduplication
          ...formData.sentences,
          ...inputData.sentences
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
      levelId: formData.levelId,
      topicId: formData.topicId,
      articleId: formData.articleId,
      partOfSpeechId: formData.partOfSpeechId || "", // Keep as empty string instead of null
      pluralForm: formData.pluralForm || "", // Use empty string instead of null
      synonyms: [
        ...new Set([
          // Add deduplication
          ...formData.synonyms,
          ...inputData.synonyms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
      antonyms: [
        ...new Set([
          // Add deduplication
          ...formData.antonyms,
          ...inputData.antonyms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
      similarWords: [
        ...new Set([
          // Add deduplication
          ...formData.similarWords,
          ...inputData.similarWords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
    };

    try {
      if (!formData.id || isNaN(formData.id)) {
        setMessage("Invalid word ID");
        setLoading(false);
        return;
      }
      const response = await api.put(`/word/update/${formData.id}`, dataToSend);

      // Clear input fields after successful update
      setInputData({
        meaning: "",
        sentences: "",
        synonyms: "",
        antonyms: "",
        similarWords: "",
      });

      // Handle success
      await Swal.fire({
        title: "Updated!",
        text: "Word updated successfully!",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

      navigate("/");
    } catch (error) {
      console.error("Update error:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "Failed to update word";

      setMessage(errorMessage);
      await Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="text-3xl font-semibold mb-6 text-center mt-8 text-orange-600">
        Update Word
      </h2>

      {message && <p className="mb-4 text-green-600 text-center">{message}</p>}
      <form onSubmit={handleSubmit}>
        <span className="flex justify-end w-10/12">
          <Link to="/" className="btn btn-sm btn-error ">
            Cancel
          </Link>
        </span>
        <div className="w-8/12 mx-auto mb-4">
          <input
            type="text"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            className="w-full text-4xl font-semibold p-3 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 capitalize text-center text-slate-950 "
            placeholder="Enter the word"
          />
        </div>

        <div className="flex flex-col md:flex-row lg:flex-row justify-center items-center mt-8  ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-center items-start  gap-4 w-8/12 border border-pink-600 p-8 rounded-lg bg-sky-600">
            {/* Meanings Section */}
            <div className="w-full">
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Meaning</span> (for
                multiple input use comma)
              </label>
              <input
                type="text"
                name="meaning"
                value={inputData.meaning}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter meanings"
              />
              <div className="mt-2">
                {formData.meaning.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    <li>{item}</li>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("meaning", index)}
                      className="btn btn-sm btn-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentences Section */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg">Sentences</span> (for
                multiple input use comma)
              </label>
              {/* <div className="border border-slate-300 p-1 rounded-lg"> */}
              <input
                type="text"
                name="sentences"
                value={inputData.sentences}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter example sentences"
              />
              <div className="mt-2">
                {formData.sentences.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    <li>{item}</li>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("sentences", index)}
                      className="btn btn-sm btn-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {/* </div> */}
            </div>

            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Plural Form</span>
              </label>
              <input
                type="text"
                name="pluralForm"
                value={formData.pluralForm}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plural form"
              />
            </div>

            {/* Synonyms Section */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Synonyms</span> (for
                multiple input use comma)
              </label>
              <input
                type="text"
                name="synonyms"
                value={inputData.synonyms}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter synonyms"
              />
              <div className="mt-2">
                {formData.synonyms.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    <li>{item}</li>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("synonyms", index)}
                      className="btn btn-sm btn-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Antonyms Section */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Antonyms</span> (for
                multiple input use comma)
              </label>

              <input
                type="text"
                name="antonyms"
                value={inputData.antonyms}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter antonyms"
              />
              <div className="mt-2">
                {formData.antonyms.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    <li>{item}</li>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("antonyms", index)}
                      className="btn btn-sm btn-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Words Section */}
            <div>
              <label className="block mb-2 text-white">
                <span className="font-medium text-lg"> Deceptive Words</span>{" "}
                (for multiple input use comma)
              </label>

              <input
                type="text"
                name="similarWords"
                value={inputData.similarWords}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter similar words"
              />
              <div className="mt-2">
                {formData.similarWords.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    <li>{item}</li>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("similarWords", index)}
                      className="btn btn-sm btn-error"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Dropdown */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Level</span>
              </label>
              <select
                name="levelId"
                // value={formData.levelId || "Select"}
                value={formData.levelId ? formData.levelId : "Select"}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select" disabled>
                  Select
                </option>
                {levels.map((level) => (
                  //   <option key={level.id} value={level.id}>
                  <option key={level.id} value={String(level.id)}>
                    {level.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Dropdown */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg">Topic</span>
              </label>
              <select
                name="topicId"
                value={formData.topicId || "Select"}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select" disabled>
                  Select
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Article Dropdown */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg">Article</span>
              </label>
              <select
                name="articleId"
                value={formData.articleId || "Select"}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select" disabled>
                  Select
                </option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Part of Speech Dropdown */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg"> Part of Speech</span>
              </label>
              <select
                name="partOfSpeechId"
                value={formData.partOfSpeechId || "Select"}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select" disabled>
                  Select
                </option>
                {partOfSpeeches.map((pos) => (
                  //   <option key={pos.id} value={pos.id}>
                  <option key={pos.id} value={String(pos.id)}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>
            {/* </div> */}
          </div>
        </div>
        {/* Submit Button */}
        <div className="text-center mt-6">
          <button
            type="submit"
            className="btn btn-wide btn-warning"
            disabled={loading}
          >
            {/* Update Word */}
            {loading ? "Updating..." : "Update Word"}
          </button>
        </div>
      </form>
    </Container>
  );
};

export default UpdateWord;
