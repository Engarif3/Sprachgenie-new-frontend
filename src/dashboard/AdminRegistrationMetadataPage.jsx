import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../axios";
import { useAuth } from "../services/auth.services";

const GEOCODING_ENDPOINT = "https://nominatim.openstreetmap.org/search";

const buildQueryParams = (filters, page) => {
  const params = {
    page,
    limit: 20,
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      params[key] = value.trim();
    }
  });

  return params;
};

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const decodeDisplayValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.replace(/\+/g, " ").trim();

  if (!normalizedValue) {
    return "";
  }

  try {
    return decodeURIComponent(normalizedValue);
  } catch (_error) {
    return normalizedValue;
  }
};

const formatLocation = (record) => {
  const parts = [record.city, record.region, record.country]
    .map(decodeDisplayValue)
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
};

const buildLocationQuery = (record) => {
  const location = formatLocation(record);
  return location === "Unknown" ? "" : location;
};

const getLocationSourceLabel = (source) => {
  switch (source) {
    case "vercel-headers":
      return "Edge/provider IP metadata";
    case "cloudflare-headers":
      return "Cloudflare IP metadata";
    case "ipwhois-fallback":
      return "IP geolocation fallback";
    case "browser-geolocation":
      return "Browser geolocation";
    default:
      return source || "Unknown source";
  }
};

const formatRoleLabel = (role) => {
  if (!role) {
    return "User";
  }

  return String(role)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getStatusBadgeClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "PENDING":
      return "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200";
    case "BLOCKED":
      return "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200";
    case "DELETED":
      return "border-slate-300/60 bg-slate-100 text-slate-700 dark:border-slate-600/30 dark:bg-slate-800/80 dark:text-slate-200";
    default:
      return "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
  }
};

const formatAccuracy = (value) => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(1)} km`;
  }

  return `${Math.round(numericValue)} m`;
};

const getLocationSignal = (record) => {
  if (record?.source === "browser-geolocation") {
    return {
      label: "Precise browser geolocation",
      className:
        "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (getLocationCoordinates(record)) {
    return {
      label: "Coordinates from network location",
      className:
        "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    };
  }

  return {
    label: "Approximate network location",
    className:
      "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
  };
};

const getCoordinateValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getLocationCoordinates = (record) => {
  const latitude = getCoordinateValue(record?.latitude);
  const longitude = getCoordinateValue(record?.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
};

const getMapUrls = (coordinates) => {
  if (!coordinates) {
    return null;
  }

  const { latitude, longitude } = coordinates;
  const encodedCoordinates = encodeURIComponent(`${latitude},${longitude}`);

  return {
    embedUrl: `https://maps.google.com/maps?ll=${encodedCoordinates}&z=11&output=embed`,
    externalUrl: `https://www.google.com/maps/search/?api=1&query=${encodedCoordinates}`,
  };
};

