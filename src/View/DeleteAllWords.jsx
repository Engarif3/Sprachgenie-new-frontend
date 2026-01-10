import React from "react";
import Swal from "sweetalert2";
import api from "../axios";

const DeleteAllWords = () => {
  const handleDeleteAllWords = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action will delete all words and cannot be undone. Type password to delete.",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Type your password here...",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (value !== "aydin451280") {
          return "Password incorrect";
        }
        return null;
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete("/delete-all-words");

        if (response.data?.success) {
          Swal.fire("Deleted!", "All words have been deleted.", "success");
        } else {
          Swal.fire(
            "Error!",
            `Failed to delete words: ${
              response.data?.message || "Unknown error"
            }`,
            "error"
          );
        }
      } catch (error) {
        Swal.fire(
          "Error!",
          "An error occurred while trying to delete all words.",
          "error"
        );
      }
    }
  };

  return (
    <div>
      <div className="min-h-screen flex justify-center items-center">
        <button
          onClick={handleDeleteAllWords}
          className="btn btn-wide btn-warning"
        >
          Delete All Words
        </button>
      </div>
    </div>
  );
};

export default DeleteAllWords;
