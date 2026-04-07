import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ScaleLoader } from "react-spinners";
import api from "../../axios";
import Container from "../../utils/Container";
import {
  removeUser,
  syncCurrentUser,
  useAuth,
} from "../../services/auth.services";
import UserManagementSearchPanel from "../UserManagementSearchPanel";
import UserManagementSummary from "../UserManagementSummary";
import UserManagementTable from "../UserManagementTable";
import { formatRoleLabel, formatStatusLabel } from "../userManagementDisplay";
import UserProfileModal from "./UserProfileModal";

const getTabButtonClass = (isActive) =>
  `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
      : "bg-gray-400 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

const UpdateUserStatus = () => {
  const {
    isLoggedIn: userLoggedIn,
    isSuperAdmin,
    userId,
    userRole,
  } = useAuth();
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

  const canManageUsers = userLoggedIn && userId && isSuperAdmin;

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
    if (userRole === "super_admin") {
      fetchAdmins(adminPage, 50, searchTerm);
      fetchBasicUsers(basicPage, selectedStatus, 50, searchTerm);
    }
  }, [adminPage, basicPage, selectedStatus, userRole, searchTerm]);

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
    if (affectedUserId !== userId) {
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
      text: `Change the status to ${formatStatusLabel(newStatus)}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-status/${userId}`, {
            status: newStatus,
            performedById: userId,
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
                text: `User status updated to ${formatStatusLabel(newStatus)}.`,
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

  const handlePermanentDeleteUser = (user) => {
    if (String(user.status || "").toUpperCase() !== "DELETED") {
      Swal.fire({
        icon: "info",
        title: "Deactivate First",
        text: "Deactivate the user first. Permanent delete is only available for already deactivated accounts.",
      });
      return;
    }

    Swal.fire({
      title: "Permanent Delete",
      html: `
        <p class="text-lg mb-2">This will <strong class="text-red-600">permanently delete</strong> the account.</p>
        <p class="text-red-600 font-bold mb-3">This cannot be undone and the email can be used to register again.</p>
        <p class="mb-2"><strong>Name:</strong> ${user.name}</p>
        <p class="mb-2"><strong>Email:</strong> ${user.email}</p>
        <p class="text-sm font-semibold mb-2">Type the user's email to confirm:</p>
      `,
      input: "text",
      inputPlaceholder: "Enter user email",
      inputAttributes: {
        autocomplete: "off",
      },
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete Permanently",
      cancelButtonText: "Cancel",
      focusCancel: true,
      preConfirm: (inputValue) => {
        if (!String(inputValue || "").trim()) {
          Swal.showValidationMessage("Email is required");
          return false;
        }

        if (String(inputValue || "").trim() !== user.email) {
          Swal.showValidationMessage("Email does not match");
          return false;
        }

        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/user/permanent-delete/${user.id}`)
          .then(async (response) => {
            if (response.data.success) {
              const preservedHistory = Boolean(
                response.data?.data?.preservedHistory,
              );

              setProfileCache((prev) => {
                const nextCache = { ...prev };
                delete nextCache[user.id];
                return nextCache;
              });

              if (selectedProfile?.id === user.id) {
                setSelectedProfile(null);
                setIsProfileModalOpen(false);
              }

              await refreshLists();

              Swal.fire({
                title: "Deleted Permanently",
                text: preservedHistory
                  ? "The account was archived for history preservation. The email can be used to register again."
                  : "The account was removed from the database and the email can be used again.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
            } else {
              Swal.fire("Failed", "Failed to permanently delete user", "error");
            }
          })
          .catch((requestError) => {
            console.error(requestError);
            Swal.fire(
              "Error",
              requestError.response?.data?.message ||
                "Failed to permanently delete user",
              "error",
            );
          });
      }
    });
  };

  const handleRoleChange = (user, newRole) => {
    const targetUserId = user?.id;
    const userEmail = String(user?.email || "").trim();
    const newAssignedRole = newRole === "BASIC_USER" ? "Basic User" : "Admin";

    Swal.fire({
      title: `Change role to ${newAssignedRole}?`,
      text: `Type ${userEmail} to confirm this role change.`,
      input: "text",
      inputPlaceholder: "Enter the user's email",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
      },
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      preConfirm: (value) => {
        const confirmedEmail = String(value || "")
          .trim()
          .toLowerCase();

        if (!confirmedEmail) {
          Swal.showValidationMessage("Enter the user's email to confirm.");
          return false;
        }

        if (confirmedEmail !== userEmail.toLowerCase()) {
          Swal.showValidationMessage(
            "The entered email does not match the selected user.",
          );
          return false;
        }

        return value.trim();
      },
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-role/${targetUserId}`, {
            role: newRole,
            performedById: userId,
            confirmEmail: result.value,
          })
          .then(async (response) => {
            if (response.data.success) {
              setSelectedProfile((prev) =>
                prev?.id === targetUserId ? { ...prev, role: newRole } : prev,
              );
              setProfileCache((prev) =>
                prev[targetUserId]
                  ? {
                      ...prev,
                      [targetUserId]: {
                        ...prev[targetUserId],
                        role: newRole,
                      },
                    }
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

              await handleSelfSessionRefresh(targetUserId);
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

  return (
    <Container>
      {isSuperAdmin && (
        <div className="min-h-screen   px-4 py-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <UserManagementSummary
              badge="Super Admin Console"
              title="User access and profile management"
              currentFilterLabel={
                selectedStatus === "ALL"
                  ? "All user statuses"
                  : `${formatRoleLabel(selectedStatus.toLowerCase())} users`
              }
              cards={[
                {
                  label: "Admin Accounts",
                  value: adminTotalCount,
                  borderClass: "border-cyan-200",
                  labelClass: "text-cyan-900",
                },
                {
                  label: "Basic User Accounts",
                  value: basicUserTotalCount,
                  borderClass: "border-emerald-200",
                  labelClass: "text-emerald-700",
                },
                {
                  label: "Status View",
                  value:
                    selectedStatus === "ALL"
                      ? "All"
                      : formatRoleLabel(selectedStatus.toLowerCase()),
                  borderClass: "border-amber-200",
                  labelClass: "text-amber-700",
                },
              ]}
            />

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
                <UserManagementSearchPanel
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  onClear={clearSearch}
                />
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
                <UserManagementTable
                  users={admins}
                  page={adminPage}
                  totalPages={adminTotalPages}
                  onPageChange={setAdminPage}
                  onOpenProfile={openProfileModal}
                  onStatusChange={handleStatusChange}
                  showRoleSelect
                  roleOptions={["ADMIN", "BASIC_USER"]}
                  fallbackRoleLabel="ADMIN"
                  onRoleChange={handleRoleChange}
                  showPermanentDelete
                  onPermanentDelete={handlePermanentDeleteUser}
                />
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
              <UserManagementTable
                users={basicUsers}
                page={basicPage}
                totalPages={basicTotalPages}
                onPageChange={setBasicPage}
                onOpenProfile={openProfileModal}
                onStatusChange={handleStatusChange}
                selectedStatus={selectedStatus}
                onSelectedStatusChange={(nextStatus) => {
                  setSelectedStatus(nextStatus);
                  setBasicPage(1);
                }}
                filterId="super-admin-status-filter"
                showFilter
                showRoleSelect
                roleOptions={["ADMIN", "BASIC_USER"]}
                fallbackRoleLabel="BASIC_USER"
                onRoleChange={handleRoleChange}
                showPermanentDelete
                onPermanentDelete={handlePermanentDeleteUser}
              />
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
