import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "sonner";
import api, { externalApi } from "../axios";
import { useAuth } from "../services/auth.services";
import DateTime from "../components/UI/DateTime";
import Button from "../components/UI/Button";
import {
  IoCheckmark,
  IoRefreshOutline,
  IoTrashOutline,
  IoWarningOutline,
  IoPeopleOutline,
  IoLocationOutline,
} from "react-icons/io5";

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
    case "browser-geolocation":
      return "Precise device location (consented)";
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

const dashboardTabClass =
  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/35";
const LOCATION_PAGE_SIZE = 20;
const RECENT_VISITORS_PAGE_SIZE = 20;
const VISITORS_PER_LOCATION_PAGE = 10;

const AdminVisitorsPage = () => {
  const { isSuperAdmin } = useAuth();
  // Kept in the URL (?tab=...) instead of plain component state so a page
  // refresh lands back on the same view instead of resetting to "recent".
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("tab");
  const viewMode = ["recent", "location"].includes(requestedView)
    ? requestedView
    : "recent";
  const setViewMode = (key) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", key);
        return next;
      },
      { replace: true },
    );
  };
  // Only meaningful for super admins — registered-match data is empty for a
  // plain admin (see the backend's exposeFullIp gate), so filtering by it
  // would just silently return nothing without explaining why.
  const [onlyRegistered, setOnlyRegistered] = useState(false);
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
  const [ipInspection, setIpInspection] = useState({
    show: false,
    loading: false,
    ipAddress: null,
    records: [],
  });
  const [retentionDays, setRetentionDays] = useState(null);
  const [retentionInput, setRetentionInput] = useState("");
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [retentionSaving, setRetentionSaving] = useState(false);

  const fetchRetentionSettings = async () => {
    setRetentionLoading(true);
    try {
      const response = await api.get("/visitors/settings");
      const days = response.data?.data?.retentionDays;
      setRetentionDays(days ?? null);
      setRetentionInput(days !== undefined && days !== null ? String(days) : "");
    } catch (requestError) {
      console.error("Failed to load visitor retention settings:", requestError);
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleSaveRetention = async () => {
    const parsed = Number(retentionInput);
    if (!Number.isInteger(parsed) || parsed < 7 || parsed > 365) {
      Swal.fire({
        icon: "error",
        title: "Invalid value",
        text: "Retention must be a whole number of days between 7 and 365.",
      });
      return;
    }

    setRetentionSaving(true);
    try {
      const response = await api.patch("/visitors/settings", {
        retentionDays: parsed,
      });
      const days = response.data?.data?.retentionDays;
      setRetentionDays(days ?? parsed);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Retention period updated",
        showConfirmButton: false,
        timer: 2200,
      });
    } catch (requestError) {
      console.error("Failed to update visitor retention settings:", requestError);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          requestError.response?.data?.message ||
          "Please try again in a moment.",
      });
    } finally {
      setRetentionSaving(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRetentionSettings();
    }
  }, [isSuperAdmin]);

  const fetchRecentVisitors = async (page = 1) => {
    setRecentLoading(true);

    try {
      const offset = (page - 1) * RECENT_VISITORS_PAGE_SIZE;
      const res = await api.get(
        `/visitors/list?limit=${RECENT_VISITORS_PAGE_SIZE}&offset=${offset}${
          onlyRegistered ? "&onlyRegistered=true" : ""
        }`,
      );
      const data = res.data?.data || {};
      const total = data.total || 0;

      setRecentVisitors(data.visitors || []);
      setRecentTotal(total);
      setRecentHasMore(offset + RECENT_VISITORS_PAGE_SIZE < total);
      setRecentPage(page);
    } catch (error) {
      console.error("Failed to fetch recent visitors:", error);
      toast.error("Failed to load recent visitors. Please try again.");
    } finally {
      setRecentLoading(false);
    }
  };

  const fetchVisitorsByLocation = async (page = 1) => {
    setLocationLoading(true);
    try {
      const res = await api.get(
        `/visitors/by-location?page=${page}&limit=${LOCATION_PAGE_SIZE}${
          onlyRegistered ? "&onlyRegistered=true" : ""
        }`,
      );
      const data = res.data;
      setVisitorsByLocation(data.data?.locations || []);
      setLocationTotal(data.data?.totalLocations || 0);
      setLocationHasMore(data.data?.hasMore || false);
      setLocationPage(page);
    } catch (error) {
      console.error("Failed to fetch visitors by location:", error);
      toast.error("Failed to load visitor locations. Please try again.");
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

  const handleInspectIp = async (ipAddress, registeredUsers) => {
    setIpInspection({ show: true, loading: true, ipAddress, records: [] });

    try {
      const settled = await Promise.allSettled(
        registeredUsers.map(async (match) => {
          const [metadataResult, userResult] = await Promise.allSettled([
            api.get(`/user/registration-metadata/${match.userId}`),
            api.get(`/user/${match.userId}`),
          ]);

          return {
            userId: match.userId,
            email: match.email,
            metadata:
              metadataResult.status === "fulfilled"
                ? metadataResult.value.data?.data
                : null,
            profile:
              userResult.status === "fulfilled"
                ? userResult.value.data?.data
                : null,
          };
        }),
      );

      const records = settled
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      setIpInspection((prev) => ({ ...prev, loading: false, records }));
    } catch (error) {
      console.error("Failed to load registered account details:", error);
      setIpInspection((prev) => ({ ...prev, loading: false, records: [] }));
      toast.error("Failed to load account details.");
    }
  };

  const closeIpInspection = () => {
    setIpInspection({
      show: false,
      loading: false,
      ipAddress: null,
      records: [],
    });
  };

  const formatIpLocation = (record) => {
    const parts = [record?.city, record?.region, record?.country]
      .map(decodeDisplayValue)
      .filter((value) => value && value !== "Unknown");
    return parts.length > 0 ? parts.join(", ") : "Unknown";
  };

  // The IP itself takes on the "registered" styling (instead of a separate
  // badge underneath) and becomes clickable — a click opens the inspection
  // modal for whichever account(s) share this IP.
  const renderIpAddress = (ipAddress, registeredUsers) => {
    if (!registeredUsers || registeredUsers.length === 0) {
      return <span>{ipAddress}</span>;
    }

    const emails = registeredUsers.map((user) => user.email);

    return (
      <button
        type="button"
        onClick={() => handleInspectIp(ipAddress, registeredUsers)}
        title={`Registered: ${emails.join(", ")} — click for details`}
        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-200 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-500/20"
      >
        <IoCheckmark size={12} aria-hidden="true" /> {ipAddress}
      </button>
    );
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

  // Refetches whichever view is active when the filter is toggled — skips
  // the mount render since the two effects above already cover the initial
  // load with the default (off) filter state.
  const isFirstOnlyRegisteredRender = useRef(true);
  useEffect(() => {
    if (isFirstOnlyRegisteredRender.current) {
      isFirstOnlyRegisteredRender.current = false;
      return;
    }

    if (viewMode === "recent") {
      setRecentPage(1);
      fetchRecentVisitors(1);
    } else {
      setLocationPage(1);
      fetchVisitorsByLocation(1);
    }
  }, [onlyRegistered]);

  useEffect(() => {
    if (visitorsByLocation.length === 0) {
      // Bail out without a new object reference when it's already empty —
      // `derivedCoordinatesByLocation` is itself a dependency of this
      // effect, so unconditionally setting a fresh `{}` here would change
      // its reference every run, retrigger the effect, and loop forever
      // ("Maximum update depth exceeded") for as long as there's no
      // location data loaded (e.g. the whole time the "recent" tab is
      // active). The functional-updater form lets React bail out via
      // Object.is when nothing actually changed.
      setDerivedCoordinatesByLocation((current) =>
        Object.keys(current).length === 0 ? current : {},
      );
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
          const response = await externalApi.get(GEOCODING_ENDPOINT, {
            params: {
              format: "jsonv2",
              limit: 1,
              q: locationQuery,
            },
            signal: abortController.signal,
          });
          const results = response.data;
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
          if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
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

  useEffect(() => {
    if (!ipInspection.show) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeIpInspection();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ipInspection.show]);

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70 p-5 shadow-[0_24px_20px_rgba(2,6,23,0.45)]  md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300/80">
              Security Analytics
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
              <IoPeopleOutline aria-hidden="true" />
              Visitors Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              See the newest visitors first, or switch back to grouped location
              analysis when you need the broader breakdown.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
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
            >
              {(viewMode === "recent" ? recentLoading : locationLoading) ? (
                "Refreshing..."
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <IoRefreshOutline size={14} aria-hidden="true" />
                  Refresh
                </span>
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setDeleteConfirmation({
                  show: true,
                  type: "all",
                  data: null,
                  inputValue: "",
                })
              }
            >
              Delete All
            </Button>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="mb-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70 p-5 shadow-[0_24px_20px_rgba(2,6,23,0.45)] md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300/80">
                  Data Retention
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  Visitor record retention
                </h3>
                <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                  Visitor records (including IP address) are deleted
                  automatically after this many days of inactivity from that
                  visitor.
                  {retentionDays !== null && !retentionLoading && (
                    <> Currently kept for <strong>{retentionDays} days</strong>.</>
                  )}
                </p>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Days
                  </span>
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={retentionInput}
                    disabled={retentionLoading}
                    onChange={(e) => setRetentionInput(e.target.value)}
                    className="w-28 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:border-sky-400"
                  />
                </label>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveRetention}
                  disabled={retentionLoading || retentionSaving}
                >
                  {retentionSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/75 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.3)]">
          <button
            type="button"
            onClick={() => setViewMode("recent")}
            className={`${dashboardTabClass} ${
              viewMode === "recent"
                ? "border-sky-300 dark:border-sky-400/45 bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-100 shadow-lg shadow-sky-950/20"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Recent Visitors
          </button>
          <button
            type="button"
            onClick={() => setViewMode("location")}
            className={`${dashboardTabClass} ${
              viewMode === "location"
                ? "border-sky-300 dark:border-sky-400/45 bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-100 shadow-lg shadow-sky-950/20"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Location Groups
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setOnlyRegistered((prev) => !prev)}
              title="Show only visitors whose IP matches a registered account"
              className={`${dashboardTabClass} ml-auto ${
                onlyRegistered
                  ? "border-emerald-300 dark:border-emerald-400/45 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-100 shadow-lg shadow-emerald-950/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <IoCheckmark size={14} aria-hidden="true" />
                Only Registered Matches
              </span>
            </button>
          )}
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
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/75 p-6 shadow-[0_18px_10px_rgba(2,6,23,0.35)]">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Most Recent Visitors
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Sorted by latest visit time so you can immediately see who
                      arrived most recently.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-800 dark:text-slate-200">
                    <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-3 py-1.5">
                      Total unique visitors: {recentTotal}
                    </span>
                    <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-3 py-1.5">
                      Page: {recentPage}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-600 dark:text-slate-300">
                      <thead className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85">
                        <tr>
                          <th className="px-4 py-3 text-center font-semibold">
                            Visited At
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            IP Address
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            Location
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            Browser
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            Device
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            OS
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            Visits
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVisitors.map((visitor) => (
                          <tr
                            key={visitor.ipAddress}
                            className="border-b border-slate-200 dark:border-slate-800/80 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <DateTime value={visitor.visitedAt} />
                            </td>
                            <td className="px-1 py-3 font-mono text-slate-600 dark:text-slate-400 min-w-[150px] text-start ">
                              {renderIpAddress(
                                visitor.ipAddress,
                                visitor.registeredUsers,
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {getRecentVisitorLocationLabel(visitor)}
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-500">
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
                            <td className="px-1 py-3 text-center">
                              {visitor.visitCount}
                            </td>
                            <td className="px-1 py-3 min-w-[150px] ">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {getRecentVisitorMapUrl(visitor) && (
                                  <Button
                                    href={getRecentVisitorMapUrl(visitor)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="secondary"
                                    size="sm"
                                  >
                                    Map
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="sm"
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
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchRecentVisitors(recentPage - 1)}
                    disabled={recentLoading || recentPage === 1}
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Page{" "}
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {recentPage}
                    </span>{" "}
                    • {recentTotal} total unique visitors
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fetchRecentVisitors(recentPage + 1)}
                    disabled={recentLoading || !recentHasMore}
                  >
                    Next →
                  </Button>
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
                className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/75 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)] transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-[0_24px_60px_rgba(2,6,23,0.42)]"
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-white">
                      <IoLocationOutline size={18} aria-hidden="true" />
                      {decodeDisplayValue(location.country) || "Unknown"},{" "}
                      {decodeDisplayValue(location.city) || "Unknown"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {location.count}{" "}
                      {location.count === 1 ? "visitor" : "visitors"}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-500">
                      Approximate IP-based location via{" "}
                      {getVisitorLocationSourceLabel(location.source)}.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-800 dark:text-slate-200">
                      <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-3 py-1.5">
                        Region:{" "}
                        {decodeDisplayValue(location.region) || "Unknown"}
                      </span>
                      <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-3 py-1.5">
                        Timezone:{" "}
                        {decodeDisplayValue(location.timezone) || "Unknown"}
                      </span>
                      <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-3 py-1.5">
                        Total visits: {location.visitCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getLocationMapUrl(location) && (
                      <Button
                        href={getLocationMapUrl(location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                        size="sm"
                      >
                        View Map ↗
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
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
                    >
                      <IoTrashOutline size={14} aria-hidden="true" />
                      Delete Location
                    </Button>
                  </div>
                </div>

                {/* Visitors Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-600 dark:text-slate-300">
                      <thead className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85">
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
                                className="border-b border-slate-200 dark:border-slate-800/80 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                              >
                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                                  {renderIpAddress(
                                    visitor.ipAddress,
                                    visitor.registeredUsers,
                                  )}
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
                                  <DateTime value={visitor.visitedAt} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {getLocationMapUrl(location) && (
                                      <Button
                                        href={getLocationMapUrl(location)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="secondary"
                                        size="sm"
                                      >
                                        Map
                                      </Button>
                                    )}
                                    <Button
                                      variant="danger"
                                      size="sm"
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
                                    >
                                      Delete
                                    </Button>
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
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleVisitorPageChange(
                            location.country,
                            location.city,
                            paginationData.currentPage - 1,
                          )
                        }
                        disabled={!paginationData.hasPrev}
                      >
                        ← Previous
                      </Button>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Page{" "}
                        <span className="font-bold text-sky-700 dark:text-sky-300">
                          {paginationData.currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-sky-700 dark:text-sky-300">
                          {paginationData.totalPages}
                        </span>{" "}
                        ({location.visitors.length} total)
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleVisitorPageChange(
                            location.country,
                            location.city,
                            paginationData.currentPage + 1,
                          )
                        }
                        disabled={!paginationData.hasMore}
                      >
                        Next →
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/75 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.3)] md:flex-row md:items-center md:justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchVisitorsByLocation(locationPage - 1)}
                disabled={locationLoading || locationPage === 1}
              >
                ← Previous
              </Button>
              <span className="flex-1 text-center font-medium text-slate-600 dark:text-slate-300">
                Page{" "}
                <span className="font-bold text-sky-700 dark:text-sky-300">
                  {locationPage}
                </span>{" "}
                • {locationTotal} total locations
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fetchVisitorsByLocation(locationPage + 1)}
                disabled={locationLoading || !locationHasMore}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-300 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-950/95 p-8 shadow-[0_28px_80px_rgba(2,6,23,0.6)]">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-rose-700 dark:text-rose-300">
              <IoWarningOutline size={22} aria-hidden="true" />
              Confirm Deletion
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
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
                    <label
                      htmlFor="visitors-delete-confirm"
                      className="mb-2 block text-sm text-slate-600 dark:text-slate-400"
                    >
                      Type "{requiredInput}" to confirm:
                    </label>
                    <input
                      id="visitors-delete-confirm"
                      type="text"
                      value={deleteConfirmation.inputValue}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          inputValue: e.target.value,
                        })
                      }
                      placeholder={`Type '${requiredInput}' to confirm`}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white transition-all duration-200 focus:border-rose-300 dark:focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-400/25"
                      onKeyDown={(e) => {
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
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() =>
                  setDeleteConfirmation({
                    show: false,
                    type: "",
                    data: null,
                    inputValue: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
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
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* IP → Registered Account Inspection Modal */}
      {ipInspection.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Registered Account
                  {ipInspection.records.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">
                  {ipInspection.ipAddress}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeIpInspection}
                aria-label="Close account details"
              >
                ×
              </Button>
            </div>

            <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto px-6 py-6">
              {ipInspection.loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  Loading account details...
                </div>
              ) : ipInspection.records.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                  Could not load account details for this IP.
                </div>
              ) : (
                <div className="space-y-4">
                  {ipInspection.records.map((record) => (
                    <div
                      key={record.userId}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Account
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {record.profile?.name || "Unknown name"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {record.email}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {record.userId}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Registered At
                          </p>
                          <p className="mt-2 text-sm text-slate-900 dark:text-white">
                            {record.metadata?.createdAt ? (
                              <DateTime value={record.metadata.createdAt} />
                            ) : (
                              "Unknown"
                            )}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Location
                          </p>
                          <p className="mt-2 text-sm text-slate-900 dark:text-white">
                            {formatIpLocation(record.metadata)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitorsPage;
