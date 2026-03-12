import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ScaleLoader } from "react-spinners";
import api from "../../axios";
import Container from "../../utils/Container";
import { dateTimeFormatter } from "../../utils/formatDateTime";
import {
  removeUser,
  syncCurrentUser,
  useAuth,
} from "../../services/auth.services";
import Pagination from "../AdminPaginationForUsers";
import UserProfileModal from "./UserProfileModal";

const formatRoleLabel = (role) => {
  if (!role) {
    return "User";
  }

  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const createInitials = (name, email) => {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const getStatusBadgeClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BLOCKED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "DELETED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
};

const getTabButtonClass = (isActive) =>
  `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
      : "bg-gray-400 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

const getSummaryCardClass = (tone) => {
  switch (tone) {
    case "admin":
      return "border-cyan-200 ";
    case "user":
      return "border-emerald-200 ";
    default:
      return "border-amber-200";
  }
};

const UpdateUserStatus = () => {
  const { userInfo: authUserInfo, isLoggedIn: userLoggedIn } = useAuth();
  const userInfo = authUserInfo || {};
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [basicUsers, setBasicUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [adminTotalCount, setAdminTotalCount] = useState(0);
  const [basicUserTotalCount, setBasicUserTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [adminPage, setAdminPage] = useState(1);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [basicPage, setBasicPage] = useState(1);
  const [basicTotalPages, setBasicTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [profileCache, setProfileCache] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const canManageUsers =
    userLoggedIn && userInfo.id && userInfo.role === "super_admin";

  const fetchAdmins = async (page = 1, limit = 50, query = "") => {
    try {
      setLoadingAdmins(true);
      setError(null);

      const searchParam = query.trim()
        ? `&searchTerm=${encodeURIComponent(query.trim())}`
        : "";
      const response = await api.get(
        `/user?page=${page}&limit=${limit}&role=ADMIN${searchParam}`,
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit;

        setAdmins(response.data.data);
        setAdminTotalCount(total);
        setAdminTotalPages(Math.max(1, Math.ceil(total / limitUsed)));
      } else {
        setError("Failed to fetch admins");
      }
    } catch (requestError) {
      console.error(requestError);
      setError("Error fetching admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchBasicUsers = async (
    page = 1,
    status = "ALL",
    limit = 50,
    query = "",
  ) => {
    try {
      setLoadingUsers(true);
      setError(null);

      const statusParam = status === "ALL" ? "" : `&status=${status}`;
      const searchParam = query.trim()
        ? `&searchTerm=${encodeURIComponent(query.trim())}`
        : "";
      const response = await api.get(
        `/user?page=${page}&limit=${limit}&role=BASIC_USER${statusParam}${searchParam}`,
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit;

        setBasicUsers(response.data.data);
        setBasicUserTotalCount(total);
        setBasicTotalPages(Math.max(1, Math.ceil(total / limitUsed)));
      } else {
        setError("Failed to fetch users");
      }
    } catch (requestError) {
      console.error(requestError);
      setError("Error fetching users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userInfo?.role === "super_admin") {
      fetchAdmins(adminPage, 50, searchTerm);
      fetchBasicUsers(basicPage, selectedStatus, 50, searchTerm);
    }
  }, [adminPage, basicPage, selectedStatus, userInfo?.role, searchTerm]);

  const refreshLists = async () => {
    await Promise.all([
      fetchAdmins(adminPage, 50, searchTerm),
      fetchBasicUsers(basicPage, selectedStatus, 50, searchTerm),
    ]);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setAdminPage(1);
    setBasicPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setAdminPage(1);
    setBasicPage(1);
  };

  const handleSelfSessionRefresh = async (affectedUserId) => {
    if (affectedUserId !== userInfo.id) {
      return false;
    }

    const refreshedUser = await syncCurrentUser({ preserveOnFailure: false });

    if (!refreshedUser) {
      await Swal.fire({
        icon: "info",
        title: "Session updated",
        text: "Your permissions changed. Please sign in again.",
      });
      await removeUser();
      navigate("/login", { replace: true });
      return true;
    }

    if (refreshedUser.role === "admin") {
      await Swal.fire({
        icon: "info",
        title: `You are promoted to ${formatRoleLabel(refreshedUser.role)}`,
        text: "Redirecting you to the admin management page.",
      });
      navigate("/dashboard/update-basic-user-status", { replace: true });
      return true;
    }

    if (refreshedUser.role !== "super_admin") {
      await Swal.fire({
        icon: "info",
        title: `You are demoted to ${formatRoleLabel(refreshedUser.role)}`,
        text: "Your higher-level admin access was removed. Please sign in again.",
      });
      await removeUser();
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  };

  const handleStatusChange = (userId, newStatus) => {
    Swal.fire({
      text: `Change the status to ${newStatus}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-status/${userId}`, {
            status: newStatus,
            performedById: userInfo.id,
          })
          .then(async (response) => {
            if (response.data.success) {
              setSelectedProfile((prev) =>
                prev?.id === userId ? { ...prev, status: newStatus } : prev,
              );
              setProfileCache((prev) =>
                prev[userId]
                  ? {
                      ...prev,
                      [userId]: { ...prev[userId], status: newStatus },
                    }
                  : prev,
              );

              await refreshLists();

              Swal.fire({
                title: "Success",
                text: "User status updated successfully!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });

              await handleSelfSessionRefresh(userId);
            } else {
              Swal.fire("Failed", "Failed to update status", "error");
            }
          })
          .catch(() => Swal.fire("Error", "Failed to update status", "error"));
      }
    });
  };

  const handlePermanentDelete = (userId, userName, userEmail) => {
    Swal.fire({
      title: "Permanent Delete Warning",
      html: `
        <p class="text-lg mb-2">Are you sure you want to <strong class="text-red-600">permanently delete</strong> this user?</p>
        <p class="text-red-600 font-bold mb-3">This action CANNOT be undone!</p>
        <p class="mb-2"><strong>Name:</strong> ${userName}</p>
        <p class="mb-4"><strong>Email:</strong> ${userEmail}</p>
        <p class="text-sm font-semibold mb-2">Type the user's email to confirm:</p>
      `,
      input: "text",
      inputPlaceholder: "Enter user email",
      inputAttributes: {
        autocomplete: "off",
      },
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete Permanently",
      cancelButtonText: "Cancel",
      focusCancel: true,
      preConfirm: (inputValue) => {
        if (!inputValue) {
          Swal.showValidationMessage("Email is required");
          return false;
        }

        if (inputValue.trim() !== userEmail) {
          Swal.showValidationMessage("Email does not match");
          return false;
        }

        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/user/permanent-delete/${userId}`)
          .then(async (response) => {
            if (response.data.success) {
              await refreshLists();

              setProfileCache((prev) => {
                const nextCache = { ...prev };
                delete nextCache[userId];
                return nextCache;
              });

              if (selectedProfile?.id === userId) {
                setSelectedProfile(null);
                setIsProfileModalOpen(false);
              }

              Swal.fire({
                title: "Deleted!",
                text: "User has been permanently deleted from the database.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
            } else {
              Swal.fire("Failed", "Failed to delete user", "error");
            }
          })
          .catch((requestError) => {
            console.error(requestError);
            Swal.fire(
              "Error",
              requestError.response?.data?.message || "Failed to delete user",
              "error",
            );
          });
      }
    });
  };

  const handleRoleChange = (userId, newRole) => {
    const newAssignedRole = newRole === "BASIC_USER" ? "Basic User" : "Admin";

    Swal.fire({
      text: `Change the role to ${newAssignedRole}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-role/${userId}`, {
            role: newRole,
            performedById: userInfo.id,
          })
          .then(async (response) => {
            if (response.data.success) {
              setSelectedProfile((prev) =>
                prev?.id === userId ? { ...prev, role: newRole } : prev,
              );
              setProfileCache((prev) =>
                prev[userId]
                  ? { ...prev, [userId]: { ...prev[userId], role: newRole } }
                  : prev,
              );

              await refreshLists();

              Swal.fire({
                title: "Success",
                text: "User role updated successfully!",
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });

              await handleSelfSessionRefresh(userId);
            } else {
              Swal.fire("Failed", "Failed to update role", "error");
            }
          })
          .catch(() => Swal.fire("Error", "Failed to update role", "error"));
      }
    });
  };

  const openProfileModal = async (user) => {
    const cachedProfile = profileCache[user.id];

    setIsProfileModalOpen(true);
    setSelectedProfile(
      cachedProfile ? { ...user, ...cachedProfile } : { ...user },
    );

    if (cachedProfile) {
      setIsProfileLoading(false);
      return;
    }

    try {
      setIsProfileLoading(true);
      const response = await api.get(`/user/${user.id}`);
      const nextProfile = {
        ...user,
        ...(response?.data?.data || {}),
      };

      setSelectedProfile(nextProfile);
      setProfileCache((prev) => ({
        ...prev,
        [user.id]: nextProfile,
      }));
    } catch (requestError) {
      console.error(requestError);
      Swal.fire({
        icon: "error",
        title: "Could not load profile",
        text:
          requestError?.response?.data?.message ||
          "The user profile could not be loaded right now.",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedProfile(null);
    setIsProfileLoading(false);
  };

  if (!canManageUsers) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <Container>
        <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-center text-rose-700 shadow-lg shadow-rose-100/50">
            {error}
          </div>
        </div>
      </Container>
    );
  }

  const renderTable = ({
    users,
    showRoleSelect = false,
    roleLabel = "USER",
    page,
    totalPages,
    onPageChange,
    isUsersTab = false,
  }) => (
    <div className="space-y-4">
      {isUsersTab && (
        <div className="flex flex-col gap-3  border border-slate-200 bg-slate-50 py-2 md:flex-row md:items-center md:justify-between px-8 rounded-lg">
          <div className="">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Filter
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-950 ">
              User status
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value);
                setBasicPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DELETED">Deleted</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                  User
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Email
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Profile
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Role
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Delete
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(odd)]:bg-gray-200 [&>tr:nth-child(even)]:bg-white">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No users found for the current selection.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const formattedDateTime = dateTimeFormatter(
                    user.createdAt,
                  ).split(" - ");

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md mr-2 border border-slate-400 bg-slate-700 text-xs font-bold text-white">
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt={user.name || user.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>
                                {createInitials(user.name, user.email)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <p className="whitespace-normal break-words text-sm font-semibold leading-5 text-slate-950">
                              {user.name || "No name"}
                            </p>
                            {/* <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              {formatRoleLabel(user.role || roleLabel)}
                            </p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-1  text-sm text-slate-700">
                        <div className="max-w-[260px] whitespace-normal break-all leading-5">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-3 py-1  text-center">
                        <button
                          type="button"
                          onClick={() => openProfileModal(user)}
                          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800"
                        >
                          Profile
                        </button>
                      </td>
                      <td className="px-3 py-1 text-center">
                        {showRoleSelect ? (
                          <select
                            value={user.role}
                            onChange={(event) =>
                              handleRoleChange(user.id, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="BASIC_USER">USER</option>
                          </select>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                            {formatRoleLabel(roleLabel)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1  text-center">
                        <div className="flex  items-center gap-1">
                          <span
                            className={`inline-flex rounded-lg w-20 text-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClass(
                              user.status,
                            )}`}
                          >
                            {String(user.status || "Unknown").toLowerCase()}
                          </span>
                          <select
                            value={user.status}
                            onChange={(event) =>
                              handleStatusChange(user.id, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1  text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DELETED">Deleted</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-1 mt-2  text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handlePermanentDelete(
                              user.id,
                              user.name,
                              user.email,
                            )
                          }
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1  text-[11px] font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
                          title="Permanently delete user"
                        >
                          Permanent
                        </button>
                      </td>
                      <td className="px-3 py-1   text-center text-xs text-slate-700">
                        <div className="flex  items-center gap-1 leading-tight">
                          <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            {formattedDateTime[0]}
                          </span>
                          <span>-</span>
                          <span className="rounded-lg bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                            {formattedDateTime[1]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );

  return (
    <Container>
      {userInfo?.role === "super_admin" && (
        <div className="min-h-screen   px-4 py-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              <div className="border-b border-slate-200 bg-slate-900 px-6 py-6 text-white md:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                  Super Admin Console
                </p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold md:text-3xl">
                      User access and profile management
                    </h1>
                  </div>
                  <div className=" border border-white/10 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                      Current Filter
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-white">
                      {selectedStatus === "ALL"
                        ? "All user statuses"
                        : `${formatRoleLabel(selectedStatus.toLowerCase())} users`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 px-6 py-5 md:grid-cols-3 md:px-8">
                <div
                  className={`rounded-[24px] border p-5 ${getSummaryCardClass("admin")}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-900">
                    Admin Accounts
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {adminTotalCount}
                  </p>
                </div>
                <div
                  className={`rounded-[24px] border p-5 ${getSummaryCardClass("user")}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Basic User Accounts
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {basicUserTotalCount}
                  </p>
                </div>
                <div
                  className={`rounded-[24px] border p-5 ${getSummaryCardClass("filter")}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Status View
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {selectedStatus === "ALL"
                      ? "All"
                      : formatRoleLabel(selectedStatus.toLowerCase())}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 md:p-5">
              <div className="flex flex-col gap-4 px-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Switch View
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {activeTab === "admins"
                      ? "Admin accounts"
                      : "User accounts"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 rounded-full bg-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("admins")}
                    className={getTabButtonClass(activeTab === "admins")}
                  >
                    Admins ({adminTotalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={getTabButtonClass(activeTab === "users")}
                  >
                    Users ({basicUserTotalCount})
                  </button>
                </div>
              </div>

              <div className="mt-4 px-4">
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Search Users
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Find by user name, email, or ID.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search by name, email, or ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    />
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {activeTab === "admins" ? (
              loadingAdmins ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                  <ScaleLoader
                    color="#155e75"
                    loading={loadingAdmins}
                    size={150}
                  />
                </div>
              ) : (
                renderTable({
                  users: admins,
                  showRoleSelect: true,
                  roleLabel: "ADMIN",
                  page: adminPage,
                  totalPages: adminTotalPages,
                  onPageChange: setAdminPage,
                })
              )
            ) : loadingUsers ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                <ScaleLoader
                  color="#155e75"
                  loading={loadingUsers}
                  size={150}
                />
              </div>
            ) : (
              renderTable({
                users: basicUsers,
                roleLabel: "BASIC_USER",
                page: basicPage,
                totalPages: basicTotalPages,
                onPageChange: setBasicPage,
                isUsersTab: true,
              })
            )}
          </div>

          <UserProfileModal
            isOpen={isProfileModalOpen}
            user={selectedProfile}
            isLoading={isProfileLoading}
            onClose={closeProfileModal}
          />
        </div>
      )}
    </Container>
  );
};

export default UpdateUserStatus;
