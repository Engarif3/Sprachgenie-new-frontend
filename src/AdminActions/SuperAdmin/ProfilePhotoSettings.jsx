import { useEffect, useState } from "react";
import api from "../../axios";
import PageHeader from "../../components/UI/PageHeader";

const ProfilePhotoSettings = () => {
  const [allowImageUploadAdmin, setAllowImageUploadAdmin] = useState(true);
  const [allowImageUploadBasicUser, setAllowImageUploadBasicUser] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/profile-settings");
      const data = response.data?.data;
      setAllowImageUploadAdmin(data?.allowImageUploadAdmin ?? true);
      setAllowImageUploadBasicUser(data?.allowImageUploadBasicUser ?? true);
    } catch (err) {
      console.error("Error fetching profile settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch("/profile-settings", {
        allowImageUploadAdmin,
        allowImageUploadBasicUser,
      });
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving profile settings:", err);
      setError(
        err.response?.data?.message || "Failed to save settings",
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <PageHeader
            title="Profile Photo Settings"
            subtitle="Control whether admins and basic users can upload a custom profile photo, or must choose from the preset avatars. Super admins can always upload, regardless of these settings."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200">
            {success}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm space-y-8 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-none">
          {loading ? (
            <p className="text-slate-500 dark:text-gray-400">
              Loading settings...
            </p>
          ) : (
            <>
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowImageUploadAdmin}
                  onChange={(e) => setAllowImageUploadAdmin(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-orange-500 cursor-pointer"
                />
                <span>
                  <span className="block text-slate-800 dark:text-white font-semibold">
                    Allow admins to upload custom profile photos
                  </span>
                  <span className="block text-sm text-slate-500 dark:text-gray-400 mt-1">
                    When turned off, every admin's profile picture falls back
                    to their chosen preset avatar (or their initials if
                    they've never picked one) — this doesn't delete anyone's
                    uploaded photo, it just stops showing it. Turning it back
                    on immediately restores it.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowImageUploadBasicUser}
                  onChange={(e) =>
                    setAllowImageUploadBasicUser(e.target.checked)
                  }
                  className="mt-1 h-5 w-5 accent-orange-500 cursor-pointer"
                />
                <span>
                  <span className="block text-slate-800 dark:text-white font-semibold">
                    Allow basic users to upload custom profile photos
                  </span>
                  <span className="block text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Same behavior as above, applied independently to basic
                    user accounts.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoSettings;
