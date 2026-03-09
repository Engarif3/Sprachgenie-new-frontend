import { useEffect, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/min";
import { toast } from "sonner";
import Swal from "sweetalert2";
import api from "../axios";
import { getUserInfo, storeUserInfo } from "../services/auth.services";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRY_OPTIONS = getCountries()
  .map((code) => ({
    code,
    label: regionNames.of(code) || code,
    dialCode: `+${getCountryCallingCode(code)}`,
  }))
  .sort((left, right) => left.label.localeCompare(right.label));

const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

const parseContactNumber = (value) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return {
      countryCode: DEFAULT_COUNTRY.code,
      phoneNumber: "",
    };
  }

  const matchedCountry = [...COUNTRY_OPTIONS]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((country) => normalizedValue.startsWith(country.dialCode));

  if (!matchedCountry) {
    return {
      countryCode: DEFAULT_COUNTRY.code,
      phoneNumber: normalizedValue,
    };
  }

  return {
    countryCode: matchedCountry.code,
    phoneNumber: normalizedValue.slice(matchedCountry.dialCode.length).trim(),
  };
};

const formatContactNumber = (countryCode, phoneNumber) => {
  const selectedCountry =
    COUNTRY_OPTIONS.find((country) => country.code === countryCode) ||
    DEFAULT_COUNTRY;
  const normalizedNumber = String(phoneNumber || "").trim();
  const internationalNumber = normalizedNumber.replace(/^0+/, "");

  if (!internationalNumber) {
    return "";
  }

  return `${selectedCountry.dialCode} ${internationalNumber}`;
};

const isValidContactNumberLength = (phoneNumber) => {
  const digitCount = String(phoneNumber || "")
    .replace(/^0+/, "")
    .replace(/\D/g, "").length;

  return digitCount === 0 || (digitCount >= 8 && digitCount <= 15);
};

const normalizeRole = (role) => {
  if (!role) {
    return "user";
  }

  return String(role).toLowerCase();
};

