import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { getUserInfo } from "../../services/auth.services";
import { useNavigate } from "react-router-dom";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";
import { dateTimeFormatter } from "../../utils/formatDateTime";
import Pagination from "../AdminPaginationForUsers";

const UpdateUserStatus = () => {
  const [admins, setAdmins] = useState([]);
  const [basicUsers, setBasicUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [adminPage, setAdminPage] = useState(1);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [basicPage, setBasicPage] = useState(1);
  const [basicTotalPages, setBasicTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState("users");

  const userInfo = getUserInfo() || {};
  const navigate = useNavigate();
  const token = getFromLocalStorage(authKey);

  // Fetch Admins
  const fetchAdmins = async (page = 1, limit = 50) => {
    try {
      setLoadingAdmins(true);
      if (!token) throw new Error("No token found");

      const response = await api.get(
        `/user?page=${page}&limit=${limit}&role=ADMIN`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        setAdmins(response.data.data);
        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit;
        setAdminTotalPages(Math.ceil(total / limitUsed));
      } else {
        setError("Failed to fetch admins");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Fetch Basic Users
  const fetchBasicUsers = async (page = 1, status = "ALL", limit = 50) => {
    try {
      setLoadingUsers(true);
      if (!token) throw new Error("No token found");

      const statusParam = status === "ALL" ? "" : `&status=${status}`;
      const response = await api.get(
        `/user?page=${page}&limit=${limit}&role=BASIC_USER${statusParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        setBasicUsers(response.data.data);
        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit;
        setBasicTotalPages(Math.ceil(total / limitUsed));
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userInfo?.role === "super_admin") {
      fetchAdmins(adminPage);
      fetchBasicUsers(basicPage, selectedStatus);
    } else {
      navigate("/");
    }
  }, [adminPage, basicPage, selectedStatus]);

  // Handle status change
  const handleStatusChange = (userId, newStatus) => {
    if (!token) {
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
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .then((response) => {
            if (response.data.success) {
              setAdmins((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, status: newStatus } : u
                )
              );
              setBasicUsers((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, status: newStatus } : u
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
              Swal.fire("Failed", "Failed to update status", "error");
            }
          })
          .catch(() => Swal.fire("Error", "Failed to update status", "error"));
      }
    });
  };

  // Handle role change
  const handleRoleChange = (userId, newRole) => {
    if (!token) {
      Swal.fire("Error", "No authorization token found", "error");
      return;
    }

    const newAssignedRole = newRole === "BASIC_USER" ? "Basic User" : "Admin";

    Swal.fire({
      text: `Change the role to ${newAssignedRole}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(
            `/user/update-role/${userId}`,
            { role: newRole, performedById: userInfo.id },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .then((response) => {
            if (response.data.success) {
              const updatedUser = { ...response.data.data, role: newRole };

              setAdmins((prev) => {
                if (newRole === "BASIC_USER")
                  return prev.filter((u) => u.id !== userId);
                if (!prev.find((u) => u.id === userId))
                  return [...prev, updatedUser];
                return prev.map((u) => (u.id === userId ? updatedUser : u));
              });

              setBasicUsers((prev) => {
                if (newRole === "ADMIN")
                  return prev.filter((u) => u.id !== userId);
                if (!prev.find((u) => u.id === userId))
                  return [...prev, updatedUser];
                return prev.map((u) => (u.id === userId ? updatedUser : u));
              });

              Swal.fire({
                title: "Success",
                text: "User role updated successfully!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });
            } else {
              Swal.fire("Failed", "Failed to update role", "error");
            }
          })
          .catch(() => Swal.fire("Error", "Failed to update role", "error"));
      }
    });
  };

  if (error) return <div>{error}</div>;

  return (
    <Container>
      {userInfo?.role === "super_admin" && (
        <div className="container mx-auto p-4 min-h-screen">
          <h2 className="text-2xl font-bold mb-4 text-center py-2 text-white bg-cyan-700 rounded">
            Update User Status
          </h2>

          {/* Tabs */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setActiveTab("admins")}
              className={`mt-12 px-4 py-2 rounded-t font-semibold ${
                activeTab === "admins"
                  ? "bg-green-600 text-white mr-1"
                  : "bg-gray-600 mr-1"
              }`}
            >
              Admins ({admins.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`mt-12 px-4 py-2 rounded-t font-semibold ${
                activeTab === "users"
                  ? "bg-green-600 text-white ml-1"
                  : "bg-gray-600 ml-1"
              }`}
            >
              Users ({basicUsers.length})
            </button>
          </div>

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <>
              {loadingAdmins ? (
                <div className="flex justify-center items-center">
                  <ScaleLoader
                    color="oklch(0.5 0.134 242.749)"
                    loading={loadingAdmins}
                    size={150}
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border mt-10">
                      <thead>
                        <tr className="bg-sky-900 text-white">
                          <th className="p-2 text-center hidden lg:table-cell">
                            Name
                          </th>
                          <th className="p-2 text-center">Email</th>
                          <th className="p-2 text-center">Role</th>
                          <th className="p-2 text-center">Action</th>
                           <th className="p-2 text-center hidden lg:table-cell">
                        Created at <br />
                        <span className="text-sm font-thin ">
                          DD:MM:YYYY-HH:MM:SS
                        </span>
                      </th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b odd:bg-white even:bg-gray-200"
                          >
                            <td className="p-1 text-center hidden lg:table-cell text-slate-950">
                              {user.name}
                            </td>
                            <td className="p-1 text-center text-slate-950">
                              {user.email}
                            </td>
                            <td className="p-1 text-center">
                              <select
                                value={user.role}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className="p-1 border rounded"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="BASIC_USER">USER</option>
                              </select>
                            </td>
                            <td className="p-1 text-center">
                              <select
                                value={user.status}
                                onChange={(e) =>
                                  handleStatusChange(user.id, e.target.value)
                                }
                                className="p-1 border rounded"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="DELETED">Deleted</option>
                                <option value="PENDING">Pending</option>
                              </select>
                            </td>
                            <td className="p-1 text-center hidden lg:table-cell text-slate-950">
                              <span className="bg-blue-200 px-1 rounded">
                                {
                                  dateTimeFormatter(user.createdAt).split(
                                    " - "
                                  )[0]
                                }
                              </span>{" "}
                              -{" "}
                              <span className="bg-green-200 px-1 rounded">
                                {
                                  dateTimeFormatter(user.createdAt).split(
                                    " - "
                                  )[1]
                                }
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={adminPage}
                    totalPages={adminTotalPages}
                    onPageChange={setAdminPage}
                  />
                </>
              )}
            </>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              {loadingUsers ? (
                <div className="flex justify-center items-center">
                  <ScaleLoader
                    color="oklch(0.5 0.134 242.749)"
                    loading={loadingUsers}
                    size={150}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <label className="mr-2 font-semibold text-white">
                      Status:
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setBasicPage(1);
                      }}
                      className="border p-1 rounded"
                    >
                      <option value="ALL">All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DELETED">Deleted</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border">
                      <thead>
                        <tr className="bg-stone-700 text-white">
                          <th className="p-2 text-center hidden lg:table-cell">
                            Name
                          </th>
                          <th className="p-2 text-center">Email</th>
                          <th className="p-2 text-center">Role</th>
                          <th className="p-2 text-center">Action</th>
                          <th className="p-2 text-center hidden lg:table-cell">
                            Created at <br />
                            <span className="text-sm font-thin ">
                              DD:MM:YYYY-HH:MM:SS
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {basicUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b odd:bg-white even:bg-gray-200"
                          >
                            <td className="p-1 text-center hidden lg:table-cell text-slate-950">
                              {user.name}
                            </td>
                            <td className="p-1 text-center text-slate-950">
                              {user.email}
                            </td>
                            <td className="p-1 text-center">
                              <select
                                value={user.role}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className="p-1 border rounded"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="BASIC_USER">USER</option>
                              </select>
                            </td>
                            <td className="p-1 text-center">
                              <select
                                value={user.status}
                                onChange={(e) =>
                                  handleStatusChange(user.id, e.target.value)
                                }
                                className="p-1 border rounded"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="DELETED">Deleted</option>
                                <option value="PENDING">Pending</option>
                              </select>
                            </td>
                            <td className="p-1 text-center hidden lg:table-cell text-slate-950">
                              <span className="bg-blue-200 px-1 rounded">
                                {
                                  dateTimeFormatter(user.createdAt).split(
                                    " - "
                                  )[0]
                                }
                              </span>{" "}
                              -{" "}
                              <span className="bg-green-200 px-1 rounded">
                                {
                                  dateTimeFormatter(user.createdAt).split(
                                    " - "
                                  )[1]
                                }
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={basicPage}
                    totalPages={basicTotalPages}
                    onPageChange={setBasicPage}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </Container>
  );
};

export default UpdateUserStatus;
