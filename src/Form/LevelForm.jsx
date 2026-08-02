import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axios";
import Container from "../utils/Container";
import { useAuth } from "../services/auth.services";
import { invalidateWordsCache } from "../utils/storage";
import Button from "../components/UI/Button";
import PageHeader from "../components/UI/PageHeader";

const LevelForm = () => {
  const { isAdmin, isSuperAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [levelName, setLevelName] = useState("");
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loading, setLoading] = useState(false);
  const [togglingLevelId, setTogglingLevelId] = useState(null);

  const fetchLevels = async () => {
    setLoadingLevels(true);

    try {
      const response = await axios.get("/level/all");
      setLevels(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch levels:", error);
    } finally {
      setLoadingLevels(false);
    }
  };

  useEffect(() => {
    void fetchLevels();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = levelName.trim();

    if (!trimmedName) {
      alert("Level name is required");
      return;
    }

    // A new level is structural — every topic and word-creation form offers
    // it from then on — so this re-verifies the caller's own password,
    // same as topic level changes/force-delete.
    const passwordConfirmation = await Swal.fire({
      title: "Confirm new level?",
      html: `Create level <strong>${trimmedName}</strong>? Enter your password to confirm.`,
      icon: "warning",
      input: "password",
      inputPlaceholder: "Your password",
      inputAttributes: { autocomplete: "current-password" },
      inputValidator: (value) => (value ? null : "Password is required"),
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!passwordConfirmation.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      await axios.post("/level/create", {
        levelName: trimmedName,
        password: passwordConfirmation.value,
      });

      await invalidateWordsCache();
      await fetchLevels();
      setLevelName("");

      await Swal.fire({
        icon: "success",
        title: "Level created successfully",
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      console.error("Error creating level:", error);
      await Swal.fire({
        icon: "error",
        title: "Create failed",
        text: error.response?.data?.message || "Error creating level",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setLoading(false);
    }
  };

  // SUPER_ADMIN-only (matches the backend's PATCH /level/:levelId/visibility
  // gate): hides/unhides a level — and its words — from the WordList table
  // for basic users/guests. Always re-verifies the caller's own password,
  // same pattern as level creation/topic level changes/force-delete, since
  // this affects visibility for every non-admin user at once.
  const handleToggleVisibility = async (level) => {
    if (!isSuperAdmin) {
      return;
    }

    const nextHidden = !level.isHidden;

    const passwordConfirmation = await Swal.fire({
      title: nextHidden ? "Hide this level?" : "Unhide this level?",
      html: nextHidden
        ? `<strong>${level.level}</strong> and its words will no longer be visible to basic users. Enter your password to confirm.`
        : `<strong>${level.level}</strong> and its words will become visible to basic users again. Enter your password to confirm.`,
      icon: "warning",
      input: "password",
      inputPlaceholder: "Your password",
      inputAttributes: { autocomplete: "current-password" },
      inputValidator: (value) => (value ? null : "Password is required"),
      showCancelButton: true,
      confirmButtonText: nextHidden ? "Hide" : "Unhide",
      cancelButtonText: "Cancel",
      confirmButtonColor: nextHidden ? "#e11d48" : "#0284c7",
      cancelButtonColor: "#475569",
      background: "#1c1917",
      color: "#f5f5f4",
    });

    if (!passwordConfirmation.isConfirmed) {
      return;
    }

    setTogglingLevelId(level.id);

    try {
      await axios.patch(`/level/${level.id}/visibility`, {
        isHidden: nextHidden,
        password: passwordConfirmation.value,
      });

      await invalidateWordsCache();
      await fetchLevels();

      await Swal.fire({
        icon: "success",
        title: `Level ${nextHidden ? "hidden" : "unhidden"} successfully`,
        timer: 1400,
        showConfirmButton: false,
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } catch (error) {
      console.error("Error updating level visibility:", error);
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error.response?.data?.message ||
          "Error updating level visibility",
        background: "#1c1917",
        color: "#f5f5f4",
      });
    } finally {
      setTogglingLevelId(null);
    }
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container>
      <div className="min-h-screen ">
        <PageHeader
          title="Create a Level"
          align="center"
          className="mt-8 mb-6"
        />
        <p className="text-center text-sm text-slate-500 dark:text-gray-400 -mt-4 mb-6">
          {loadingLevels
            ? "Loading levels..."
            : levels.length > 0
              ? `Existing levels: ${levels.map((level) => level.level).join(", ")}`
              : "No levels yet"}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-md border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-transparent dark:bg-stone-800 dark:text-white dark:shadow-none"
        >
          <div>
            <label htmlFor="levelName" className="block font-medium">
              Level Name
            </label>
            <input
              type="text"
              id="levelName"
              name="levelName"
              value={levelName}
              onChange={(event) => setLevelName(event.target.value)}
              placeholder="e.g. C1"
              required
              className="mt-1 block w-full input-md rounded-md border-slate-300 text-black shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white"
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-4">
            {loading ? "Creating..." : "Create Level"}
          </Button>
        </form>

        {isSuperAdmin && (
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-transparent dark:bg-stone-800 dark:text-white dark:shadow-none">
            <h3 className="font-medium mb-3">Manage Level Visibility</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
              Hiding a level removes it and its words from the word list for
              basic users/guests. You'll keep seeing it here and everywhere
              else while managing content.
            </p>
            {loadingLevels ? (
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Loading levels...
              </p>
            ) : levels.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-gray-400">
                No levels yet
              </p>
            ) : (
              <ul className="space-y-2">
                {levels.map((level) => (
                  <li
                    key={level.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2 dark:bg-stone-900"
                  >
                    <span className="flex items-center gap-2">
                      {level.level}
                      {level.isHidden && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-600/20 dark:text-rose-300">
                          Hidden
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(level)}
                      disabled={togglingLevelId === level.id}
                      className={`rounded-md px-3 py-1 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        level.isHidden
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {togglingLevelId === level.id
                        ? "..."
                        : level.isHidden
                          ? "Unhide"
                          : "Hide"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default LevelForm;