const LocationMap = ({ mapUrls, coordinates, record }) => {
  if (!coordinates || !mapUrls?.embedUrl) {
    return null;
  }

  const { latitude, longitude } = coordinates;

  return (
    <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-950/60">
      <iframe
        key={`${latitude}-${longitude}`}
        title={
          record?.source === "browser-geolocation"
            ? "Precise signup location preview"
            : "Approximate signup location preview"
        }
        src={mapUrls.embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      >
        Map preview for {formatLocation(record)} at {latitude}, {longitude}
      </iframe>
    </div>
  );
};

const AdminRegistrationMetadataPage = () => {
  const { userInfo: authUserInfo } = useAuth();
  const userInfo = authUserInfo || {};
  const role = userInfo?.role;
  const canAccess = role === "admin" || role === "super_admin";

  const [filters, setFilters] = useState({
    searchTerm: "",
    email: "",
    countryCode: "",
    deviceType: "",
    source: "",
  });
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordLoading, setSelectedRecordLoading] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserProfileLoading, setSelectedUserProfileLoading] =
    useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [derivedCoordinates, setDerivedCoordinates] = useState(null);
  const [derivedCoordinatesLoading, setDerivedCoordinatesLoading] =
    useState(false);

  const fetchRecords = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/user/registration-metadata", {
        params: buildQueryParams(nextFilters, page),
      });

      setRecords(response.data?.data || []);
      setMeta(
        response.data?.meta || {
          page,
          limit: 20,
          total: 0,
        },
      );
    } catch (requestError) {
      console.error("Failed to load registration metadata:", requestError);
      setError("Unable to load registration metadata right now.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    fetchRecords(1, filters);
  }, []);

  useEffect(() => {
    const storedCoordinates = getLocationCoordinates(selectedRecord);

    if (!selectedRecord || storedCoordinates) {
      setDerivedCoordinates(null);
      setDerivedCoordinatesLoading(false);
      return undefined;
    }

    const locationQuery = buildLocationQuery(selectedRecord);

    if (!locationQuery) {
      setDerivedCoordinates(null);
      setDerivedCoordinatesLoading(false);
      return undefined;
    }

    const abortController = new AbortController();

    const geocodeLocation = async () => {
      setDerivedCoordinatesLoading(true);

      try {
        const response = await fetch(
          `${GEOCODING_ENDPOINT}?format=jsonv2&limit=1&q=${encodeURIComponent(locationQuery)}`,
          {
            signal: abortController.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Geocoding failed with status ${response.status}`);
        }

        const results = await response.json();
        const firstMatch = Array.isArray(results) ? results[0] : null;
        const latitude = getCoordinateValue(firstMatch?.lat);
        const longitude = getCoordinateValue(firstMatch?.lon);

        if (latitude === null || longitude === null) {
          setDerivedCoordinates(null);
          return;
        }

        setDerivedCoordinates({
          latitude,
          longitude,
          label: firstMatch?.display_name || locationQuery,
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error(
            "Failed to geocode registration location:",
            requestError,
          );
          setDerivedCoordinates(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setDerivedCoordinatesLoading(false);
        }
      }
    };

    geocodeLocation();

    return () => {
      abortController.abort();
    };
  }, [selectedRecord]);

  useEffect(() => {
    if (!isInspectionModalOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsInspectionModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isInspectionModalOpen]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await fetchRecords(1, filters);
  };

  const handleResetFilters = async () => {
    const nextFilters = {
      searchTerm: "",
      email: "",
      countryCode: "",
      deviceType: "",
      source: "",
    };

    setFilters(nextFilters);
    await fetchRecords(1, nextFilters);
  };

  const handleInspectRecord = async (userId) => {
    setIsInspectionModalOpen(true);
    setSelectedRecordLoading(true);
    setSelectedUserProfileLoading(true);
    setSelectedRecord(null);
    setSelectedUserProfile(null);

    try {
      const [metadataResponse, userResponse] = await Promise.allSettled([
        api.get(`/user/registration-metadata/${userId}`),
        api.get(`/user/${userId}`),
      ]);

      if (metadataResponse.status === "fulfilled") {
        setSelectedRecord(metadataResponse.value.data?.data || null);
      } else {
        throw metadataResponse.reason;
      }

      if (userResponse.status === "fulfilled") {
        setSelectedUserProfile(userResponse.value.data?.data || null);
      } else {
        console.error(
          "Failed to load user profile detail:",
          userResponse.reason,
        );
      }
    } catch (requestError) {
      console.error(
        "Failed to load registration metadata detail:",
        requestError,
      );
      Swal.fire({
        icon: "error",
        title: "Unable to load details",
        text: "Please try again in a moment.",
      });
    } finally {
      setSelectedRecordLoading(false);
      setSelectedUserProfileLoading(false);
    }
  };

  const handleCloseInspectionModal = () => {
    setIsInspectionModalOpen(false);
    setSelectedRecord(null);
    setSelectedUserProfile(null);
  };

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const totalPages = Math.max(
    Math.ceil((meta.total || 0) / (meta.limit || 20)),
    1,
  );
  const selectedRecordCoordinates = getLocationCoordinates(selectedRecord);
  const selectedRecordMapCoordinates =
    selectedRecordCoordinates || derivedCoordinates;
  const selectedRecordMap = getMapUrls(selectedRecordMapCoordinates);
  const isDerivedMapPreview =
    !selectedRecordCoordinates && Boolean(selectedRecordMapCoordinates);
  const locationSignal = getLocationSignal(selectedRecord);

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Security Monitoring
              </p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                Registration Metadata
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                Review signup device, browser, IP, and location signals used for
                abuse prevention and account security. Unless explicitly
                collected from browser geolocation, location data here should be
                treated as approximate and IP-derived.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Records
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {meta.total || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  IP Visibility
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {role === "super_admin" ? "Full IP view" : "Masked IP view"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Limited by role for safer access.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            This data is intended for fraud prevention, abuse investigation, and
            operational security. IP-based locations can be imprecise because
            VPNs, mobile networks, corporate gateways, and privacy tooling may
            shift the reported city or region. Avoid exporting or sharing it
            outside authorized admin workflows.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
          <form
            className="grid gap-4 lg:grid-cols-6"
            onSubmit={handleApplyFilters}
          >
            <label className="lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search
              </span>
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Email, browser, city, country"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </span>
              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="user@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Country
              </span>
              <input
                type="text"
                name="countryCode"
                value={filters.countryCode}
                onChange={handleFilterChange}
                placeholder="DE"
                maxLength={2}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Device
              </span>
              <select
                name="deviceType"
                value={filters.deviceType}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              >
                <option value="">All devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="bot">Bot</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Source
              </span>
              <input
                type="text"
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                placeholder="header, fallback"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
              />
            </label>

            <div className="flex items-end gap-3 lg:col-span-6">
              <button
                type="submit"
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-6">
          {loading ? (
            <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading registration metadata...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No registration metadata matched the current filters.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950/60"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {record.email}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {record.userId}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatLocation(record)}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {record.deviceType || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {record.browser || "Unknown browser"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {record.ipAddress || "Unknown"}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {getLocationSourceLabel(record.source)}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleInspectRecord(record.userId)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {records.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {record.email}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatLocation(record)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInspectRecord(record.userId)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Inspect
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Device:
                        </span>{" "}
                        {record.deviceType || "Unknown"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Browser:
                        </span>{" "}
                        {record.browser || "Unknown"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          IP:
                        </span>{" "}
                        <span className="font-mono text-xs">
                          {record.ipAddress || "Unknown"}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Registered:
                        </span>{" "}
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {meta.page || 1} of {totalPages}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={(meta.page || 1) <= 1 || loading}
                    onClick={() => fetchRecords((meta.page || 1) - 1, filters)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={(meta.page || 1) >= totalPages || loading}
                    onClick={() => fetchRecords((meta.page || 1) + 1, filters)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {isInspectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Inspection Details
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review the stored signup metadata for this account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseInspectionModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close inspection details"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto px-6 py-6">
                {selectedRecordLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    Loading details...
                  </div>
                ) : selectedRecord ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Account
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedRecord.email}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {selectedRecord.userId}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Account Status
                          </p>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Current account access state for this user.
                          </p>
                        </div>

                        {selectedUserProfileLoading ? (
                          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                            Loading status...
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Status
                          </p>
                          {selectedUserProfile?.status ? (
                            <span
                              className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(
                                selectedUserProfile.status,
                              )}`}
                            >
                              {String(selectedUserProfile.status).toLowerCase()}
                            </span>
                          ) : (
                            <p className="mt-2 text-sm text-slate-900 dark:text-white">
                              Unknown
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Role
                          </p>
                          <p className="mt-2 text-sm text-slate-900 dark:text-white">
                            {formatRoleLabel(selectedUserProfile?.role)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Name
                          </p>
                          <p className="mt-2 text-sm text-slate-900 dark:text-white">
                            {selectedUserProfile?.name || "Unknown"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Account Created
                          </p>
                          <p className="mt-2 text-sm text-slate-900 dark:text-white">
                            {formatDate(selectedUserProfile?.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          IP Address
                        </p>
                        <p className="mt-2 break-all font-mono text-sm text-slate-900 dark:text-white">
                          {selectedRecord.ipAddress || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Source
                        </p>
                        <p className="mt-2 text-sm text-slate-900 dark:text-white">
                          {getLocationSourceLabel(selectedRecord.source)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Browser
                        </p>
                        <p className="mt-2 text-sm text-slate-900 dark:text-white">
                          {selectedRecord.browser || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Operating System
                        </p>
                        <p className="mt-2 text-sm text-slate-900 dark:text-white">
                          {selectedRecord.operatingSystem || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Device Type
                        </p>
                        <p className="mt-2 text-sm capitalize text-slate-900 dark:text-white">
                          {selectedRecord.deviceType || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Registered At
                        </p>
                        <p className="mt-2 text-sm text-slate-900 dark:text-white">
                          {formatDate(selectedRecord.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Approximate Location
                      </p>
                      <span
                        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${locationSignal.className}`}
                      >
                        {locationSignal.label}
                      </span>
                      <p className="mt-2 text-sm text-slate-900 dark:text-white">
                        {formatLocation(selectedRecord)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {decodeDisplayValue(selectedRecord.timezone) ||
                          "Unknown timezone"}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                        {selectedRecord?.source === "browser-geolocation"
                          ? "This record includes consented browser geolocation, which is typically the most accurate location signal available during signup."
                          : "This is a security signal, not a verified physical address. It is typically inferred from network or provider metadata and may only be accurate at country, region, or city level."}
                      </p>
                      {formatAccuracy(
                        selectedRecord?.locationAccuracyMeters,
                      ) && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Reported accuracy:{" "}
                          {formatAccuracy(
                            selectedRecord.locationAccuracyMeters,
                          )}
                        </p>
                      )}
                      {selectedRecord?.preciseLocationCapturedAt && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Captured at:{" "}
                          {formatDate(selectedRecord.preciseLocationCapturedAt)}
                        </p>
                      )}
                      {(selectedRecord.latitude ||
                        selectedRecord.longitude) && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {selectedRecord.latitude || "?"},{" "}
                          {selectedRecord.longitude || "?"}
                        </p>
                      )}

                      {selectedRecordMap ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                          <LocationMap
                            mapUrls={selectedRecordMap}
                            record={selectedRecord}
                            coordinates={selectedRecordMapCoordinates}
                          />
                          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                            <span>
                              {isDerivedMapPreview
                                ? "Map preview derived from the stored city, region, and country because this record does not include saved coordinates."
                                : selectedRecord?.source ===
                                    "browser-geolocation"
                                  ? "Map preview using the precise browser geolocation stored with this registration record."
                                  : "Map preview using the coordinates stored with this registration record."}
                            </span>
                            <a
                              href={selectedRecordMap.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-sky-300 bg-white px-3 py-1.5 font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-300 dark:hover:border-sky-400/50 dark:hover:bg-slate-800"
                            >
                              Open in Maps
                            </a>
                          </div>
                        </div>
                      ) : derivedCoordinatesLoading ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                          Resolving a map preview from the stored approximate
                          location...
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                          No stored coordinates are available for this record,
                          and the approximate city or region could not be
                          resolved into a map preview.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        User Agent
                      </p>
                      <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-300">
                        {selectedRecord.userAgent || "Unknown"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                    No record selected yet. Use Inspect on any entry to review
                    its full metadata snapshot.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrationMetadataPage;
