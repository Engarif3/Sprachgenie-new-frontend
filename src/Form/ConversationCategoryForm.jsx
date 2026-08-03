import { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axios";
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import Button from "../components/UI/Button";
import PageHeader from "../components/UI/PageHeader";

const ConversationCategoryForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [categoryData, setCategoryData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategoryData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await axios.post("/conversation-category/create", categoryData);
      await Swal.fire({
        icon: "success",
        title: "Category created successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      setCategoryData({ name: "" });
    } catch (error) {
      console.error("Error creating category:", error);
      await Swal.fire({
        icon: "error",
        title: "Error creating category",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <div className="min-h-screen ">
        <PageHeader
          title="Create a Conversation Category"
          align="center"
          className="mt-8 mb-6"
        />
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-md border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-transparent dark:bg-stone-800 dark:text-white dark:shadow-none"
        >
          <div>
            <label htmlFor="name" className="block  font-medium ">
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={categoryData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Phone Call"
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Groups conversations together (e.g. "Phone Call", "Restaurant")
              — separate from each conversation's own title.
            </p>
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-24">
            {loading ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default ConversationCategoryForm;
