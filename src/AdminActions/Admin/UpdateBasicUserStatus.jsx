import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import Container from "../../utils/Container";
import { getUserInfo, isLoggedIn } from "../../services/auth.services";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
import { ScaleLoader } from "react-spinners";
import { dateTimeFormatter } from "../../utils/formatDateTime";
import Pagination from "../AdminPaginationForUsers";

const UpdateBasicUserStatus = () => {
  const userLoggedIn = isLoggedIn();
  const userInfo = getUserInfo() || {};

  // Security check: Only allow admin/super_admin users
  if (
    !userLoggedIn ||
    !userInfo.id ||
    (userInfo.role !== "admin" && userInfo.role !== "super_admin")
  ) {
    return <Navigate to="/" replace />;
  }
  const [basicUsers, setBasicUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const fetchUsers = async (page, status, limit = 50) => {
    try {
      setLoading(true);

      const statusParam = status === "ALL" ? "" : `&status=${status}`;
      const response = await api.get(
        `/user?page=${page}&limit=${limit}&role=BASIC_USER${statusParam}`,
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        setBasicUsers(response.data.data);

        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit; // ensure we use backend's limit
        setTotalPages(Math.ceil(total / limitUsed));
      } else {
        setError("Invalid data format received.");
      }
    } catch (err) {
      console.error("Fetching error:", err.response || err.message || err);
      setError("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.role === "admin") {
      fetchUsers(page, selectedStatus);
    } else {
      navigate("/");
    }
  }, [page, selectedStatus]);

  const handleStatusChange = (userId, newStatus) => {
    Swal.fire({
      text: `Change the status to ${newStatus}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-basicUser-status/${userId}`, {
            status: newStatus,
            performedById: userInfo.id,
          })
          .then((response) => {
            if (response.data.success) {
              setBasicUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === userId ? { ...user, status: newStatus } : user,
                ),
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
          .catch((err) => {
            console.log("Error Response:", err.response);
            Swal.fire("Error", "Failed to update user status", "error");
          });
      }
    });
  };

  //   const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  //   const handleNextPage = () =>
  //     setPage((prev) => Math.min(prev + 1, totalPages));

  if (error) return <div>{error}</div>;

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "status status-success"; // green
      case "PENDING":
        return "status status-warning"; // yellow
      case "BLOCKED":
        return "status status-error"; // red
      case "DELETED":
        return "status status-neutral"; // gray
      default:
        return "status status-info"; // blue fallback
    }
  };

  return (
    <Container>
      {userInfo?.role === "admin" && (
        <div className="container mx-auto p-4 min-h-screen">
          <h2 className="text-2xl font-bold mb-4 text-center text-white py-2 bg-cyan-700 rounded">
            Update User Status -{" "}
            <span className="text-md text-orange-600">
              ({basicUsers.length})
            </span>
          </h2>

          {loading && (
            <div className="flex justify-center items-center">
              <ScaleLoader
                color="oklch(0.5 0.134 242.749)"
                loading={loading}
                size={150}
              />
            </div>
          )}

          {!loading && (
            <>
              {/* Status Filter Dropdown */}
              <div className="flex justify-end mb-4">
                <label className="mr-2 font-semibold text-white">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1); // reset page on filter change
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
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-stone-700 text-white">
                      <th className="p-2 hidden lg:table-cell text-center">
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
                        className={`border-b odd:bg-white even:bg-gray-200`}
                      >
                        <td className="p-1 hidden lg:table-cell text-center text-slate-950">
                          {user.name}
                        </td>
                        <td className="p-1 text-start md:text-center text-sm md:text-md text-slate-950">
                          {user.email}
                        </td>
                        <td className="p-1 text-center">USER</td>
                        <td className="p-1 text-center">
                          <select
                            value={user.status}
                            onChange={(e) =>
                              handleStatusChange(user.id, e.target.value)
                            }
                            className="p-1 border rounded"
                          >
                            {<option value="ACTIVE">Active</option>}
                            <option value="BLOCKED">Blocked</option>
                            <option value="DELETED">Deleted</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </td>
                        <td className="p-1 hidden lg:table-cell text-center text-slate-950">
                          <span className="bg-blue-200 px-1 rounded">
                            {dateTimeFormatter(user.createdAt).split(" - ")[0]}
                          </span>
                          {" - "}
                          <span className="bg-green-200 px-1 rounded">
                            {dateTimeFormatter(user.createdAt).split(" - ")[1]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </>
          )}
        </div>
      )}
    </Container>
  );
};

export default UpdateBasicUserStatus;
