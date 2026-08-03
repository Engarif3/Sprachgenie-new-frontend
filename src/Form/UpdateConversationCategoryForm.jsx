import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axios";
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import Button from "../components/UI/Button";
import PageHeader from "../components/UI/PageHeader";

const EMPTY_CATEGORY_FORM = { name: "" };

const buildNoCacheRequestConfig = () => ({
  params: { _ts: Date.now() },
});

const UpdateConversationCategoryForm = () => {
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [categoryData, setCategoryData] = useState(EMPTY_CATEGORY_FORM);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchOptions = async () => {
    setLoadingOptions(true);

    try {
      const response = await axios.get(
        "/conversation-category/all",
        buildNoCacheRequestConfig(),
      );
      const nextCategories = response.data.data || [];
      setCategories(nextCategories);
      return nextCategories;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      await Swal.fire({
        icon: "error",
        title: "Unable to load categories",
        text: "Please refresh and try again.",
        background: "#1c1917",
        color: "#f5f5f4",
      });
      return [];
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    void fetchOptions();
  }, []);

  const handleCategorySelection = (event) => {
    const nextCategoryId = event.target.value;
    setSelectedCategoryId(nextCategoryId);

    if (!nextCategoryId) {
      setCategoryData(EMPTY_CATEGORY_FORM);
      return;
    }

    const selectedCategory = categories.find(
      (category) => String(category.id) === String(nextCategoryId),
    );

    setCategoryData({ name: selectedCategory?.name || "" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCategoryData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCategoryId) {
      await Swal.fire({
        icon: "warning",
        title: "Please select a category to update",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Update category?",
      text: "Type ok to confirm this category update.",
      input: "text",
      inputPlaceholder: "Type ok",
      inputAutoTrim: true,
      inputValidator: (value) =>
        value?.trim().toLowerCase() === "ok"
          ? null
          : 'Please type "ok" to continue.',
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `/conversation-category/update/${selectedCategoryId}`,
        categoryData,
      );

      const refreshedCategories = await fetchOptions();

      const updatedCategory = refreshedCategories.find(
        (category) => String(category.id) === String(selectedCategoryId),
      );

      if (updatedCategory) {
        setCategoryData({ name: updatedCategory.name || "" });
      }

      await Swal.fire({
        icon: "success",
        title: "Category updated successfully",
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.response?.data?.message || "Error updating category",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelectionAndRefresh = async () => {
    setSelectedCategoryId("");
    setCategoryData(EMPTY_CATEGORY_FORM);
    await fetchOptions();
  };

  // SUPER_ADMIN escape hatch for the "still in use" block below: asks for
  // the caller's own password (re-verified server-side, independent of the
  // session cookie) and, if confirmed, force-deletes the category —
  // untagging it from every conversation that had it (a conversation left
  // with no categories is simply "Uncategorized", not a problem). Returns
  // { attempted: false } if the admin backs out of the password prompt, so
  // the caller can tell "cancelled" apart from "failed".
  const promptForceDelete = async (categoryId, categoryLabel, conversationCount) => {
    const passwordConfirmation = await Swal.fire({
      title: "Force delete category?",
      html: `<strong>${categoryLabel}</strong> is still tagged on ${conversationCount} conversation${
        conversationCount === 1 ? "" : "s"
      }. As SUPER_ADMIN you can delete it anyway — it'll be untagged from ${
        conversationCount === 1 ? "that conversation" : "those conversations"
      } (which become "Uncategorized" if this was their only category). Enter your password to confirm.`,
      icon: "warning",
      input: "password",
      inputPlaceholder: "Your password",
      inputAttributes: { autocomplete: "current-password" },
      inputValidator: (value) => (value ? null : "Password is required"),
      showCancelButton: true,
      confirmButtonText: "Force Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!passwordConfirmation.isConfirmed) {
      return { attempted: false };
    }

    const response = await axios.post(
      `/conversation-category/force-delete/${categoryId}`,
      { password: passwordConfirmation.value },
    );

    return { attempted: true, message: response.data?.message };
  };

  const handleDelete = async () => {
    if (!selectedCategoryId) {
      await Swal.fire({
        icon: "warning",
        title: "Please select a category to delete",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    const categoryLabel = categoryData.name || "this category";

    const confirmation = await Swal.fire({
      title: "Delete category?",
      html: `Type <strong>ok</strong> to permanently delete <strong>${categoryLabel}</strong>. This can't be undone.`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Type ok",
      inputAutoTrim: true,
      inputValidator: (value) =>
        value?.trim().toLowerCase() === "ok"
          ? null
          : 'Please type "ok" to continue.',
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setDeleting(true);

    try {
      await axios.delete(`/conversation-category/delete/${selectedCategoryId}`);

      await clearSelectionAndRefresh();

      await Swal.fire({
        icon: "success",
        title: "Category deleted successfully",
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      const conversationCount = error.response?.data?.data?.conversationCount;

      // Blocked specifically because the category still has conversations —
      // offer the SUPER_ADMIN the password-confirmed force-delete-and-
      // reassign path instead of just reporting failure.
      if (typeof conversationCount === "number" && conversationCount > 0) {
        try {
          const result = await promptForceDelete(
            selectedCategoryId,
            categoryLabel,
            conversationCount,
          );

          if (!result.attempted) {
            return;
          }

          await clearSelectionAndRefresh();

          await Swal.fire({
            icon: "success",
            title: result.message || "Category deleted successfully",
            timer: 2200,
            showConfirmButton: false,
            background: "#1c1917",
            color: "#f5f5f4",
          });
        } catch (forceDeleteError) {
          console.error("Error force-deleting category:", forceDeleteError);
          await Swal.fire({
            icon: "error",
            title: "Delete failed",
            text:
              forceDeleteError.response?.data?.message ||
              "Error deleting category",
            background: "#1c1917",
            color: "#f5f5f4",
          });
        }
        return;
      }

      console.error("Error deleting category:", error);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.response?.data?.message || "Error deleting category",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <div className="min-h-screen ">
        <PageHeader
          title="Update Conversation Category"
          align="center"
          className="mt-8 mb-6"
        />
        <p className="text-center text-sm text-slate-500 dark:text-gray-400 -mt-4 mb-6">
          {loadingOptions
            ? "Loading categories..."
            : `${categories.length} categor${categories.length === 1 ? "y" : "ies"} available`}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-md border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-transparent dark:bg-stone-800 dark:text-white dark:shadow-none"
        >
          <div>
            <label htmlFor="selectedCategoryId" className="block font-medium">
              Select Category
            </label>
            <select
              id="selectedCategoryId"
              name="selectedCategoryId"
              value={selectedCategoryId}
              onChange={handleCategorySelection}
              disabled={loadingOptions || loading || deleting}
              required
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            >
              <option value="">
                {loadingOptions ? "Loading categories..." : "Select Category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block font-medium ">
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={categoryData.name}
              onChange={handleChange}
              required
              disabled={!selectedCategoryId || loading || deleting}
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || deleting || !selectedCategoryId}
            fullWidth
            className="mt-24"
          >
            {loading ? "Updating..." : "Update Category"}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading || deleting || !selectedCategoryId}
            fullWidth
            className="mt-4"
          >
            {deleting ? "Deleting..." : "Delete Category"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default UpdateConversationCategoryForm;
