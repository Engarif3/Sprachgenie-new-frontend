import React, { useEffect, useState } from "react";
import api from "../../axios";

const ProfilePhotoSettings = () => {
  const [allowImageUpload, setAllowImageUpload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/profile-settings");
      setAllowImageUpload(response.data?.data?.allowImageUpload ?? true);
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
      await api.patch("/profile-settings", { allowImageUpload });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-2">
            Profile Photo Settings
          </h1>
          <p className="text-gray-400">
            Control whether users can upload a custom profile photo, or must
            choose from the preset avatars.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
            {success}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
          {loading ? (
            <p className="text-gray-400">Loading settings...</p>
          ) : (
            <>
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowImageUpload}
                  onChange={(e) => setAllowImageUpload(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-orange-500 cursor-pointer"
                />
                <span>
                  <span className="block text-white font-semibold">
                    Allow users to upload custom profile photos
                  </span>
                  <span className="block text-sm text-gray-400 mt-1">
                    When turned off, every user's profile picture falls back
                    to their chosen preset avatar (or their initials if
                    they've never picked one) — this doesn't delete anyone's
                    uploaded photo, it just stops showing it. Turning it back
                    on immediately restores it.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
