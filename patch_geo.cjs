const fs = require('fs');
const newContent = `
export const getFallbackLocation = async (): Promise<{ lat: number; lng: number }> => {
  try {
    const res1 = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (res1.ok) {
      const data = await res1.json();
      if (data.latitude && data.longitude) {
        return { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      }
    }
  } catch (e) {
    console.warn("geojs fallback failed", e);
  }
  try {
    const res2 = await fetch('https://ipapi.co/json/');
    if (res2.ok) {
      const data = await res2.json();
      if (data.latitude && data.longitude) {
        return { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      }
    }
  } catch (e) {
    console.warn("ipapi fallback failed", e);
  }
  return { lat: -23.5505, lng: -46.6333 }; // Sé, SP
};

let cachedLocation: { lat: number; lng: number } | null = null;

export const updateCachedLocation = (loc: { lat: number; lng: number }) => {
  cachedLocation = loc;
  try {
    sessionStorage.setItem('cachedUserLocation', JSON.stringify(loc));
  } catch (e) {}
};

export const getCachedLocation = (): { lat: number; lng: number } | null => {
  if (cachedLocation) return cachedLocation;
  try {
    const stored = sessionStorage.getItem('cachedUserLocation');
    if (stored) {
      cachedLocation = JSON.parse(stored);
      return cachedLocation;
    }
  } catch (e) {}
  return null;
};

export const getUserLocation = (
  onSuccess: (loc: { lat: number; lng: number }) => void,
  onFallbackStart?: () => void
) => {
  const cached = getCachedLocation();
  if (cached) {
    onSuccess(cached);
  }

  let fallbackInvoked = false;
  const invokeFallback = async () => {
    if (cached) return; // Never use IP fallback if we already have a real GPS lock!
    if (fallbackInvoked) return;
    fallbackInvoked = true;
    if (onFallbackStart) onFallbackStart();
    const loc = await getFallbackLocation();
    onSuccess(loc);
  };

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        updateCachedLocation(loc);
        onSuccess(loc);
      },
      (error) => {
        console.warn("Geolocation warning, falling back to IP:", error);
        invokeFallback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  } else {
    invokeFallback();
  }
};
`;
fs.writeFileSync('src/utils/geolocation.ts', newContent.trim());
