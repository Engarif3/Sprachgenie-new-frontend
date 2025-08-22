import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { getUserInfo } from "../../services/auth.services";
import { useNavigate } from "react-router-dom";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";

const token = getFromLocalStorage(authKey);

const UpdateUserStatus = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const userInfo = getUserInfo() || {};
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (userInfo?.role !== "super_admin") {
  //     navigate("/");
  //   }

  //   api
  //     .get("https://sprcahgenie-new-backend.vercel.app/api/v1/user", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     })
  //     .then((response) => {
  //       if (response.data.success && Array.isArray(response.data.data)) {
  //         setUsers(response.data.data);
  //       } else {
  //         setError("Failed to fetch users or invalid data format");
  //       }
  //     })
  //     .catch(() => {
  //       setError("Error fetching users");
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // }, []);

  // const handleStatusChange = (userId, newStatus) => {
  //   if (!token) {
  //     Swal.fire("Error", "No authorization token found", "error");
  //     return;
  //   }

  //   Swal.fire({
  //     // title: "Are you sure?",
  //     text: `Change the status to ${newStatus}?`,
  //     // icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Yes",
  //     cancelButtonText: "No",
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       api
  //         .patch(
  //           `/user/update-status/${userId}`,
  //           // { status: newStatus },
  //           { status: newStatus, performedById: userInfo.id },
  //           { headers: { Authorization: `Bearer ${token}` } }
  //         )
  //         .then((response) => {
  //           if (response.data.success) {
  //             setUsers((prevUsers) =>
  //               prevUsers.map((user) =>
  //                 user.id === userId
  //                   ? { ...user, status: newStatus } // or role: newRole
  //                   : user
  //               )
  //             );
  //             Swal.fire({
  //               title: "Success",
  //               text: "User status updated successfully!",
  //               icon: "success",
  //               timer: 1000, // Auto-close after 1 second
  //               showConfirmButton: false, // Hide the confirm button
  //             });
  //           } else {
  //             Swal.fire("Failed", "Failed to update user status", "error");
  //           }
  //         })
  //         .catch(() => {
  //           Swal.fire("Error", "Failed to update user status", "error");
  //         });
  //     }
  //   });
  // };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const freshToken = getFromLocalStorage(authKey);
        const response = await api.get("/user", {
          headers: { Authorization: `Bearer ${freshToken}` },
        });

        if (response.data.success && Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        } else {
          setError("Failed to fetch users or invalid data format");
        }
      } catch (err) {
        console.error(
          "Error fetching users:",
          err.response || err.message || err
        );
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.role === "super_admin") {
      fetchUsers();
    } else {
      navigate("/");
    }
  }, []);

  const handleStatusChange = (userId, newStatus) => {
    const freshToken = getFromLocalStorage(authKey);
    if (!freshToken) {
      Swal.fire("Error", "No authorization token found", "error");
      return;
    }

    Swal.fire({
      text: `Change the status to ${newStatus}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(
            `/user/update-status/${userId}`,
            { status: newStatus, performedById: userInfo.id },
            { headers: { Authorization: `Bearer ${freshToken}` } }
          )
          .then((response) => {
            if (response.data.success) {
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === userId ? { ...user, status: newStatus } : user
                )
              );
              Swal.fire({
                title: "Success",
                text: "User status updated successfully!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });
            } else {
              Swal.fire("Failed", "Failed to update user status", "error");
            }
          })
          .catch(() => {
            Swal.fire("Error", "Failed to update user status", "error");
          });
      }
    });
  };

  const handleRoleChange = (userId, newRole) => {
    // if (!token) {
    //   Swal.fire("Error", "No authorization token found", "error");
    //   return;
    // }

    const freshToken = getFromLocalStorage(authKey);
    if (!freshToken) {
      Swal.fire("Error", "No authorization token found", "error");
      return;
    }

    let newAssignedRole = newRole === "BASIC_USER" ? "Basic User" : "Admin";

    Swal.fire({
      // title: "Are you sure?",
      text: `Change the role to  ${newAssignedRole}?`,
      // icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(
            `/user/update-role/${userId}`,
            // { role: newRole },
            { role: newRole, performedById: userInfo.id },

            { headers: { Authorization: `Bearer ${freshToken}` } }
          )
          .then((response) => {
            if (response.data.success) {
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === userId ? { ...user, role: newRole } : user
                )
              );
              Swal.fire({
                title: "Success",
                text: "User role updated successfully!",
                icon: "success",
                timer: 1000, // Auto-close after 1 second
                showConfirmButton: false, // Hide the confirm button
              });
            } else {
              Swal.fire("Failed", "Failed to update user role", "error");
            }
          })
          .catch(() => {
            Swal.fire("Error", "Failed to update user role", "error");
          });
      }
    });
  };

  const admins = users.filter((user) => user.role === "ADMIN");
  const basicUsers = users.filter((user) => user.role === "BASIC_USER");
  const filteredUsers =
    selectedStatus === "ALL"
      ? basicUsers
      : basicUsers.filter((user) => user.status === selectedStatus);

  // if (loading) return <div>Loading users...</div>;
  if (error) return <div>{error}</div>;

  // Separate admins and basic users

  return (
    // <Container>
    <>
      {userInfo?.role === "super_admin" && (
        <div className="container mx-auto p-4 min-h-screen">
          <h2 className="text-md md:text-2xl lg:text-2xl font-bold mb-4 text-center  py-2 text-white bg-cyan-700  rounded">
            Update User Status -{" "}
            <span className="text-md text-orange-600">
              ({admins.length + basicUsers.length})
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
          {/* Admins Table */}
          {admins.length > 0 && (
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-center mb-4 uppercase text-white">
                Admins
                <span className="text-md text-cyan-600">
                  {" "}
                  ({admins.length})
                </span>
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border">
                  <thead>
                    <tr className="bg-green-500 text-white">
                      <th className="p-2 text-center hidden lg:table-cell xl:table-cell">
                        Name
                      </th>
                      <th className="p-2 text-center">Email</th>
                      <th className="p-2 text-center">Role</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b  odd:bg-white even:bg-gray-200"
                      >
                        <td className="p-1 md:p-1 lg:p-1 text-center hidden lg:table-cell xl:table-cell text-slate-950">
                          {user.name}
                        </td>
                        <td className="p-1 md:p-1 lg:p-1 text-start md:text-center lg:text-center text-sm md:text-md lg:text-md text-slate-950">
                          {user.email}
                        </td>
                        {/* <td className="p-2 text-center">ADMIN</td> */}
                        <td className="p-1 md:p-1 lg:p-1 text-center">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            className="p-1 md:p-1 lg:p-1 border rounded"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="BASIC_USER">USER</option>
                          </select>
                        </td>
                        <td className="p-1 md:p-1 lg:p-1 text-center">
                          <select
                            value={user.status}
                            onChange={(e) =>
                              handleStatusChange(user.id, e.target.value)
                            }
                            className="p-1 md:p-1 lg:p-1 border rounded"
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
          )}

          {/* Basic Users Table */}
          {basicUsers.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-center  uppercase text-white">
                Users{" "}
                <span className="text-md text-cyan-600">
                  ({basicUsers.length})
                </span>
              </h3>
              {/* Status Filter Dropdown */}
              <div className="flex justify-end">
                <div className="mb-2 text-center">
                  <label className="mr-2 font-semibold text-white">
                    Status:
                  </label>
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
                <table className="min-w-full table-auto border">
                  <thead>
                    <tr className="bg-red-500 text-white">
                      <th className="p-2 text-center hidden lg:table-cell xl:table-cell">
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
                        key={user.id}
                        className="border-b  odd:bg-white even:bg-gray-200"
                      >
                        <td className="p-1 md:p-1 lg:p-1 text-center hidden lg:table-cell xl:table-cell text-slate-950">
                          {user.name}
                        </td>
                        <td className="p-1 md:p-1 lg:p-1 text-start md:text-center lg:text-center  text-sm md:text-md lg:text-md text-slate-950">
                          {user.email}
                        </td>
                        {/* <td className="p-2 text-center">USER</td> */}
                        <td className="p-1 md:p-1 lg:p-1 text-center">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            className="p-1 md:p-1 lg:p-1 border rounded"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="BASIC_USER">USER</option>
                          </select>
                        </td>
                        <td className="p-1 md:p-1 lg:p-1 text-center">
                          <select
                            value={user.status}
                            onChange={(e) =>
                              handleStatusChange(user.id, e.target.value)
                            }
                            className="p-1 md:p-1 lg:p-1 border rounded"
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
          )}
        </div>
      )}
      {/* </Container> */}
    </>
  );
};

export default UpdateUserStatus;
