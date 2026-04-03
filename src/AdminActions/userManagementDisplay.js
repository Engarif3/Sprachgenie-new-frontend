export const createInitials = (name, email) => {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export const formatRoleLabel = (role) => {
  if (!role) {
    return "User";
  }

  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const formatStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "DELETED") {
    return "Deactivated";
  }

  if (!normalizedStatus) {
    return "Unknown";
  }

  return normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase();
};
