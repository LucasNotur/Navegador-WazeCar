export type LocationStatus = 'loading' | 'ready' | 'denied' | 'error';

let cachedLocation: { lat: number; lng: number } | null = null;

export const updateCachedLocation = (loc: { lat: number; lng: number }) => {
  cachedLocation = loc;
  try {
    sessionStorage.setItem('strictUserLocation', JSON.stringify(loc));
  } catch (e) {}
};

export const getCachedLocation = (): { lat: number; lng: number } | null => {
  if (cachedLocation) return cachedLocation;
  try {
    const stored = sessionStorage.getItem('strictUserLocation');
    if (stored) {
      cachedLocation = JSON.parse(stored);
      return cachedLocation;
    }
  } catch (e) {}
  return null;
};

export const getUserLocationStrict = (
  onSuccess: (loc: { lat: number; lng: number }) => void,
  onError: (status: LocationStatus, message: string) => void
) => {
  if (!navigator.geolocation) {
    onError('error', 'Geolocalização não suportada neste navegador.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
      updateCachedLocation(loc);
      onSuccess(loc);
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        onError('denied', 'Permissão de localização negada. Habilite a localização do navegador/dispositivo para iniciar a navegação.');
      } else {
        onError('error', `Não foi possível obter sua localização: ${err.message}`);
      }
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
};
