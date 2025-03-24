import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { getUserInfo } from "../../services/auth.services";
import { useNavigate } from "react-router-dom";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";

const UpdateBasicUserStatus = () => {
  const [basicUsers, setBasicUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const userInfo = getUserInfo() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo?.role !== "admin") {
      navigate("/"); // Redirect to login if unauthorized
    }

    // Fetch all users from the API
    api
      .get("/basicUser")
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          // Filter only BASIC_USER role users
          const users = response.data.data.filter(
            (user) => user.user.role === "BASIC_USER"
          );
          setBasicUsers(users);
        } else {
          setError("Failed to fetch users or invalid data format");
        }
      })
      .catch((err) => {
        setError("Error fetching users");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const token = getFromLocalStorage(authKey); // Get the token from local storage

  const handleStatusChange = (userId, newStatus) => {
    if (!token) {
      Swal.fire("Error", "No authorization token found", "error");
      return;
    }
    // Show SweetAlert confirmation before making the update
    Swal.fire({
      // title: "Are you sure?",
      text: `Change the status to ${newStatus}?`,
      // icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        // If confirmed, proceed with the status update
        api
          .patch(
            `/user/update-basicUser-status/${userId}`,
            {
              status: newStatus,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`, // Send the token with the request
              },
            }
          )
          .then((response) => {
            if (response.data.success) {
              // Update only the status of the specific user in the local state
              setBasicUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.user.id === userId // Ensure matching the user's ID
                    ? { ...user, user: { ...user.user, status: newStatus } }
                    : user
                )
              );
              Swal.fire({
                title: "Success",
                text: "User status updated successfully!",
                icon: "success",
                timer: 1000, // Auto-close after 1 second
                showConfirmButton: false, // Hide the confirm button
              });
            } else {
              Swal.fire("Failed", "Failed to update user status", "error");
            }
          })
          .catch((err) => {
            // const errorMessage =
            //   err.response?.data?.message || "Error updating user status";
            // Swal.fire("Error", errorMessage, "error");
            console.log("Error Response:", err.response); // Add logging for response error
            Swal.fire("Error", "Failed to update user status", "error");
          });
      }
    });
  };

  const filteredUsers =
    selectedStatus === "ALL"
      ? basicUsers
      : basicUsers.filter((user) => user.user.status === selectedStatus);

  // if (loading) {
  //   return <div>Loading users...</div>;
  // }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Container>
      {userInfo?.role === "admin" ? (
        <div className="container mx-auto p-4 min-h-screen">
          <h2 className="text-2xl font-bold mb-4 text-center text-white  py-2 bg-cyan-700 rounded">
            Update User Status -
            <span className="text-md text-orange-600">
              {" "}
              ({basicUsers.length})
            </span>
          </h2>
          <p className="flex justify-center items-center  ">
            <span>
              {loading && (
                <ScaleLoader
                  color="oklch(0.5 0.134 242.749)"
                  loading={loading}
                  // cssOverride={override}
                  size={150}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              )}
            </span>
          </p>

          {!loading && (
            <>
              {/* Status Filter Dropdown */}
              <div className="flex justify-end">
                <div className="mb-4 text-center">
                  <label className="mr-2 font-semibold">Status:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border p-1 rounded"
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DELETED">Deleted</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="p-2 hidden lg:table-cell xl:table-cell text-center ">
                        Name
                      </th>
                      <th className="p-2 text-center">Email</th>
                      <th className="p-2 text-center">Role</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.user.id}
                        className={`${
                          user.user.role === "ADMIN"
                            ? "bg-cyan-500 font-bold"
                            : ""
                        } border-b  odd:bg-white even:bg-gray-200`}
                      >
                        <td className="p-1 md:p-1 lg:p-1 hidden lg:table-cell xl:table-cell  text-center text-slate-950">
                          {user.name}
                        </td>
                        <td className="p-1 md:p-1 lg:p-1 text-start md:text-center lg:text-center text-sm md:text-md lg:text-md text-slate-950">
                          {user.email}
                        </td>
                        {/* <td className="p-2 text-center">{user.user.role}</td> */}
                        <td className="p-1 md:p-1 lg:p-1  text-center">
                          {user.user.role === "BASIC_USER"
                            ? "USER"
                            : user.user.role === "ADMIN"
                            ? "ADMIN"
                            : user.user.role}
                        </td>
                        <td className="p-1 md:p-1 lg:p-1  text-center">
                          <select
                            value={user.user.status}
                            onChange={(e) =>
                              handleStatusChange(user.user.id, e.target.value)
                            }
                            className="p-1 md:p-1 lg:p-1  border rounded"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DELETED">Deleted</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Container>
  );
};

export default UpdateBasicUserStatus;
