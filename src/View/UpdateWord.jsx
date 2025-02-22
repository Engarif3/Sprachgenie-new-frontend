import React, { useState, useEffect } from "react";
import axios from "../axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../utils/Container";

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
    const fetchWordData = async () => {
      try {
        const response = await axios.get(`/words/${id}`);
        const word = response.data;
        setFormData({
          id: word.id,
          value: word.value,
          meaning: word.meaning,
          sentences: word.sentences,
          levelId: word.levelId,
          topicId: word.topicId,
          articleId: word.articleId,
          partOfSpeechId: word.partOfSpeechId,
          pluralForm: word.pluralForm || "",
          synonyms: word.synonyms?.map((item) => item.value) || [],
          antonyms: word.antonyms?.map((item) => item.value) || [],
          similarWords: word.similarWords?.map((item) => item.value) || [],
          level: word.level,
          topic: word.topic,
          article: word.article,
          partOfSpeech: word.partOfSpeech,
        });
      } catch (error) {
        console.error("Error fetching word data:", error);
      }
    };

    const fetchLevels = async () => {
      const response = await axios.get("/levels");
      setLevels(response.data);
    };

    const fetchTopics = async () => {
      const response = await axios.get("/topics");
      setTopics(response.data);
    };

    const fetchArticles = async () => {
      const response = await axios.get("/articles");
      setArticles(response.data);
    };

    const fetchPartOfSpeeches = async () => {
      const response = await axios.get("/part-of-speech");
      setPartOfSpeeches(response.data);
    };

    fetchWordData();
    fetchLevels();
    fetchTopics();
    fetchArticles();
    fetchPartOfSpeeches();
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
      // icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Remove",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      const updatedArray = [...formData[field]]; // Create a copy of the array
      updatedArray.splice(index, 1); // Remove the item from the array

      // Remove empty strings from the array
      const filteredArray = updatedArray.filter((item) => item.trim() !== "");

      // Update the state with the filtered array after removal
      setFormData((prev) => {
        const updatedFormData = { ...prev, [field]: filteredArray };
        updateWordData(updatedFormData); // Ensure the updated data is sent to the backend
        return updatedFormData;
      });
      Swal.fire({
        title: "Removed!",
        text: "The item has been removed successfully.",
        timer: 1000, // 1 second
        showConfirmButton: false, //
        icon: "success",
      });
      // } else {
      //   // If the user canceled
      //   Swal.fire({
      //     title: "Canceled",
      //     text: "The item was not removed.",
      //     // icon: "info",
      //   });
    }
  };

  const updateWordData = async (updatedFormData) => {
    try {
      // Send the updated data to the backend
      const response = await axios.put(`/update-word/${updatedFormData.id}`);
      console.log("Response:", response);
    } catch (error) {
      console.error("Error updating word:", error.response || error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Ensure the necessary fields are arrays and remove empty strings
    const dataToSend = {
      ...formData,
      meaning: formData.meaning.concat(
        inputData.meaning
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "") // Remove empty items
      ),
      sentences: formData.sentences.concat(
        inputData.sentences
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "") // Remove empty items
      ),
      synonyms: formData.synonyms.concat(
        inputData.synonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "") // Remove empty items
      ),
      antonyms: formData.antonyms.concat(
        inputData.antonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "") // Remove empty items
      ),
      similarWords: formData.similarWords.concat(
        inputData.similarWords
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "") // Remove empty items
      ),
    };

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this word?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.put(
          `/update-word/${formData.id}`,
          dataToSend
        );
        setMessage(response.data.message);
        setInputData({
          meaning: "",
          sentences: "",
          synonyms: "",
          antonyms: "",
          similarWords: "",
        });

        // Clear the word list cache after successful update
        localStorage.removeItem("wordListCache");
        // Show SweetAlert success message
        await Swal.fire({
          title: "Updated!",
          text: "The word has been updated successfully.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        navigate("/");
      } catch (error) {
        console.error("Error updating word:", error);
        setMessage("Failed to update the word.");
      } finally {
        setLoading(false);
      }
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
          {/* <label className="block   text-cyan-600 ">
            {" "}
            <span className="font-medium text-2xl "> Word</span>
          </label> */}

          <input
            type="text"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            className="w-full text-4xl font-semibold p-3 border-2 border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 capitalize  animate-pulse"
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
                value={formData.levelId || "Select"}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select" disabled>
                  Select
                </option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
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
                  <option key={pos.id} value={pos.id}>
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
          <button type="submit" className="btn btn-wide btn-warning">
            Update Word
          </button>
        </div>
      </form>
    </Container>
  );
};

export default UpdateWord;
