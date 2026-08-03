import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axios";
import { useAuth } from "../services/auth.services";
import Button from "../components/UI/Button";

const ArticleForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [articleData, setArticleData] = useState({
    name: "",
  });
  const [loading, setLoading] = useState(false); // Loading state

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setArticleData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when starting the submission

    try {
      const response = await axios.post("/articles", articleData);
      console.log("Article added successfully:", response.data);
      await Swal.fire({
        icon: "success",
        title: "Article created successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      setArticleData({ name: "" }); // Clear form after successful submission
    } catch (error) {
      console.error("Error adding article:", error);
      await Swal.fire({
        icon: "error",
        title: "Error creating article",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoading(false); // Set loading to false after submission attempt
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Article Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={articleData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
        />
      </div>

      <Button type="submit" disabled={loading} fullWidth className="mt-4">
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};

export default ArticleForm;
