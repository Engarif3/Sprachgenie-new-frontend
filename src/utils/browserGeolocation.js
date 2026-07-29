// Shared by Register.jsx (registration signup) and App.jsx (general visitor
// tracking, gated behind VisitorLocationConsent) so both request precise
// location the same way instead of each keeping its own copy.
export const requestBrowserGeolocation = ({
  timeout = 15000,
  enableHighAccuracy = true,
} = {}) => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy:
            typeof position.coords.accuracy === "number"
              ? position.coords.accuracy
              : null,
          capturedAt: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0,
      },
    );
  });
};
