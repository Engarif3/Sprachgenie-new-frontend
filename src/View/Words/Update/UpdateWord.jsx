import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../../utils/Container";
import api from "../../../axios";
import { getUserInfo } from "../../../services/auth.services";

const UpdateWord = () => {
  const { id } = useParams();
  const userInfo = getUserInfo() || {};
  const [suggestions, setSuggestions] = useState({
    synonyms: [],
    antonyms: [],
    similarWords: [],
  });

  const [formData, setFormData] = useState({
    id: id,
    value: "",
    meaning: [],
    sentences: [],
    levelId: "" || null,
    topicId: "" || null,
    articleId: "" || null,
    partOfSpeechId: "" || null,
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
  const [editingField, setEditingField] = useState(null); // { type: 'meaning' | 'sentences', index: number }
  const [editValue, setEditValue] = useState("");

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
        const response = await api.get(`/word/${id}`);
        const word = response.data.data;
        setFormData({
          id: word.id,
          value: word.value,
          meaning: word.meaning,
          sentences: word.sentences,
          levelId: word.levelId || 1,
          topicId: word.topicId || 1,
          articleId: word.articleId || 4,
          partOfSpeechId: word.partOfSpeechId || 3,
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
        // Error handled - form will show validation errors
      }
    };

    const fetchLevels = async () => {
      const response = await api.get("/levels");
      setLevels(response.data);
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
          // Suggestions API call failed, continue without suggestions
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
      setLoading(true);
      // Remove the item from the array
      const updatedArray = [...formData[field]];
      updatedArray.splice(index, 1);

      // Remove empty strings from the array
      const filteredArray = updatedArray.filter((item) => item.trim() !== "");

      // Update the state
      setFormData((prev) => ({
        ...prev,
        [field]: filteredArray,
      }));

      try {
        // Send the updated data to the backend
        const response = await api.put(`/word/update/${formData.id}`, {
          ...formData,
          userId: userInfo.id,
          [field]: filteredArray, // Send the updated list to the backend
        });

        Swal.fire({
          title: "Removed!",
          text: "The item has been removed successfully.",
          timer: 500,
          showConfirmButton: false,
          icon: "success",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to update the backend. Please try again.",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
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
          .filter((item) => item !== "")
      ),
      sentences: formData.sentences.concat(
        inputData.sentences
          .split("|")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      ),
      synonyms: formData.synonyms.concat(
        inputData.synonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      ),
      antonyms: formData.antonyms.concat(
        inputData.antonyms
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      ),
      similarWords: formData.similarWords.concat(
        inputData.similarWords
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      ),
      userId: userInfo.id,
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
        const response = await api.put(
          `/word/update/${formData.id}`,
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
        // navigate("/");
      } catch (error) {
        setMessage("Failed to update the word.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async (field, index) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = editValue.trim();

    // Optional: Prevent saving empty values
    if (!updatedArray[index]) return;

    setFormData((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));

    try {
      await api.put(`/word/update/${formData.id}`, {
        ...formData,
        userId: userInfo.id,
        [field]: updatedArray,
      });

      Swal.fire({
        title: "Updated!",
        text: "The item has been edited successfully.",
        timer: 800,
        showConfirmButton: false,
        icon: "success",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to update. Please try again.",
        icon: "error",
      });
    } finally {
      setEditingField(null);
      setEditValue("");
    }
  };

  return (
    <Container>
      <h2 className="text-3xl font-semibold mb-6 text-center mt-8 text-white">
        Update
      </h2>

      {message && <p className="mb-4 text-green-600 text-center">{message}</p>}
      <form onSubmit={handleSubmit} className="w-full ">
        <span className="flex justify-end w-full md:w-10/12">
          <Link to="/" className="btn btn-sm btn-error ">
            Cancel
          </Link>
        </span>
        <div className="w-full md:w-8/12 mx-auto mb-4 ">
          {/* <label className="block   text-cyan-600 ">
            {" "}
            <span className="font-medium text-2xl "> Word</span>
          </label> */}

          <input
            type="text"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            className="w-full text-4xl font-semibold p-3 border-2 border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 capitalize text-slate-950"
            placeholder="Enter the word"
          />
        </div>

        <div className="w-full  flex flex-col md:flex-row lg:flex-row justify-center items-center mt-8  ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-center items-start  gap-4 w-full md:w-8/12 p-1  md:p-8 lg:p-8 rounded-lg bg-stone-800">
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
                    {editingField?.type === "meaning" &&
                    editingField?.index === index ? (
                      <div className="flex flex-col md:flex-row justify-between  w-full">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-2 mr-2 border border-gray-400 rounded"
                        />
                        <div className=" flex justify-end gap-2 ml-4 mt-1 md:mt-0">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit("meaning", index)}
                            className="btn btn-sm btn-success mr-1"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingField(null)}
                            className="btn btn-sm btn-ghost"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between  w-full">
                        <li>{item}</li>
                        <div className=" flex justify-end gap-2 ml-4 mt-1 md:mt-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingField({ type: "meaning", index });
                              setEditValue(item);
                            }}
                            className="btn btn-sm btn-info"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem("meaning", index)}
                            className="btn btn-sm btn-error"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sentences Section */}
            <div>
              <label className="block  mb-2 text-white">
                <span className="font-medium text-lg">Sentences</span> (for
                multiple input use "|". eg. sentence A. | Sentence B.)
              </label>
              {/* <div className="border border-slate-300 p-1 rounded-lg"> */}
              <input
                type="text"
                name="sentences"
                value={inputData.sentences}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sentence A. SentenceB."
              />
              <div className="mt-2">
                {formData.sentences.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-300 p-2 rounded-lg mb-2 shadow-sm"
                  >
                    {editingField?.type === "sentences" &&
                    editingField?.index === index ? (
                      <div className="flex flex-col md:flex-row justify-between  w-full">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-2 mr-2 border border-gray-400 rounded"
                        />
                        <div className=" flex justify-end gap-2 ml-4 mt-1 md:mt-0">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit("sentences", index)}
                            className="btn btn-sm btn-success mr-1"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingField(null)}
                            className="btn btn-sm btn-error"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between  w-full">
                        <li className="">{item}</li>

                        <div className=" flex justify-end gap-2 ml-4 mt-1 md:mt-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingField({ type: "sentences", index });
                              setEditValue(item);
                            }}
                            className="btn btn-sm btn-info"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem("sentences", index)}
                            className="btn btn-sm btn-error"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
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
                <span className="font-medium text-lg"> Word to Watch</span> (for
                multiple input use comma)
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
                value={formData.levelId || "1"}
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
                value={formData.topicId || "1"}
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
                value={formData.articleId || "4"}
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
                value={formData.partOfSpeechId || "3"}
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
        <div className="text-center mt-6 mb-24 w-full p-1">
          <button
            type="submit"
            className="btn w-full md:w-8/12 lg:w-8/12 btn-primary"
          >
            Update
          </button>
        </div>
      </form>
    </Container>
  );
};

export default UpdateWord;
