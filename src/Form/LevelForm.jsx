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
  const { isAdmin, isLoggedIn: userLoggedIn, userId } = useAuth();
  const canAccess = userLoggedIn && userId && isAdmin;
  const [levelName, setLevelName] = useState("");
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loading, setLoading] = useState(false);

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
        <p className="text-center text-sm text-gray-400 -mt-4 mb-6">
          {loadingLevels
            ? "Loading levels..."
            : levels.length > 0
              ? `Existing levels: ${levels.map((level) => level.level).join(", ")}`
              : "No levels yet"}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-stone-800 rounded-md text-white"
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
              className="mt-1 block w-full input-md rounded-md text-black border-gray-300 shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50"
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-4">
            {loading ? "Creating..." : "Create Level"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default LevelForm;
