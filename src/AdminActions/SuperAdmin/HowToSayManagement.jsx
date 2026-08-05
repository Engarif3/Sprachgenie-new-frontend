import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../axios";
import Container from "../../utils/Container";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";

const PAGE_LIMIT = 40;

// Numbered-page-buttons pagination, same shape as AdminPaginationForUsers —
// kept local to this feature since it's the only new, fully self-contained
// module being added here.
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2">
      <button
        onClick={() => page > 1 && onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            page === num
              ? "bg-sky-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => page < totalPages && onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        Next
      </button>
    </div>
  );
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white dark:placeholder-gray-400";

const HowToSayManagement = () => {
  const [titles, setTitles] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [newTitleText, setNewTitleText] = useState("");
  const [creatingTitle, setCreatingTitle] = useState(false);

  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState("");
  const [savingTitleId, setSavingTitleId] = useState(null);
  const [deletingTitleId, setDeletingTitleId] = useState(null);

  const [newSentenceTextByTitle, setNewSentenceTextByTitle] = useState({});
  const [addingSentenceTitleId, setAddingSentenceTitleId] = useState(null);

  const [editingSentenceId, setEditingSentenceId] = useState(null);
  const [editingSentenceText, setEditingSentenceText] = useState("");
  const [savingSentenceId, setSavingSentenceId] = useState(null);
  const [deletingSentenceId, setDeletingSentenceId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const fetchTitles = async (targetPage, search) => {
    setLoading(true);
    try {
      const response = await api.get("/how-to-say-titles/all", {
        params: { page: targetPage, limit: PAGE_LIMIT, search: search || undefined },
      });
      setTitles(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (error) {
      console.error("Failed to fetch 'How to say it in German' titles:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load",
        text: error.response?.data?.message || "Could not load titles.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles(page, appliedSearch);
  }, [page, appliedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleCreateTitle = async (e) => {
    e.preventDefault();
    const title = newTitleText.trim();
    if (!title) return;

    setCreatingTitle(true);
    try {
      await api.post("/how-to-say-titles/create", { title });
      setNewTitleText("");
      if (page === 1) {
        await fetchTitles(1, appliedSearch);
      } else {
        setPage(1);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not create title",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setCreatingTitle(false);
    }
  };

  const startEditTitle = (titleItem) => {
    setEditingTitleId(titleItem.id);
    setEditingTitleText(titleItem.title);
  };

  const cancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleText("");
  };

  const saveTitle = async (titleId) => {
    const title = editingTitleText.trim();
    if (!title) return;

    setSavingTitleId(titleId);
    try {
      const response = await api.put(`/how-to-say-titles/update/${titleId}`, {
        title,
      });
      setTitles((prev) =>
        prev.map((item) =>
          item.id === titleId ? { ...item, title: response.data.data.title } : item,
        ),
      );
      cancelEditTitle();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not update title",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingTitleId(null);
    }
  };

  const deleteTitle = async (titleItem) => {
    const sentenceCount = titleItem.sentences?.length || 0;
    const result = await Swal.fire({
      title: "Delete this title?",
      html: `Delete <strong>"${titleItem.title}"</strong>${
        sentenceCount > 0
          ? ` and its ${sentenceCount} German sentence${sentenceCount === 1 ? "" : "s"}`
          : ""
      }? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingTitleId(titleItem.id);
    try {
      await api.delete(`/how-to-say-titles/delete/${titleItem.id}`);
      // If this was the only item left on a page beyond the first, step back
      // a page instead of fetching an out-of-range/empty one.
      const nextPage = titles.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchTitles(page, appliedSearch);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete title",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingTitleId(null);
    }
  };

  const addSentence = async (titleId) => {
    const sentence = (newSentenceTextByTitle[titleId] || "").trim();
    if (!sentence) return;

    setAddingSentenceTitleId(titleId);
    try {
      const response = await api.post("/how-to-say-sentences/create", {
        titleId,
        sentence,
      });
      setTitles((prev) =>
        prev.map((item) =>
          item.id === titleId
            ? { ...item, sentences: [...(item.sentences || []), response.data.data] }
            : item,
        ),
      );
      setNewSentenceTextByTitle((prev) => ({ ...prev, [titleId]: "" }));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not add sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setAddingSentenceTitleId(null);
    }
  };

  const startEditSentence = (sentenceItem) => {
    setEditingSentenceId(sentenceItem.id);
    setEditingSentenceText(sentenceItem.sentence);
  };

  const cancelEditSentence = () => {
    setEditingSentenceId(null);
    setEditingSentenceText("");
  };

  const saveSentence = async (titleId, sentenceId) => {
    const sentence = editingSentenceText.trim();
    if (!sentence) return;

    setSavingSentenceId(sentenceId);
    try {
      const response = await api.put(
        `/how-to-say-sentences/update/${sentenceId}`,
        { sentence },
      );
      setTitles((prev) =>
        prev.map((item) =>
          item.id === titleId
            ? {
                ...item,
                sentences: item.sentences.map((s) =>
                  s.id === sentenceId ? response.data.data : s,
                ),
              }
            : item,
        ),
      );
      cancelEditSentence();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not update sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingSentenceId(null);
    }
  };

  const deleteSentence = async (titleId, sentenceItem) => {
    const result = await Swal.fire({
      title: "Delete this sentence?",
      html: `Delete <strong>"${sentenceItem.sentence}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    setDeletingSentenceId(sentenceItem.id);
    try {
      await api.delete(`/how-to-say-sentences/delete/${sentenceItem.id}`);
      setTitles((prev) =>
        prev.map((item) =>
          item.id === titleId
            ? {
                ...item,
                sentences: item.sentences.filter((s) => s.id !== sentenceItem.id),
              }
            : item,
        ),
      );
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete sentence",
        text: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setDeletingSentenceId(null);
    }
  };

  return (
    <Container>
      <div className="min-h-screen pb-16">
        <PageHeader
          title="How to say it in German"
          subtitle="Create an English title, then add the German sentences that show how to say it."
          className="mt-8 mb-6"
        />

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles..."
            className={`${inputClass} sm:max-w-sm`}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {appliedSearch && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        {/* Create new title */}
        <form
          onSubmit={handleCreateTitle}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-800/50"
        >
          <input
            type="text"
            value={newTitleText}
            onChange={(e) => setNewTitleText(e.target.value)}
            placeholder={'New title, e.g. "I used to"'}
            className={inputClass}
          />
          <Button type="submit" disabled={creatingTitle || !newTitleText.trim()}>
            {creatingTitle ? "Adding..." : "+ Add Title"}
          </Button>
        </form>

        {/* Titles list */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-gray-400">
            Loading...
          </div>
        ) : titles.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-gray-400">
            {appliedSearch ? "No titles match your search." : "No titles yet — add one above."}
          </div>
        ) : (
          <div className="space-y-6">
            {titles.map((titleItem) => (
              <div
                key={titleItem.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
              >
                {/* Title row */}
                <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                  {editingTitleId === titleItem.id ? (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        className={inputClass}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          onClick={() => saveTitle(titleItem.id)}
                          disabled={savingTitleId === titleItem.id || !editingTitleText.trim()}
                        >
                          {savingTitleId === titleItem.id ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={cancelEditTitle}
                          disabled={savingTitleId === titleItem.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {titleItem.title}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => startEditTitle(titleItem)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => deleteTitle(titleItem)}
                          disabled={deletingTitleId === titleItem.id}
                        >
                          {deletingTitleId === titleItem.id ? "Deleting..." : "🗑️ Delete"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Sentences */}
                <div className="space-y-2">
                  {(titleItem.sentences || []).length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-gray-500">
                      No German sentences yet.
                    </p>
                  )}

                  {(titleItem.sentences || []).map((sentenceItem) => (
                    <div
                      key={sentenceItem.id}
                      className="flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {editingSentenceId === sentenceItem.id ? (
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={editingSentenceText}
                            onChange={(e) => setEditingSentenceText(e.target.value)}
                            className={inputClass}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="success"
                              size="sm"
                              onClick={() => saveSentence(titleItem.id, sentenceItem.id)}
                              disabled={
                                savingSentenceId === sentenceItem.id ||
                                !editingSentenceText.trim()
                              }
                            >
                              {savingSentenceId === sentenceItem.id ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={cancelEditSentence}
                              disabled={savingSentenceId === sentenceItem.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 text-sm text-slate-700 dark:text-gray-200">
                            🇩🇪 {sentenceItem.sentence}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditSentence(sentenceItem)}
                            >
                              ✏️
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSentence(titleItem.id, sentenceItem)}
                              disabled={deletingSentenceId === sentenceItem.id}
                            >
                              🗑️
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add sentence */}
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <input
                      type="text"
                      value={newSentenceTextByTitle[titleItem.id] || ""}
                      onChange={(e) =>
                        setNewSentenceTextByTitle((prev) => ({
                          ...prev,
                          [titleItem.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSentence(titleItem.id);
                        }
                      }}
                      placeholder="Add a German sentence..."
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addSentence(titleItem.id)}
                      disabled={
                        addingSentenceTitleId === titleItem.id ||
                        !(newSentenceTextByTitle[titleItem.id] || "").trim()
                      }
                    >
                      {addingSentenceTitleId === titleItem.id ? "Adding..." : "+ Add"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total > 0 && (
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            {total} title{total === 1 ? "" : "s"} total — page {page} of {totalPages}
          </p>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </Container>
  );
};

export default HowToSayManagement;
