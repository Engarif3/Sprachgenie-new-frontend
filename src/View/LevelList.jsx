import React, { useState, useEffect } from "react";
import axios from "../axios";

const LevelList = () => {
  const [levels, setLevels] = useState([]);
  const [editingLevel, setEditingLevel] = useState();
  const [newLevelName, setNewLevelName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteLevelId, setDeleteLevelId] = useState(null);
  const [confirmationInput, setConfirmationInput] = useState("");

  // Fetch all levels from the backend
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get("/levels");
        setLevels(response.data);
      } catch (error) {
        console.error("Error fetching levels", error);
      }
    };
    fetchLevels();
  }, []);

  // Handle level update
  const handleUpdateLevel = async (id) => {
    try {
      const response = await axios.put(`/levels/${id}`, {
        level: newLevelName,
      });
      setLevels(
        levels.map((level) => (level.id === id ? response.data.level : level))
      );
      setEditingLevel(null);
      setNewLevelName("");
    } catch (error) {
      console.error("Error updating level", error);
    }
  };

  // Handle level delete
  const handleDeleteLevel = async () => {
    if (confirmationInput !== "DELETE") {
      alert("Please type DELETE to confirm deletion.");
      return;
    }
    try {
      const response = await axios.delete(`/levels/${deleteLevelId}`);
      console.log(response.data);
      setLevels(levels.filter((level) => level.id !== deleteLevelId));
      setShowModal(false);
      setConfirmationInput("");
    } catch (error) {
      console.error("Error deleting level", error);
      alert("Failed to delete level. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Levels</h2>
      <ul className="space-y-4">
        {levels.map((level) => (
          <li key={level.id} className="flex items-center justify-between">
            {editingLevel === level.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="p-2 border border-gray-300 rounded"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="Update level"
                />
                <button
                  onClick={() => handleUpdateLevel(level.id)}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Update
                </button>
                <button
                  onClick={() => setEditingLevel(null)}
                  className="bg-gray-500 text-white p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-lg">{level.level}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditingLevel(level.id);
                      setNewLevelName(level.level);
                    }}
                    className="bg-yellow-500 text-white p-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteLevelId(level.id);
                      setShowModal(true);
                    }}
                    className="bg-red-500 text-white p-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this level?
            </h3>
            <p className="mb-4">Type DELETE to confirm:</p>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmationInput("");
                }}
                className="bg-gray-500 text-white p-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLevel}
                className="bg-red-500 text-white p-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelList;
