import { useEffect } from "react";
import { dateTimeFormatter } from "../../utils/formatDateTime";

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

const statusBadgeClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "PENDING":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "BLOCKED":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "DELETED":
      return "border-slate-400/30 bg-slate-400/10 text-slate-100";
    default:
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

const UserProfileModal = ({ isOpen, user, isLoading, onClose }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const normalizedRole = String(user?.role || "").toLowerCase();
  const displayName = user?.name || user?.email || "User profile";
  const formattedCreatedAt = user?.createdAt
    ? dateTimeFormatter(user.createdAt)
    : "Not available";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/30"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User profile"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-7">
          <div>
            <h2 className="mt-1 text-xl font-bold text-slate-950 md:text-2xl">
              {displayName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close user profile"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-5 py-5 md:px-7 md:py-7">
          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
              <div className="min-h-[360px] animate-pulse rounded-[28px] bg-slate-900" />
              <div className="min-h-[360px] animate-pulse rounded-[28px] bg-slate-100" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
              <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-xl shadow-slate-950/30">
                <div className="h-28 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
                <div className="-mt-14 px-6 pb-6">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[26px] border-4 border-slate-950 bg-gradient-to-br from-slate-700 to-slate-900 text-2xl font-bold text-white shadow-xl">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{createInitials(user?.name, user?.email)}</span>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-2xl font-bold text-white">
                      {displayName}
                    </p>
                    <p className="text-sm text-slate-300">
                      {user?.email || "No email"}
                    </p>
                    <p className="text-xs  text-slate-400">
                      ID: {user?.id || "Not available"}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                        {formatRoleLabel(user?.role)}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusBadgeClass(
                          user?.status,
                        )}`}
                      >
                        {String(user?.status || "Unknown").toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Contact Number
                      </p>
                      <p className="mt-2 font-medium text-white">
                        {user?.contactNumber || "Not added yet"}
                      </p>
                    </div>
                    {normalizedRole === "basic_user" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Address
                        </p>
                        <p className="mt-2 font-medium text-white">
                          {user?.address || "Not added yet"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
                <div className="mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                    Profile Snapshot
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-950">
                    Account overview
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* <InfoCard
                    label="User ID"
                    value={user?.id || "Not available"}
                  /> */}
                  <InfoCard label="Full Name" value={displayName} />
                  <InfoCard
                    label="Email Address"
                    value={user?.email || "Not available"}
                  />
                  <InfoCard label="Role" value={formatRoleLabel(user?.role)} />
                  <InfoCard
                    label="Status"
                    value={formatRoleLabel(
                      String(user?.status || "Unknown").toLowerCase(),
                    )}
                  />
                  <InfoCard
                    label="Contact Number"
                    value={user?.contactNumber || "Not added yet"}
                  />
                  <InfoCard label="Created At" value={formattedCreatedAt} />
                  {normalizedRole === "basic_user" && (
                    <div className="md:col-span-2">
                      <InfoCard
                        label="Address"
                        value={user?.address || "Not added yet"}
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
