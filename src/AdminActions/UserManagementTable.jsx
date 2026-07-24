import Pagination from "./AdminPaginationForUsers";
import { dateTimeFormatter } from "../utils/formatDateTime";
import {
  createInitials,
  formatRoleLabel,
  formatStatusLabel,
} from "./userManagementDisplay";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { getAvatarUrl } from "../utils/avatar";

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

const UserManagementTable = ({
  users,
  page,
  totalPages,
  onPageChange,
  onOpenProfile,
  onStatusChange,
  selectedStatus,
  onSelectedStatusChange,
  filterId = "user-status-filter",
  showFilter = false,
  showRoleSelect = false,
  roleOptions = ["ADMIN", "BASIC_USER"],
  fallbackRoleLabel = "USER",
  onRoleChange,
  showPermanentDelete = false,
  onPermanentDelete,
  emptyStateText = "No users found for the current selection.",
}) => {
  const { settings: profileSettings } = useProfileSettings();

  const statusFilterMarkup = showFilter ? (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-8 py-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Filter
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-950">User status</h3>
      </div>
      <div className="flex items-center gap-3">
        <label
          htmlFor={filterId}
          className="text-sm font-semibold text-slate-700"
        >
          Status:
        </label>
        <select
          id={filterId}
          value={selectedStatus}
          onChange={(event) => onSelectedStatusChange?.(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="DELETED">Deactivated</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {statusFilterMarkup}

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
                {showPermanentDelete && (
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Permanent
                  </th>
                )}
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(odd)]:bg-gray-200 [&>tr:nth-child(even)]:bg-white">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={showPermanentDelete ? 7 : 6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    {emptyStateText}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const formattedDateTime = dateTimeFormatter(
                    user.createdAt,
                  ).split(" - ");
                  const resolvedRole = user.role || fallbackRoleLabel;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-400 bg-slate-700 text-xs font-bold text-white">
                            {getAvatarUrl(user, profileSettings) ? (
                              <img
                                src={getAvatarUrl(user, profileSettings)}
                                alt={user.name || user.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>
                                {createInitials(user.name, user.email)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <p className="whitespace-normal break-words text-xs font-semibold leading-5 text-slate-950">
                              {user.name || "No name"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-1 text-xs text-slate-700">
                        <div className="max-w-[260px] whitespace-normal break-all leading-5">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-3 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenProfile(user)}
                          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800"
                        >
                          Profile
                        </button>
                      </td>
                      <td className="px-3 py-1 text-center">
                        {showRoleSelect ? (
                          <select
                            value={resolvedRole}
                            onChange={(event) =>
                              onRoleChange?.(user, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                          >
                            {roleOptions.map((roleOption) => (
                              <option key={roleOption} value={roleOption}>
                                {roleOption === "BASIC_USER"
                                  ? "USER"
                                  : roleOption}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                            {formatRoleLabel(resolvedRole)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-center">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex w-24 justify-center rounded-lg border px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClass(
                              user.status,
                            )}`}
                          >
                            {formatStatusLabel(user.status)}
                          </span>
                          <select
                            value={user.status}
                            onChange={(event) =>
                              onStatusChange(user.id, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DELETED">Deactivated</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </div>
                      </td>
                      {showPermanentDelete && (
                        <td className="px-3 py-1 mt-2 text-center">
                          <button
                            type="button"
                            onClick={() => onPermanentDelete?.(user)}
                            disabled={
                              String(user.status || "").toUpperCase() !==
                              "DELETED"
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            title={
                              String(user.status || "").toUpperCase() ===
                              "DELETED"
                                ? "Permanently delete user account"
                                : "Set the status to Deactivated first to enable permanent delete"
                            }
                          >
                            Delete
                          </button>
                        </td>
                      )}
                      <td className="px-3 py-1 text-center text-xs text-slate-700">
                        <div className="flex items-center gap-1 leading-tight">
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
};

export default UserManagementTable;
