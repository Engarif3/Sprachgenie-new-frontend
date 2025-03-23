import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { getUserInfo } from "../../services/auth.services";
import { useNavigate } from "react-router-dom";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";
import api from "../../axios";

const UpdateBasicUserStatus = () => {
  const [basicUsers, setBasicUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      title: "Are you sure?",
      text: `Do you want to change the status of this user to ${newStatus}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "No, cancel!",
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

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    // <Container>
    //   {userInfo?.role === "admin" ? (
    //     <div className="container mx-auto p-4 min-h-screen">
    //       <h2 className="text-2xl font-bold mb-4 text-center">
    //         Update User Status
    //         <br />
    //         <span className="text-md"> Total users: {basicUsers.length}</span>
    //       </h2>
    //       <div className="space-y-4">
    //         {basicUsers.map((user) => (
    //           <div key={user.user.id} className="p-4 border rounded shadow-md">
    //             <div className="flex justify-between items-center">
    //               <div>
    //                 <p className="text-lg font-semibold">{user.name}</p>
    //                 <p>{user.email}</p>
    //               </div>
    //               <div>
    //                 <select
    //                   value={user.user.status} // Use current status as the value
    //                   onChange={(e) =>
    //                     handleStatusChange(user.user.id, e.target.value)
    //                   }
    //                   className="p-2 border rounded"
    //                 >
    //                   <option value="ACTIVE">Active</option>
    //                   <option value="BLOCKED">Blocked</option>
    //                   <option value="DELETED">Deleted</option>
    //                   <option value="PENDING">Pending</option>
    //                 </select>
    //               </div>
    //             </div>
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   ) : null}
    // </Container>
    <Container>
      {userInfo?.role === "admin" ? (
        <div className="container mx-auto p-4 min-h-screen">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Update User Status
            <br />
            <span className="text-md"> Total users: {basicUsers.length}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">Name</th>
                  <th className="p-2 text-center">Email</th>
                  <th className="p-2 text-center">Role</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {basicUsers.map((user) => (
                  <tr
                    key={user.user.id}
                    className={`${
                      user.user.role === "ADMIN" ? "bg-cyan-500 font-bold" : ""
                    } border-b`}
                  >
                    <td className="p-2 text-center">{user.name}</td>
                    <td className="p-2 text-center">{user.email}</td>
                    {/* <td className="p-2 text-center">{user.user.role}</td> */}
                    <td className="p-2 text-center">
                      {user.user.role === "BASIC_USER"
                        ? "USER"
                        : user.user.role === "ADMIN"
                        ? "ADMIN"
                        : user.user.role}
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={user.user.status}
                        onChange={(e) =>
                          handleStatusChange(user.user.id, e.target.value)
                        }
                        className="p-2 border rounded"
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
        </div>
      ) : null}
    </Container>
  );
};

export default UpdateBasicUserStatus;
