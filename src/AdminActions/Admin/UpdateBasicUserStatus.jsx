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
import UserProfileModal from "../SuperAdmin/UserProfileModal";

const UpdateBasicUserStatus = () => {
  const {
    isAdmin,
    isLoggedIn: userLoggedIn,
    isSuperAdmin,
    userId,
    userRole,
  } = useAuth();
  const [basicUsers, setBasicUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileCache, setProfileCache] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const navigate = useNavigate();
  const canManageBasicUsers =
    userLoggedIn && userId && (isAdmin || isSuperAdmin);

  const fetchUsers = async (nextPage, status, limit = 50, query = "") => {
    try {
      setLoading(true);
      setError(null);

      const statusParam = status === "ALL" ? "" : `&status=${status}`;
      const searchParam = query.trim()
        ? `&searchTerm=${encodeURIComponent(query.trim())}`
        : "";
      const response = await api.get(
        `/user?page=${nextPage}&limit=${limit}&role=BASIC_USER${statusParam}${searchParam}`,
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        setBasicUsers(response.data.data);

        const total = response.data.meta.total || 0;
        const limitUsed = response.data.meta.limit || limit;
        setTotalPages(Math.max(1, Math.ceil(total / limitUsed)));
      } else {
        setError("Failed to fetch users");
      }
    } catch (requestError) {
      console.error(
        "Fetching error:",
        requestError.response || requestError.message || requestError,
      );
      setError("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers(page, selectedStatus, 50, searchTerm);
    }
  }, [page, selectedStatus, userRole, searchTerm]);

  const refreshUsers = async () => {
    await fetchUsers(page, selectedStatus, 50, searchTerm);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setPage(1);
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

    if (refreshedUser.role === "super_admin") {
      await Swal.fire({
        icon: "info",
        title: `You are promoted to ${formatRoleLabel(refreshedUser.role)}`,
        text: "Redirecting you to the super admin management page.",
      });
      navigate("/dashboard/update-user-status", { replace: true });
      return true;
    }

    if (refreshedUser.role !== "admin") {
      await Swal.fire({
        icon: "info",
        title: `You are demoted to ${formatRoleLabel(refreshedUser.role)}`,
        text: "Your admin access was removed. Please sign in again.",
      });
      await removeUser();
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  };

  const handleStatusChange = (targetUserId, newStatus) => {
    Swal.fire({
      text: `Change the status to ${formatStatusLabel(newStatus)}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .patch(`/user/update-basicUser-status/${targetUserId}`, {
            status: newStatus,
            performedById: userId,
          })
          .then(async (response) => {
            if (response.data.success) {
              setSelectedProfile((prev) =>
                prev?.id === targetUserId
                  ? { ...prev, status: newStatus }
                  : prev,
              );
              setProfileCache((prev) =>
                prev[targetUserId]
                  ? {
                      ...prev,
                      [targetUserId]: {
                        ...prev[targetUserId],
                        status: newStatus,
                      },
                    }
                  : prev,
              );

              await refreshUsers();

              Swal.fire({
                title: "Success",
                text: `User status updated to ${formatStatusLabel(newStatus)}.`,
                icon: "success",
                timer: 1000,
                showConfirmButton: false,
              });

              await handleSelfSessionRefresh(targetUserId);
            } else {
              Swal.fire("Failed", "Failed to update user status", "error");
            }
          })
          .catch((requestError) => {
            console.log("Error Response:", requestError.response);
            Swal.fire("Error", "Failed to update user status", "error");
          });
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

  //   const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  //   const handleNextPage = () =>
  //     setPage((prev) => Math.min(prev + 1, totalPages));

  if (!canManageBasicUsers) {
    return <Navigate to="/" replace />;
  }

  if (error) return <div>{error}</div>;

  return (
    <Container>
      {userRole === "admin" && (
        <div className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <UserManagementSummary
              badge="Admin Console"
              title="Basic user status management"
              currentFilterLabel={
                selectedStatus === "ALL"
                  ? "All user statuses"
                  : `${formatStatusLabel(selectedStatus)} users`
              }
              cards={[
                {
                  label: "Basic User Accounts",
                  value: basicUsers.length,
                  borderClass: "border-emerald-200",
                  labelClass: "text-emerald-700",
                },
                {
                  label: "Status View",
                  value:
                    selectedStatus === "ALL"
                      ? "All"
                      : formatStatusLabel(selectedStatus),
                  borderClass: "border-amber-200",
                  labelClass: "text-amber-700",
                },
                {
                  label: "Search Query",
                  value: searchTerm.trim() || "None",
                  borderClass: "border-cyan-200",
                  labelClass: "text-cyan-700",
                },
              ]}
            />

            <UserManagementSearchPanel
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onClear={clearSearch}
            />

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                <ScaleLoader color="#155e75" loading={loading} size={150} />
              </div>
            ) : (
              <UserManagementTable
                users={basicUsers}
                page={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
                onOpenProfile={openProfileModal}
                onStatusChange={handleStatusChange}
                selectedStatus={selectedStatus}
                onSelectedStatusChange={(nextStatus) => {
                  setSelectedStatus(nextStatus);
                  setPage(1);
                }}
                filterId="admin-status-filter"
                showFilter
                fallbackRoleLabel="BASIC_USER"
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

export default UpdateBasicUserStatus;
