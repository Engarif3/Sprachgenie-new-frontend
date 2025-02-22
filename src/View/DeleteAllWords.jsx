import React from "react";
import Swal from "sweetalert2";

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
        // const response = await fetch("http://localhost:3000/delete-all-words", {
        const response = await fetch(
          "https://sprcahgenie-new-backend.vercel.app/api/v1/delete-all-words",
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          Swal.fire("Deleted!", "All words have been deleted.", "success");
        } else {
          const errorData = await response.json();
          Swal.fire(
            "Error!",
            `Failed to delete words: ${errorData.error}`,
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