const createInitials = (name, email) => {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const ProfilePage = () => {
  const cachedUser = getUserInfo() || {};
  const initialContact = parseContactNumber(cachedUser.contactNumber || "");
  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState({
    name: "",
    countryCode: initialContact.countryCode,
    phoneNumber: initialContact.phoneNumber,
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [showPhoneNumberError, setShowPhoneNumberError] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef(null);
  const countrySearchInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setIsCountryDropdownOpen(false);
        setCountryQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/user/me");
        const nextProfile = response?.data?.data;

        if (!nextProfile) {
          throw new Error("Failed to load profile details.");
        }

        setProfile(nextProfile);
        const parsedContact = parseContactNumber(nextProfile.contactNumber);
        setFormState({
          name: nextProfile.name || "",
          countryCode: parsedContact.countryCode,
          phoneNumber: parsedContact.phoneNumber,
          address: nextProfile.address || "",
        });

        storeUserInfo({
          ...cachedUser,
          id: nextProfile.id || cachedUser.id,
          name: nextProfile.name || cachedUser.name,
          email: nextProfile.email || cachedUser.email,
          role: normalizeRole(cachedUser.role || nextProfile.role),
          profilePhoto: nextProfile.profilePhoto || "",
        });
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Could not load your profile.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePhoneNumberChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[^\d\s().-]/g, "");

    setFormState((current) => ({
      ...current,
      phoneNumber: sanitizedValue,
    }));

    if (showPhoneNumberError) {
      setShowPhoneNumberError(!isValidContactNumberLength(sanitizedValue));
    }
  };

  const handleCountrySelect = (country) => {
    setFormState((current) => ({
      ...current,
      countryCode: country.code,
    }));
    setCountryQuery("");
    setIsCountryDropdownOpen(false);
  };

  const handleClearCountrySearch = () => {
    setCountryQuery("");
    setIsCountryDropdownOpen(true);
    countrySearchInputRef.current?.focus();
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setRemoveProfilePhoto(false);
  };

  const handleRemoveImage = async () => {
    const result = await Swal.fire({
      title: "Delete profile image?",
      text: "Your current profile photo will be removed when you save the profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete image",
      cancelButtonText: "Keep image",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#334155",
      background: "#0f172a",
      color: "#f8fafc",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setRemoveProfilePhoto(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidContactNumberLength(formState.phoneNumber)) {
      setShowPhoneNumberError(true);
      toast.error("Phone number must contain between 6 and 15 digits.");
      return;
    }

    setShowPhoneNumberError(false);

    setIsSaving(true);

    const payload = new FormData();
    payload.append(
      "data",
      JSON.stringify({
        name: formState.name,
        contactNumber: formatContactNumber(
          formState.countryCode,
          formState.phoneNumber,
        ),
        address: formState.address,
        removeProfilePhoto,
      }),
    );

    if (selectedFile) {
      payload.append("file", selectedFile);
    }

    try {
      const response = await api.patch("/user/update-my-profile", payload);
      const updatedProfile = response?.data?.data;

      if (!updatedProfile) {
        throw new Error("Profile update did not return data.");
      }

      setProfile(updatedProfile);
      const parsedContact = parseContactNumber(updatedProfile.contactNumber);
      setFormState({
        name: updatedProfile.name || "",
        countryCode: parsedContact.countryCode,
        phoneNumber: parsedContact.phoneNumber,
        address: updatedProfile.address || "",
      });
      setSelectedFile(null);
      setRemoveProfilePhoto(false);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      storeUserInfo({
        ...cachedUser,
        id: updatedProfile.id || cachedUser.id,
        name: updatedProfile.name || cachedUser.name,
        email: updatedProfile.email || cachedUser.email,
        role: normalizeRole(cachedUser.role || updatedProfile.role),
        profilePhoto: updatedProfile.profilePhoto || "",
      });

      toast.success(response?.data?.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Could not update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayedImage = removeProfilePhoto
    ? ""
    : previewUrl || profile?.profilePhoto || "";
  const role = normalizeRole(cachedUser.role || profile?.role);
  const isBasicUser = role === "basic_user";
  const selectedCountry =
    COUNTRY_OPTIONS.find((country) => country.code === formState.countryCode) ||
    DEFAULT_COUNTRY;
  const filteredCountries = countryQuery.trim()
    ? COUNTRY_OPTIONS.filter((country) => {
        const query = countryQuery.trim().toLowerCase();

        return (
          country.label.toLowerCase().includes(query) ||
          country.code.toLowerCase().includes(query) ||
          country.dialCode.includes(query)
        );
      })
    : COUNTRY_OPTIONS;
  const phoneNumberHasError =
    showPhoneNumberError && !isValidContactNumberLength(formState.phoneNumber);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-gray-700 bg-gray-900/70 px-8 py-6 text-sm text-gray-300 backdrop-blur-sm">
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[360px,1fr]">
        <section className="overflow-hidden rounded-3xl border border-gray-700/60 bg-gradient-to-br from-gray-900 via-gray-900 to-slate-950 text-white shadow-2xl">
          <div className="h-28 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />
          <div className="px-6 pb-6 -mt-14">
            <div className="flex items-end justify-between gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-gray-900 bg-gradient-to-br from-slate-700 to-slate-900 text-2xl font-bold text-white shadow-xl">
                {displayedImage ? (
                  <img
                    src={displayedImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{createInitials(profile?.name, profile?.email)}</span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-2xl font-bold text-white">
                {profile?.name || cachedUser?.name || "Your profile"}
              </p>
              <p className="text-sm text-gray-300">{profile?.email}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  {role.replace("_", " ")}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  {String(profile?.status || "active").toLowerCase()}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-gray-300">
              <div className="rounded-2xl border border-gray-800 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Contact Number
                </p>
                <p className="mt-2 font-medium text-white">
                  {profile?.contactNumber || "Not added yet"}
                </p>
              </div>
              {isBasicUser && (
                <div className="rounded-2xl border border-gray-800 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Address
                  </p>
                  <p className="mt-2 font-medium text-white">
                    {profile?.address || "Not added yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:text-white">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-500">
              Profile Settings
            </p>
            <h1 className="mt-2 text-3xl font-bold">Manage your account</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Update your personal information, replace your profile image, or
              remove it entirely. Changes apply only to your own account.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Full Name
                </span>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  placeholder="Your full name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email Address
                </span>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-400"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Contact Number
                </span>
                <div className="grid gap-4 lg:grid-cols-[minmax(320px,360px),minmax(0,1fr)]">
                  <div className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Country Code
                    </span>
                    <div className="relative" ref={countryDropdownRef}>
                      <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-gray-700 dark:bg-slate-950">
                        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-100 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 dark:text-gray-100">
                          {selectedCountry.label} {selectedCountry.dialCode}
                        </div>
                        <div className="relative">
                          <input
                            ref={countrySearchInputRef}
                            type="text"
                            value={countryQuery}
                            onChange={(event) => {
                              setCountryQuery(event.target.value);
                              setIsCountryDropdownOpen(true);
                            }}
                            onFocus={() => setIsCountryDropdownOpen(true)}
                            className="w-full border-0 bg-white px-4 py-3.5 pr-36 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:bg-slate-950 dark:text-gray-100 dark:placeholder:text-gray-500"
                            placeholder="Search country or code"
                            aria-label="Search country"
                          />
                          <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
                            <button
                              type="button"
                              onClick={handleClearCountrySearch}
                              className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm transition ${
                                countryQuery
                                  ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                              }`}
                              aria-label="Clear country search"
                              title="Clear search"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCountryDropdownOpen((current) => !current);
                                countrySearchInputRef.current?.focus();
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                              aria-label="Open country list"
                              title="Open country list"
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 7.5L10 12.5L15 7.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {isCountryDropdownOpen && (
                        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-slate-900/10 dark:border-gray-700 dark:bg-slate-900 dark:shadow-black/30">
                          <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Search results
                          </div>
                          {filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.dialCode}`}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-900 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              <span className="truncate pr-3 font-medium">
                                {country.label}
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {country.dialCode}
                              </span>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              No countries found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Number
                    </span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formState.phoneNumber}
                      onChange={handlePhoneNumberChange}
                      onBlur={() =>
                        setShowPhoneNumberError(
                          !isValidContactNumberLength(formState.phoneNumber),
                        )
                      }
                      className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm outline-none transition dark:bg-slate-950 dark:text-white ${
                        phoneNumberHasError
                          ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700"
                      }`}
                      placeholder="1512 3456789"
                      inputMode="tel"
                    />
                    {phoneNumberHasError ? (
                      <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                        Enter a valid number with 6 to 15 digits.
                      </p>
                    ) : null}
                  </label>
                </div>
              </label>

              {isBasicUser && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Address
                  </span>
                  <input
                    type="text"
                    name="address"
                    value={formState.address}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    placeholder="Add your address"
                  />
                </label>
              )}
            </div>

            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-950/50">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Profile Image</h2>
                  <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
                    Upload a square image for the best result. Supported files
                    must be images and under 5MB.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {displayedImage ? "Replace Image" : "Upload Image"}
                  </label>

                  {(displayedImage || selectedFile) && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                    >
                      Delete Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your login session remains protected by secure cookies. Profile
                changes update only your own visible account details.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
