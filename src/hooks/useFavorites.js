import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../axios";
import { useAuth } from "../services/auth.services";

// Generic favorites hook for conversations/stories. Unlike the word-favorites
// flow, the title-list pages already fetch full item data separately — this
// only tracks the favorited id set, used to color each card's heart icon and
// drive the "favorites only" filter.
export const useFavorites = (resource, idField, itemLabel = "item") => {
  const { userId, isLoggedIn } = useAuth();
  const endpoint = `/favorite-${resource}`;

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setFavoriteIds([]);
      return;
    }

    let cancelled = false;

    api
      .get(`${endpoint}/${userId}`)
      .then((response) => {
        if (!cancelled) setFavoriteIds(response.data?.data || []);
      })
      .catch((error) => {
        console.error(`Failed to load favorite ${resource}:`, error);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, isLoggedIn, resource, userId]);

  const toggleFavorite = useCallback(
    async (id) => {
      if (!isLoggedIn) {
        await Swal.fire({
          icon: "info",
          title: "Please log in to save favorites",
          timer: 1800,
          showConfirmButton: false,
        });
        return;
      }
      if (loadingIds[id]) return;

      const wasFavorite = favoriteIds.includes(id);

      if (wasFavorite) {
        const result = await Swal.fire({
          title: "Remove from favorites?",
          text: `This ${itemLabel} will be removed from your favorites.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, remove",
          cancelButtonText: "Cancel",
          reverseButtons: true,
        });
        if (!result.isConfirmed) return;
      }

      setLoadingIds((prev) => ({ ...prev, [id]: true }));

      try {
        if (wasFavorite) {
          setFavoriteIds((prev) => prev.filter((existing) => existing !== id));
          await api.delete(`${endpoint}/${id}`);
        } else {
          setFavoriteIds((prev) => [...prev, id]);
          await api.post(endpoint, { [idField]: id });
        }
      } catch (error) {
        setFavoriteIds((prev) =>
          wasFavorite
            ? [...prev, id]
            : prev.filter((existing) => existing !== id),
        );
        await Swal.fire({
          icon: "error",
          title: "Failed to update favorite",
          text: error.response?.data?.error || "Please try again.",
        });
      } finally {
        setLoadingIds((prev) => ({ ...prev, [id]: false }));
      }
    },
    [endpoint, favoriteIds, idField, isLoggedIn, itemLabel, loadingIds],
  );

  const deleteAllFavorites = useCallback(async () => {
    try {
      await api.delete(`${endpoint}/delete-all/${userId}`);
      setFavoriteIds([]);
      setShowFavoritesOnly(false);
      await Swal.fire({
        icon: "success",
        title: "All favorites deleted",
        timer: 1500,
        showConfirmButton: false,
      });
      return true;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Failed to delete favorites",
        text: error.response?.data?.error || "Please try again.",
      });
      return false;
    }
  }, [endpoint, userId]);

  return {
    favoriteIds,
    loadingIds,
    toggleFavorite,
    deleteAllFavorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
  };
};
