import React, { useEffect, useState, useMemo } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary, RenderingType } from '@vis.gl/react-google-maps';
import { StatusBar } from './StatusBar';
import { darkMapStyle } from '../mapStyle';

export const RouteScreen: React.FC<{ onBack: () => void, onStartNavigation: () => void }> = ({ onBack, onStartNavigation }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    
    const fetchRoute = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try {
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.polyline.encodedPolyline"
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: 55.7558, longitude: 37.6173 } } },
            destination: { location: { latLng: { latitude: 55.8304, longitude: 49.0661 } } },
            travelMode: "DRIVE"
          })
        });
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          // We need geometry library to decode, but let's just mock it since it's a dummy screen
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRoute();

  }, [routesLibrary, map]);

  const routePath = useMemo(() => {
    if (!directionsResult) return [];
    return directionsResult.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
  }, [directionsResult]);

  // Charging stops mockup derived from route path
  const chargingStops = useMemo(() => {
    if (routePath.length === 0) return [];
    
    const index1 = Math.floor(routePath.length * 0.33);
    const index2 = Math.floor(routePath.length * 0.66);
    
    return [
      { position: routePath[index1], extraTime: "+45 min" },
      { position: routePath[index2], extraTime: "+1.5 hr" },
    ];
  }, [routePath]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden animate-fade-in">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map
          mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
          mapTypeId={"roadmap"}
          defaultCenter={{ lat: 55.7558, lng: 37.6173 }}
          defaultZoom={6}
          disableDefaultUI={true}
          styles={darkMapStyle}
          gestureHandling="greedy"
          renderingType={RenderingType.VECTOR}
        >
          {routePath.length > 0 && <RoutePolyline path={routePath} />}
          
          {/* Origin Marker */}
          {routePath.length > 0 && (
            <AdvancedMarker position={routePath[0]}>
              <div className="w-[18px] h-[18px] bg-white rounded-full border-[4px] border-[#1C1C1E] shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
            </AdvancedMarker>
          )}

          {/* Charging Stops */}
          {chargingStops.map((stop, idx) => (
            <AdvancedMarker key={idx} position={stop.position} zIndex={10}>
              <div className="relative flex flex-col items-center">
                <div className="absolute bottom-full mb-2 bg-[#1C1C1E]/80 backdrop-blur-md px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg">
                  <span className="text-white text-[12px] font-medium tracking-wide">{stop.extraTime}</span>
                </div>
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-[2px] border-[#1C1C1E]">
                  <svg width="10" height="14" viewBox="0 0 14 20" fill="#0A84FF">
                    <path d="M13.5 8.5L7.5 20L8.5 11.5H0.5L6.5 0L5.5 8.5H13.5Z" />
                  </svg>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Destination Marker */}
          {routePath.length > 0 && (
            <AdvancedMarker position={routePath[routePath.length - 1]} zIndex={20}>
              <div className="relative flex flex-col items-center">
                <div className="absolute bottom-full mb-1.5 bg-[#0A84FF] px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                  <span className="text-white text-[13px] font-bold tracking-wide">8.3 hr</span>
                </div>
                <div className="w-9 h-9 flex items-center justify-center">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="#FF453A" stroke="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" fill="white" />
                  </svg>
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </div>

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A0A0A]/90 to-transparent pointer-events-none z-0" />
      <StatusBar />

      {/* Top Buttons */}
      <div className="absolute top-14 left-4 right-4 flex justify-between z-10 pointer-events-none">
        <div 
          className="w-11 h-11 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 transition-transform shadow-lg"
          onClick={onBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="w-11 h-11 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 transition-transform shadow-lg">
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <path d="M13.5 8.5L7.5 20L8.5 11.5H0.5L6.5 0L5.5 8.5H13.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 w-full bg-[#1C1C1E] rounded-t-[24px] shadow-[0_-15px_40px_rgba(0,0,0,0.6)] z-20 flex flex-col px-6 py-6 pb-8">
        
        {/* Line 1 */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[#30D158] font-medium text-[15px] tracking-wide">Faster route</span>
          <div className="flex gap-1">
            <div className="w-[5px] h-[5px] bg-[#8E8E93] rounded-full" />
            <div className="w-[5px] h-[5px] bg-[#8E8E93] rounded-full" />
            <div className="w-[5px] h-[5px] bg-[#8E8E93] rounded-full" />
          </div>
        </div>

        {/* Line 2 */}
        <div className="mb-5">
          <span className="text-white text-[34px] font-bold tracking-tight">8 hr 15 min</span>
        </div>

        {/* Line 3: Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-[#AEAEB2]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="3" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <circle cx="12" cy="19" r="3" />
            </svg>
            <span className="text-[15px] font-medium tracking-wide">820 km</span>
          </div>
          <div className="flex items-center gap-2 text-[#AEAEB2]">
            <svg width="12" height="18" viewBox="0 0 14 20" fill="none">
              <path d="M13.5 8.5L7.5 20L8.5 11.5H0.5L6.5 0L5.5 8.5H13.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span className="text-[15px] font-medium tracking-wide">1 hr 30 min</span>
          </div>
          <div className="flex items-center gap-2 text-[#AEAEB2]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[15px] font-medium tracking-wide">21:45</span>
          </div>
        </div>

        <div className="w-full h-px bg-[rgba(255,255,255,0.08)] mb-6" />

        {/* Line 4: Origin */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="rotate-45">
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
              </svg>
            </div>
            <span className="text-white text-[17px] font-medium">My geoposition</span>
          </div>
          <button className="text-[#8E8E93] shrink-0 active:scale-95 transition-transform p-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
            </svg>
          </button>
        </div>

        {/* Line 5: Destination */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF453A" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
            <span className="text-white text-[17px] font-medium">Kazan</span>
          </div>
          <button className="text-[#8E8E93] shrink-0 p-1 active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Line 6: GO Button */}
        <button 
          className="w-full bg-[#F2F2F2] text-black font-bold text-[18px] tracking-wide py-4 rounded-full active:scale-[0.98] transition-transform shadow-lg shadow-white/5"
          onClick={onStartNavigation}
        >
          GO
        </button>
      </div>
    </div>
  );
};

const RoutePolyline = ({ path }: { path: google.maps.LatLngLiteral[] }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const polyline = new google.maps.Polyline({
      path,
      strokeColor: '#0A84FF',
      strokeOpacity: 1.0,
      strokeWeight: 6,
      map,
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, path]);
  return null;
};

