import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../axios";

const GEOCODING_ENDPOINT = "https://nominatim.openstreetmap.org/search";

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

const getVisitorLocationSourceLabel = (source) => {
  switch (source) {
    case "vercel-headers":
      return "Edge/provider IP metadata";
    case "cloudflare-headers":
      return "Cloudflare IP metadata";
    case "ipwhois-fallback":
      return "IP geolocation fallback";
    default:
      return source || "Unknown source";
  }
};

const getRequiredConfirmationText = (type) =>
  type === "all" ? "confirm" : "ok";

const getGoogleMapsUrl = (latitude, longitude) => {
  if (latitude === null || latitude === undefined) {
    return null;
  }

  if (longitude === null || longitude === undefined) {
    return null;
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const getGoogleMapsSearchUrl = (query) => {
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (!normalizedQuery) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedQuery)}`;
};

const hasStoredCoordinates = (location) => {
  if (
    location?.latitude === null ||
    location?.latitude === undefined ||
    location?.latitude === "" ||
    location?.longitude === null ||
    location?.longitude === undefined ||
    location?.longitude === ""
  ) {
    return false;
  }

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  return Number.isFinite(latitude) && Number.isFinite(longitude);
};

const buildLocationQuery = (location) => {
  const parts = [location?.city, location?.region, location?.country]
    .map(decodeDisplayValue)
    .filter((value) => value && value !== "Unknown");

  return parts.length > 0 ? parts.join(", ") : "";
};

const buttonBaseClass =
  "inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass = `${buttonBaseClass} border-sky-500/40 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-950/25 hover:-translate-y-0.5 hover:from-sky-400 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-950/35 focus:ring-sky-400/45`;
const secondaryButtonClass = `${buttonBaseClass} border-slate-700 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/25 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800 focus:ring-slate-400/30`;
const dangerButtonClass = `${buttonBaseClass} border-rose-500/45 bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/30 hover:-translate-y-0.5 hover:from-rose-500 hover:to-red-500 hover:shadow-xl hover:shadow-rose-950/40 focus:ring-rose-400/45`;
const ghostDangerButtonClass = `${buttonBaseClass} border-rose-500/30 bg-rose-500/10 text-rose-100 hover:-translate-y-0.5 hover:border-rose-400/55 hover:bg-rose-500/18 hover:text-white focus:ring-rose-400/35`;
const dashboardTabClass =
  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/35";
const LOCATION_PAGE_SIZE = 20;
const RECENT_VISITORS_PAGE_SIZE = 20;
const VISITORS_PER_LOCATION_PAGE = 10;

const AdminVisitorsPage = () => {
  const [viewMode, setViewMode] = useState("recent");
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [recentTotal, setRecentTotal] = useState(0);
  const [visitorsByLocation, setVisitorsByLocation] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationPage, setLocationPage] = useState(1);
  const [locationHasMore, setLocationHasMore] = useState(false);
  const [locationTotal, setLocationTotal] = useState(0);
  const [derivedCoordinatesByLocation, setDerivedCoordinatesByLocation] =
    useState({});
  const [visitorPages, setVisitorPages] = useState({}); // Track page for each location
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    type: "", // "all", "location", "visitor"
    data: null,
    inputValue: "",
  });

  const fetchRecentVisitors = async (page = 1) => {
    setRecentLoading(true);

    try {
      const offset = (page - 1) * RECENT_VISITORS_PAGE_SIZE;
      const res = await api.get(
        `/visitors/list?limit=${RECENT_VISITORS_PAGE_SIZE}&offset=${offset}`,
      );
      const data = res.data?.data || {};
      const total = data.total || 0;

      setRecentVisitors(data.visitors || []);
      setRecentTotal(total);
      setRecentHasMore(offset + RECENT_VISITORS_PAGE_SIZE < total);
      setRecentPage(page);
    } catch (error) {
      console.error("Failed to fetch recent visitors:", error);
    } finally {
      setRecentLoading(false);
    }
  };

  const fetchVisitorsByLocation = async (page = 1) => {
    setLocationLoading(true);
    try {
      const res = await api.get(
        `/visitors/by-location?page=${page}&limit=${LOCATION_PAGE_SIZE}`,
      );
      const data = res.data;
      setVisitorsByLocation(data.data?.locations || []);
      setLocationTotal(data.data?.totalLocations || 0);
      setLocationHasMore(data.data?.hasMore || false);
      setLocationPage(page);
    } catch (error) {
      console.error("Failed to fetch visitors by location:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const refreshVisitorData = () => {
    setRecentPage(1);
    setLocationPage(1);
    setVisitorPages({});
    fetchRecentVisitors(1);
    fetchVisitorsByLocation(1);
  };

  const handleDeleteAll = async () => {
    const requiredInput = getRequiredConfirmationText(deleteConfirmation.type);

    if (deleteConfirmation.inputValue !== requiredInput) {
      Swal.fire(
        "Error",
        `Please type '${requiredInput}' to confirm deletion`,
        "error",
      );
      return;
    }

    try {
      await api.delete(`/visitors/delete-all`);
      {
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        Swal.fire({
          title: "Deleted!",
          text: "All visitors have been removed.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refreshVisitorData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error", "Error deleting visitors", "error");
    }
  };

  const handleDeleteLocation = async (country, city) => {
    const requiredInput = getRequiredConfirmationText(deleteConfirmation.type);

    if (deleteConfirmation.inputValue !== requiredInput) {
      Swal.fire(
        "Error",
        `Please type '${requiredInput}' to confirm deletion`,
        "error",
      );
      return;
    }

    try {
      await api.delete(`/visitors/delete-by-location`, {
        data: { country, city },
      });
      {
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        Swal.fire({
          title: "Deleted!",
          text: `All visitors from ${country}, ${city} have been removed.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refreshVisitorData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error", "Error deleting location visitors", "error");
    }
  };

  const handleDeleteVisitor = async (ipAddress) => {
    const requiredInput = getRequiredConfirmationText(deleteConfirmation.type);

    if (deleteConfirmation.inputValue !== requiredInput) {
      Swal.fire(
        "Error",
        `Please type '${requiredInput}' to confirm deletion`,
        "error",
      );
      return;
    }

    try {
      await api.delete(`/visitors/delete-by-ip`, {
        data: { ipAddress },
      });
      {
        setDeleteConfirmation({
          show: false,
          type: "",
          data: null,
          inputValue: "",
        });
        Swal.fire({
          title: "Deleted!",
          text: `Visitor ${ipAddress} has been removed.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refreshVisitorData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire("Error", "Error deleting visitor", "error");
    }
  };

  // Helper function to get location key
  const getLocationKey = (country, city) =>
    `${decodeDisplayValue(country) || "Unknown"}, ${decodeDisplayValue(city) || "Unknown"}`;

  // Handle pagination for visitors within a location
  const handleVisitorPageChange = (country, city, newPage) => {
    const key = getLocationKey(country, city);
    setVisitorPages({
      ...visitorPages,
      [key]: newPage,
    });
  };

  // Get paginated visitors for a location
  const getPaginatedVisitors = (location) => {
    const key = getLocationKey(location.country, location.city);
    const currentPage = visitorPages[key] || 1;
    const itemsPerPage = VISITORS_PER_LOCATION_PAGE;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      visitors: location.visitors.slice(startIndex, endIndex),
      currentPage,
      totalPages: Math.ceil(location.visitors.length / itemsPerPage),
      hasMore: endIndex < location.visitors.length,
      hasPrev: currentPage > 1,
    };
  };

  const getLocationMapUrl = (location) => {
    if (hasStoredCoordinates(location)) {
      return getGoogleMapsUrl(location.latitude, location.longitude);
    }

    const locationQuery = buildLocationQuery(location);

    if (locationQuery) {
      return getGoogleMapsSearchUrl(locationQuery);
    }

    const derivedCoordinates =
      derivedCoordinatesByLocation[
        getLocationKey(location.country, location.city)
      ];

    return derivedCoordinates
      ? getGoogleMapsUrl(
          derivedCoordinates.latitude,
          derivedCoordinates.longitude,
        )
      : null;
  };

  const getRecentVisitorLocationLabel = (visitor) => {
    const locationParts = [visitor.city, visitor.region, visitor.country]
      .map(decodeDisplayValue)
      .filter((value) => value && value !== "Unknown");

    return locationParts.length > 0 ? locationParts.join(", ") : "Unknown";
  };

  const getRecentVisitorMapUrl = (visitor) => {
    if (hasStoredCoordinates(visitor)) {
      return getGoogleMapsUrl(visitor.latitude, visitor.longitude);
    }

    const locationQuery = buildLocationQuery(visitor);

    return locationQuery ? getGoogleMapsSearchUrl(locationQuery) : null;
  };

  useEffect(() => {
    fetchRecentVisitors(1);
  }, []);

  useEffect(() => {
    if (viewMode === "location" && visitorsByLocation.length === 0) {
      fetchVisitorsByLocation(1);
    }
  }, [viewMode, visitorsByLocation.length]);

  useEffect(() => {
    if (visitorsByLocation.length === 0) {
      setDerivedCoordinatesByLocation({});
      return undefined;
    }

    const abortController = new AbortController();

    const geocodeLocations = async () => {
      for (const location of visitorsByLocation) {
        const locationKey = getLocationKey(location.country, location.city);

        if (hasStoredCoordinates(location)) {
          continue;
        }

        if (derivedCoordinatesByLocation[locationKey]) {
          continue;
        }

        const locationQuery = buildLocationQuery(location);

        if (!locationQuery) {
          continue;
        }

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
            continue;
          }

          const results = await response.json();
          const firstMatch = Array.isArray(results) ? results[0] : null;
          const latitude = Number(firstMatch?.lat);
          const longitude = Number(firstMatch?.lon);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
          }

          setDerivedCoordinatesByLocation((current) => ({
            ...current,
            [locationKey]: {
              latitude,
              longitude,
            },
          }));
        } catch (error) {
          if (error.name === "AbortError") {
            return;
          }
        }
      }
    };

    void geocodeLocations();

    return () => {
      abortController.abort();
    };
  }, [visitorsByLocation, derivedCoordinatesByLocation]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#020617_100%)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300/80">
              Security Analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              👥 Visitors Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              See the newest visitors first, or switch back to grouped location
              analysis when you need the broader breakdown.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (viewMode === "recent") {
                  setRecentPage(1);
                  fetchRecentVisitors(1);
                  return;
                }

                setLocationPage(1);
                fetchVisitorsByLocation(1);
              }}
              disabled={viewMode === "recent" ? recentLoading : locationLoading}
              className={primaryButtonClass}
            >
              {(viewMode === "recent" ? recentLoading : locationLoading)
                ? "Refreshing..."
                : "🔄 Refresh"}
            </button>
            <button
              onClick={() =>
                setDeleteConfirmation({
                  show: true,
                  type: "all",
                  data: null,
                  inputValue: "",
                })
              }
              className={dangerButtonClass}
            >
              🗑️ Delete All
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/75 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.3)]">
          <button
            type="button"
            onClick={() => setViewMode("recent")}
            className={`${dashboardTabClass} ${
              viewMode === "recent"
                ? "border-sky-400/45 bg-sky-500/15 text-sky-100 shadow-lg shadow-sky-950/20"
                : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            Recent Visitors
          </button>
          <button
            type="button"
            onClick={() => setViewMode("location")}
            className={`${dashboardTabClass} ${
              viewMode === "location"
                ? "border-sky-400/45 bg-sky-500/15 text-sky-100 shadow-lg shadow-sky-950/20"
                : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            Location Groups
          </button>
        </div>

        {/* Content */}
        {viewMode === "recent" ? (
          recentLoading && recentPage === 1 ? (
            <div className="text-center p-12">
              <p className="text-gray-400 text-lg">
                Loading recent visitors...
              </p>
            </div>
          ) : recentVisitors.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-gray-400 text-lg">
                No recent visitor data available yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/75 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Most Recent Visitors
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Sorted by latest visit time so you can immediately see who
                      arrived most recently.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                    <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5">
                      Total unique visitors: {recentTotal}
                    </span>
                    <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5">
                      Page: {recentPage}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-300">
                      <thead className="border-b border-slate-800 bg-slate-900/85">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            Visited At
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            IP Address
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Browser
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Device
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            OS
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Visits
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVisitors.map((visitor) => (
                          <tr
                            key={visitor.ipAddress}
                            className="border-b border-slate-800/80 transition-colors hover:bg-slate-900/70"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              {new Date(visitor.visitedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {visitor.ipAddress}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-white">
                                  {getRecentVisitorLocationLabel(visitor)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {getVisitorLocationSourceLabel(
                                    visitor.source,
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {decodeDisplayValue(visitor.browser) || "Unknown"}
                            </td>
                            <td className="px-4 py-3">
                              {decodeDisplayValue(visitor.deviceType) ||
                                "Unknown"}
                            </td>
                            <td className="px-4 py-3">
                              {decodeDisplayValue(visitor.operatingSystem) ||
                                "Unknown"}
                            </td>
                            <td className="px-4 py-3">{visitor.visitCount}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {getRecentVisitorMapUrl(visitor) && (
                                  <a
                                    href={getRecentVisitorMapUrl(visitor)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition-all duration-200 hover:border-sky-400/50 hover:bg-sky-500/20 hover:text-white"
                                  >
                                    Map
                                  </a>
                                )}
                                <button
                                  onClick={() =>
                                    setDeleteConfirmation({
                                      show: true,
                                      type: "visitor",
                                      data: {
                                        ipAddress: visitor.ipAddress,
                                      },
                                      inputValue: "",
                                    })
                                  }
                                  className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-all duration-200 hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                  <button
                    onClick={() => fetchRecentVisitors(recentPage - 1)}
                    disabled={recentLoading || recentPage === 1}
                    className={secondaryButtonClass}
                  >
                    ← Previous
                  </button>
                  <span className="text-sm font-medium text-slate-300">
                    Page{" "}
                    <span className="font-bold text-sky-300">{recentPage}</span>{" "}
                    • {recentTotal} total unique visitors
                  </span>
                  <button
                    onClick={() => fetchRecentVisitors(recentPage + 1)}
                    disabled={recentLoading || !recentHasMore}
                    className={primaryButtonClass}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )
        ) : locationLoading && locationPage === 1 ? (
          <div className="text-center p-12">
            <p className="text-gray-400 text-lg">Loading location data...</p>
          </div>
        ) : visitorsByLocation.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-400 text-lg">
              No visitor data available yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitorsByLocation.map((location, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-800/80 bg-slate-950/75 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)] transition-all duration-300 hover:border-slate-700 hover:shadow-[0_24px_60px_rgba(2,6,23,0.42)]"
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      📍 {decodeDisplayValue(location.country) || "Unknown"},{" "}
                      {decodeDisplayValue(location.city) || "Unknown"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {location.count}{" "}
                      {location.count === 1 ? "visitor" : "visitors"}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      Approximate IP-based location via{" "}
                      {getVisitorLocationSourceLabel(location.source)}.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                      <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5">
                        Region:{" "}
                        {decodeDisplayValue(location.region) || "Unknown"}
                      </span>
                      <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5">
                        Timezone:{" "}
                        {decodeDisplayValue(location.timezone) || "Unknown"}
                      </span>
                      <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5">
                        Total visits: {location.visitCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getLocationMapUrl(location) && (
                      <a
                        href={getLocationMapUrl(location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={secondaryButtonClass}
                      >
                        View Map ↗
                      </a>
                    )}
                    <button
                      onClick={() =>
                        setDeleteConfirmation({
                          show: true,
                          type: "location",
                          data: {
                            country: location.country,
                            city: location.city,
                          },
                          inputValue: "",
                        })
                      }
                      className={ghostDangerButtonClass}
                    >
                      🗑️ Delete Location
                    </button>
                  </div>
                </div>

                {/* Visitors Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-300">
                      <thead className="border-b border-slate-800 bg-slate-900/85">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            IP Address
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Browser
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Device
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            OS
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Visits
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Visited At
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const paginationData = getPaginatedVisitors(location);
                          return paginationData.visitors.map(
                            (visitor, vIdx) => (
                              <tr
                                key={vIdx}
                                className="border-b border-slate-800/80 transition-colors hover:bg-slate-900/70"
                              >
                                <td className="px-4 py-3 font-mono text-slate-400">
                                  {visitor.ipAddress}
                                </td>
                                <td className="px-4 py-3">{visitor.browser}</td>
                                <td className="px-4 py-3">
                                  {visitor.deviceType}
                                </td>
                                <td className="px-4 py-3">
                                  {visitor.operatingSystem}
                                </td>
                                <td className="px-4 py-3">
                                  {visitor.visitCount}
                                </td>
                                <td className="px-4 py-3">
                                  {new Date(visitor.visitedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {getLocationMapUrl(location) && (
                                      <a
                                        href={getLocationMapUrl(location)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition-all duration-200 hover:border-sky-400/50 hover:bg-sky-500/20 hover:text-white"
                                      >
                                        Map
                                      </a>
                                    )}
                                    <button
                                      onClick={() =>
                                        setDeleteConfirmation({
                                          show: true,
                                          type: "visitor",
                                          data: {
                                            ipAddress: visitor.ipAddress,
                                          },
                                          inputValue: "",
                                        })
                                      }
                                      className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-all duration-200 hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-white"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ),
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Visitor Pagination */}
                {(() => {
                  const paginationData = getPaginatedVisitors(location);
                  return location.visitors.length > 10 ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                      <button
                        onClick={() =>
                          handleVisitorPageChange(
                            location.country,
                            location.city,
                            paginationData.currentPage - 1,
                          )
                        }
                        disabled={!paginationData.hasPrev}
                        className={secondaryButtonClass}
                      >
                        ← Previous
                      </button>
                      <span className="text-sm font-medium text-slate-300">
                        Page{" "}
                        <span className="font-bold text-sky-300">
                          {paginationData.currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-sky-300">
                          {paginationData.totalPages}
                        </span>{" "}
                        ({location.visitors.length} total)
                      </span>
                      <button
                        onClick={() =>
                          handleVisitorPageChange(
                            location.country,
                            location.city,
                            paginationData.currentPage + 1,
                          )
                        }
                        disabled={!paginationData.hasMore}
                        className={primaryButtonClass}
                      >
                        Next →
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/75 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.3)] md:flex-row md:items-center md:justify-between">
              <button
                onClick={() => fetchVisitorsByLocation(locationPage - 1)}
                disabled={locationLoading || locationPage === 1}
                className={secondaryButtonClass}
              >
                ← Previous
              </button>
              <span className="flex-1 text-center font-medium text-slate-300">
                Page{" "}
                <span className="font-bold text-sky-300">{locationPage}</span> •{" "}
                {locationTotal} total locations
              </span>
              <button
                onClick={() => fetchVisitorsByLocation(locationPage + 1)}
                disabled={locationLoading || !locationHasMore}
                className={primaryButtonClass}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950/95 p-8 shadow-[0_28px_80px_rgba(2,6,23,0.6)]">
            <h2 className="mb-4 text-2xl font-bold text-rose-300">
              ⚠️ Confirm Deletion
            </h2>
            <p className="mb-6 text-slate-300">
              {deleteConfirmation.type === "all" &&
                "Are you sure you want to delete ALL visitors? This action cannot be undone."}
              {deleteConfirmation.type === "location" &&
                `Are you sure you want to delete all visitors from ${decodeDisplayValue(deleteConfirmation.data?.country) || "Unknown"}, ${decodeDisplayValue(deleteConfirmation.data?.city) || "Unknown"}? This action cannot be undone.`}
              {deleteConfirmation.type === "visitor" &&
                `Are you sure you want to delete visitor ${deleteConfirmation.data?.ipAddress}? This action cannot be undone.`}
            </p>
            <div className="mb-6">
              {(() => {
                const requiredInput = getRequiredConfirmationText(
                  deleteConfirmation.type,
                );

                return (
                  <>
                    <label className="mb-2 block text-sm text-slate-400">
                      Type "{requiredInput}" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation.inputValue}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          inputValue: e.target.value,
                        })
                      }
                      placeholder={`Type '${requiredInput}' to confirm`}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-all duration-200 focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-400/25"
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          deleteConfirmation.inputValue === requiredInput
                        ) {
                          if (deleteConfirmation.type === "all") {
                            handleDeleteAll();
                          } else if (deleteConfirmation.type === "location") {
                            handleDeleteLocation(
                              deleteConfirmation.data.country,
                              deleteConfirmation.data.city,
                            );
                          } else if (deleteConfirmation.type === "visitor") {
                            handleDeleteVisitor(
                              deleteConfirmation.data.ipAddress,
                            );
                          }
                        }
                      }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirmation({
                    show: false,
                    type: "",
                    data: null,
                    inputValue: "",
                  })
                }
                className={`${secondaryButtonClass} flex-1`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmation.type === "all") {
                    handleDeleteAll();
                  } else if (deleteConfirmation.type === "location") {
                    handleDeleteLocation(
                      deleteConfirmation.data.country,
                      deleteConfirmation.data.city,
                    );
                  } else if (deleteConfirmation.type === "visitor") {
                    handleDeleteVisitor(deleteConfirmation.data.ipAddress);
                  }
                }}
                disabled={
                  deleteConfirmation.inputValue !==
                  getRequiredConfirmationText(deleteConfirmation.type)
                }
                className={`${dangerButtonClass} flex-1 disabled:from-rose-900 disabled:to-red-900`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitorsPage;
