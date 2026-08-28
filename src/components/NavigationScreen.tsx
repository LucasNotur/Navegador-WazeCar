import React, { useEffect, useState, useRef } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary, RenderingType } from '@vis.gl/react-google-maps';
import { StatusBar } from './StatusBar';
import { navigationMapStyle } from '../mapStyle';
import { ServiceOrder } from '../types';
import { getUserLocation, updateCachedLocation, getCachedLocation } from '../utils/geolocation';
import { NavigationCameraController } from '../utils/navigationCamera';

export const NavigationScreen: React.FC<{ 
  onStop: () => void;
  onAddStop?: () => void;
  onTripComplete?: () => void;
  currentOS?: ServiceOrder | null;
}> = ({ onStop, onAddStop, onTripComplete, currentOS }) => {
  const routesLibrary = useMapsLibrary('routes');
  const map = useMap();

  // Routing State
  const [activeRoute, setActiveRoute] = useState<google.maps.DirectionsRoute | null>(null);
  const [altRoute, setAltRoute] = useState<google.maps.DirectionsRoute | null>(null);
  
  // Traffic Alert State
  const [alertState, setAlertState] = useState<'hidden' | 'expanded' | 'collapsed'>('hidden');
  const [timeSaved, setTimeSaved] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  
  // Demo / Sim Mode State
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geometryLibrary = useMapsLibrary('geometry');
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [userHeading, setUserHeading] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(getCachedLocation());
  const navCameraRef = useRef<NavigationCameraController | null>(null);

  // Initialize and manage NavigationCameraController
  useEffect(() => {
    if (!map) return;
    
    if (!navCameraRef.current) {
      navCameraRef.current = new NavigationCameraController(map, { tilt: 65, zoom: 19 });
      
      navCameraRef.current.onPositionUpdateCallback = (pos, heading, speed) => {
        setUserLocation(pos);
        updateCachedLocation(pos);
        setUserHeading(heading);
        
        if (speed !== null && !isNaN(speed) && speed >= 0) {
          setCurrentSpeed(Math.round(speed * 3.6));
        } else {
          setCurrentSpeed(0);
        }
      };
      
      const cached = getCachedLocation();
      if (cached) {
         navCameraRef.current.setInitialPosition(cached);
         map.panTo(cached); // Force map to move immediately
         
         if (currentOS && geometryLibrary) {
            try {
              const initialHeading = geometryLibrary.spherical.computeHeading(cached, currentOS.location);
              navCameraRef.current.setInitialHeading(initialHeading);
            } catch (e) {}
         }
      }
      
      navCameraRef.current.start();
    }
  }, [map, currentOS, geometryLibrary]);

  useEffect(() => {
    return () => {
      if (navCameraRef.current) {
         navCameraRef.current.stop();
      }
    };
  }, []);
  
  useEffect(() => {
    if (navCameraRef.current) {
      navCameraRef.current.isFollowing = isFollowingUser;
    }
  }, [isFollowingUser]);

  const [currentSpeed, setCurrentSpeed] = useState<number | null>(0);
  const [speedLimit, setSpeedLimit] = useState<number>(40);
  const [gpsSignal, setGpsSignal] = useState<boolean>(true);
  const [isOverspeeding, setIsOverspeeding] = useState<boolean>(false);
  const overspeedAlertedRef = useRef<boolean>(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [showSettingsToast, setShowSettingsToast] = useState<boolean>(false);
  const [showRangeLayer, setShowRangeLayer] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [isArrivalPhase, setIsArrivalPhase] = useState<boolean>(false);

  // Real Arrival Phase Detection
  useEffect(() => {
    if (!userLocation || !currentOS || !geometryLibrary) return;
    try {
      const dist = geometryLibrary.spherical.computeDistanceBetween(userLocation, currentOS.location);
      if (dist <= 200 && !isArrivalPhase) {
        setIsArrivalPhase(true);
      } else if (dist > 200 && isArrivalPhase) {
        setIsArrivalPhase(false);
      }
    } catch (e) {
      // ignore
    }
  }, [userLocation, currentOS, geometryLibrary, isArrivalPhase]);

  const handleFinish = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinish = () => {
    setShowFinishConfirm(false);
    if (onTripComplete) {
      onTripComplete();
    } else {
      onStop();
    }
  };

  const handleSettings = () => {
    setShowSettingsToast(true);
    setTimeout(() => setShowSettingsToast(false), 2000);
  };


  useEffect(() => {
    if (!gpsSignal || currentSpeed === null) {
      setIsOverspeeding(false);
      overspeedAlertedRef.current = false;
      return;
    }

    // Overspeed logic with 3 km/h tolerance
    const TOLERANCE = 3;
    const overspeed = currentSpeed > (speedLimit + TOLERANCE);
    setIsOverspeeding(overspeed);

    // Haptic/audio alert on threshold crossed
    if (overspeed && !overspeedAlertedRef.current) {
      overspeedAlertedRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Short warning pattern
      }
    } else if (!overspeed) {
      overspeedAlertedRef.current = false;
    }
  }, [currentSpeed, speedLimit, gpsSignal]);

  const [realRoutePath, setRealRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const lastRecalcTime = useRef<number>(0);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, arrivalTime: string} | null>(null);

// Route deviation detection
  useEffect(() => {
    if (!realRoutePath || !userLocation || !geometryLibrary || !window.google) return;
    
    // Throttle checks
    const now = Date.now();
    if (now - lastRecalcTime.current < 5000) return; // wait at least 5s between recalcs

    try {
      const point = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
      const poly = new window.google.maps.Polyline({ path: realRoutePath });
      
      // 0.0005 degrees is roughly 50 meters
      const isOnRoute = geometryLibrary.poly.isLocationOnEdge(point, poly, 0.0005);
      
      if (!isOnRoute) {
        console.log("Off route detected! Recalculating...");
        lastRecalcTime.current = now;
        setRealRoutePath(null); // This clears the current route and triggers fetchRoute
      }
    } catch (e) {
      console.warn("Error checking route deviation:", e);
    }
  }, [userLocation, realRoutePath, geometryLibrary]);

  // Fetch real route using Routes API v2
  useEffect(() => {
    if (!userLocation || !currentOS || !geometryLibrary || realRoutePath) return;

    let isMounted = true;
    const fetchRoute = async () => {

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("No Google Maps API key found in env vars for Routes API.");
        return;
      }
      
      const body = {
        origin: { location: { latLng: { latitude: userLocation.lat, longitude: userLocation.lng } } },
        destination: { location: { latLng: { latitude: currentOS.location.lat, longitude: currentOS.location.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE"
      };
      
      try {
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error(`Routes API request failed: ${response.status}`);
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0 && isMounted) {
          const route = data.routes[0];
          const path = geometryLibrary.encoding.decodePath(route.polyline.encodedPolyline);
          setRealRoutePath(path.map(p => ({ lat: p.lat(), lng: p.lng() })));
          
          const distKm = (route.distanceMeters / 1000).toFixed(1);
          const durSecs = parseInt(route.duration.replace('s', ''));
          const durMins = Math.round(durSecs / 60);
          const arrivalDate = new Date(Date.now() + durSecs * 1000);
          const arrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          setRouteInfo({
            distance: `${distKm} km`,
            duration: durMins > 60 ? `${Math.floor(durMins/60)} hr ${durMins%60} min` : `${durMins} min`,
            arrivalTime: arrivalStr
          });
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }


    };
    fetchRoute();

    return () => { isMounted = false; };
  }, [userLocation, currentOS, geometryLibrary, realRoutePath]);

  // Periodic Traffic Checking (Real Engine Logic) - Removed mock
  useEffect(() => {
    const checkTraffic = () => {
      if (Date.now() < cooldownUntil) return; // In cooldown period
    };
    const interval = setInterval(checkTraffic, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [cooldownUntil, alertState]);

  // Auto-shrink behavior: After 15s without interaction, shrink to collapsed badge
  useEffect(() => {
    if (alertState === 'expanded') {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => {
        setAlertState('collapsed');
      }, 15000);
    } else {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    }
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [alertState]);

  // --- Actions ---

  const handleSimulateJam = () => {
    setAlertState('expanded');
    setTimeSaved(45); // specific requested value for mockup
  };

  const handleAcceptAlt = () => {
    
    if (altRoute) {
      setActiveRoute(altRoute);
      setAltRoute(null);
    }
    setAlertState('hidden');
  };

  const handleDismissAlert = () => {
    setCooldownUntil(Date.now() + 5 * 60 * 1000);
    setAlertState('hidden');
    setAltRoute(null);
  };

  // --- Dynamic Stats Computation ---
  
  let distanceText = '... km';
  let durationVal = '... min';
  let arrivalTime = '--:--';

  if (routeInfo) {
    distanceText = routeInfo.distance;
    durationVal = routeInfo.duration;
    arrivalTime = routeInfo.arrivalTime;
  }

  if (!userLocation) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#05070A] flex flex-col items-center justify-center animate-fade-in z-50">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#0A84FF] rounded-full animate-spin mb-6" />
        <p className="text-white font-medium text-[17px] opacity-80">Obtendo sua localização para iniciar rota...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-[#05070A] flex flex-col overflow-hidden animate-fade-in">
      
      {/* Dev Simulator Button */}
      <button 
        onClick={handleSimulateJam}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-[#FF453A]/80 hover:bg-[#FF453A] text-white font-bold rounded-full text-[12px] shadow-lg transition-opacity opacity-0 hover:opacity-100"
      >
        Trigger Traffic Jam (Test)
      </button>

      {/* Map Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Map
          // mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
          // renderingType={RenderingType.VECTOR}
          mapTypeId={"roadmap"}
          defaultCenter={userLocation!}
          defaultZoom={19}
          disableDefaultUI={true}
          styles={navigationMapStyle}
          gestureHandling="greedy"
          onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
          onDrag={() => { setIsFollowingUser(false); }}
        >
          {/* Navigation Elements */}
          {realRoutePath ? (
            <ColoredPolyline path={realRoutePath} color="#0A84FF" />
          ) : userLocation && currentOS ? (
            <ColoredPolyline path={[userLocation, currentOS.location]} color="#8E8E93" />
          ) : null}
          
          {/* Vehicle Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation} zIndex={100}>
              <div className="relative flex items-center justify-center">
                {isArrivalPhase && (
                  <div className="absolute w-24 h-24 bg-[#0A84FF]/20 rounded-full blur-[8px] animate-pulse pointer-events-none"></div>
                )}
                <div className="w-10 h-10 bg-[#0A84FF] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] border-2 border-white/20 z-10 relative" style={{ transform: `rotate(${isFollowingUser ? 0 : userHeading}deg)`, transition: "transform 0.3s ease-out" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L4 20L12 17L20 20L12 2Z" />
                  </svg>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Destination Pin */}
          {currentOS && (
            <AdvancedMarker position={currentOS.location} zIndex={40}>
               <div className="relative w-10 h-10 bg-[#FF9F0A] rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-[#1C1C1E] -translate-y-[20px]">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                   <circle cx="12" cy="10" r="3" />
                 </svg>
               </div>
            </AdvancedMarker>
          )}

          {/* Range Isochrone Polygon */}
          {showRangeLayer && (
            <>
              <RangePolygon 
                path={[
                  { lat: 37.785, lng: -122.430 },
                  { lat: 37.788, lng: -122.420 },
                  { lat: 37.781, lng: -122.412 },
                  { lat: 37.772, lng: -122.405 },
                  { lat: 37.765, lng: -122.415 },
                  { lat: 37.760, lng: -122.425 },
                  { lat: 37.768, lng: -122.435 },
                  { lat: 37.775, lng: -122.440 },
                ]}
                color="#8B0000"
              />
              {/* Range Distance Badge */}
              <AdvancedMarker position={{ lat: 37.781, lng: -122.412 }} zIndex={45}>
                 <div className="bg-[#8B0000]/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20 shadow-sm flex items-center justify-center -translate-y-4 translate-x-4">
                   <span className="text-white font-bold text-[12px]">12 km</span>
                 </div>
              </AdvancedMarker>
            </>
          )}

          {/* Legacy elements removed */}

          {/* Discovery Layer: Multiple Charging Stations */}
          {showRangeLayer && (
             <>
               {mapZoom < 12.5 ? (
                 // Clustered View
                 <AdvancedMarker position={{ lat: 37.7750, lng: -122.4160 }} zIndex={30}>
                    <div 
                      className="relative w-10 h-10 bg-[#FFD60A] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)] border-2 border-[#1C1C1E] cursor-pointer"
                      onClick={() => console.log("Station selected")}
                    >
                      <span className="text-[#1C1C1E] font-bold text-[15px]">+4</span>
                    </div>
                 </AdvancedMarker>
               ) : (
                 // Individual Pins View
                 [
                   { lat: 37.7760, lng: -122.4130 },
                   { lat: 37.7725, lng: -122.4180 },
                   { lat: 37.7790, lng: -122.4210 },
                   { lat: 37.7730, lng: -122.4120 },
                 ].map((pos, idx) => (
                   <AdvancedMarker key={idx} position={pos} zIndex={30}>
                      <div 
                        className="relative w-7 h-7 bg-[#FFD60A] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-[#1C1C1E] cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => console.log("Station selected")}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#1C1C1E" />
                        </svg>
                      </div>
                   </AdvancedMarker>
                 ))
               )}
             </>
          )}

        </Map>
      </div>

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#05070A]/90 to-transparent pointer-events-none z-0" />
      
      <StatusBar />
      
      {/* Top Arrival Card */}
      {isArrivalPhase && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <div className="bg-white rounded-[20px] shadow-xl px-5 py-3 flex items-center gap-3 border border-black/5 min-w-[140px] justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
            <span className="text-black font-bold text-2xl tracking-tight"> m</span>
          </div>
        </div>
      )}
      

      {/* Top Right Floating Buttons */}
      <div className="absolute top-16 right-4 z-10 pointer-events-auto flex flex-col gap-3">
        {/* Center on Vehicle Button */}
        <MapCenterButton userLocation={userLocation} onRecenter={() => {
          setIsFollowingUser(true);
          if (map && userLocation) {
             map.moveCamera({ center: userLocation, heading: userHeading, tilt: 65, zoom: 19 });
          }
        }} />
      </div>

      {/* Traffic Alert Card - Expanded */}
      {alertState === 'expanded' && (
        <div 
          className="absolute top-16 left-4 right-4 bg-[#1C1C1E] rounded-[24px] p-5 flex flex-col gap-4 shadow-2xl z-10 animate-fade-in pointer-events-auto border border-white/5"
          onMouseEnter={() => {
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                <path d="M19 16l-1.5-4.5A2.5 2.5 0 0 0 15 9.5H9a2.5 2.5 0 0 0-2.5 2.5L5 16" />
                <circle cx="7.5" cy="16.5" r="1.5" fill="#8E8E93" />
                <circle cx="16.5" cy="16.5" r="1.5" fill="#8E8E93" />
              </svg>
            </div>
            <span className="text-white text-[19px] font-bold tracking-tight">Traffic jam</span>
          </div>
          
          <div className="text-white text-[16px] -mt-1 ml-1">Change the route?</div>
          
          <div className="flex items-center gap-3 w-full mt-1">
            <button 
              className="flex-1 bg-[#30D158] text-white font-bold text-[16px] py-3.5 rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              onClick={handleAcceptAlt}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              -{timeSaved} min
            </button>
            <button 
              className="flex-1 bg-[#FF453A] text-white font-bold text-[16px] py-3.5 rounded-[14px] flex items-center justify-center active:scale-[0.98] transition-transform"
              onClick={handleDismissAlert}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Traffic Alert Card - Collapsed Badge */}
      {alertState === 'collapsed' && (
        <div className="absolute top-16 right-4 z-10 animate-fade-in pointer-events-auto">
          <button 
            onClick={() => setAlertState('expanded')}
            className="bg-[#1C1C1E] border border-white/10 shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-2 transition-transform active:scale-95"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse" />
            <span className="text-white text-[14px] font-bold whitespace-nowrap">Alternative: -{timeSaved} min</span>
          </button>
        </div>
      )}

      {/* Speed Indicators (Bottom-Left) */}
      <div className="absolute bottom-[260px] left-4 z-10 flex flex-col gap-3 pointer-events-none items-center">
        {/* Speed Limit */}
        <div className={`w-[52px] h-[52px] bg-white rounded-full border-[5px] flex flex-col items-center justify-center shadow-lg transition-colors duration-200 ${!gpsSignal ? 'border-[#8E8E93]' : 'border-[#FF3B30]'}`}>
          <span className={`text-[20px] font-bold tracking-tight ${!gpsSignal ? 'text-[#8E8E93]' : 'text-black'}`}>
            {!gpsSignal ? '--' : speedLimit}
          </span>
        </div>
        
        {/* Current Speed Gauge */}
        <div className={`w-[60px] h-[64px] flex flex-col items-center justify-center rounded-[16px] backdrop-blur-md transition-colors duration-200 shadow-xl ${isOverspeeding ? 'bg-[#FF3B30]/90 border border-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.4)]' : 'bg-[#1C1C1E]/80 border border-white/10'}`}>
          <span className="text-white text-[28px] leading-none font-bold tracking-tight drop-shadow-md mt-1">
            {!gpsSignal || currentSpeed === null ? "--" : currentSpeed}
          </span>
          <span className="text-white/60 text-[11px] font-bold tracking-wider mt-0.5">
            km/h
          </span>
        </div>
      </div>

      {/* Bottom Sheet */}
      {isPanelExpanded ? (
        <div className="absolute top-[30%] bottom-0 left-0 right-0 bg-[#1C1C1E] rounded-t-[24px] px-6 pt-6 pb-8 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-20 pointer-events-auto">
           <div className="flex justify-between items-center mb-6">
              <span className="text-white text-[24px] font-bold">Detalhes da Rota</span>
              <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform" onClick={() => setIsPanelExpanded(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto mb-4 -mr-2 pr-2 text-white">
             {currentOS && (
               <div className="bg-[#2C2C2E] p-4 rounded-xl mb-4">
                  <h3 className="font-bold text-[18px] mb-1">{currentOS.client}</h3>
                  <p className="text-[#8E8E93] text-[14px] mb-3">{currentOS.address}</p>
                  
                  <div className="bg-[#1C1C1E] p-3 rounded-lg border border-[#3A3A3C]">
                    <span className="text-[#0A84FF] text-[12px] font-bold uppercase tracking-wider block mb-1">Problema</span>
                    <p className="text-[14px] leading-relaxed">{currentOS.description}</p>
                  </div>
               </div>
             )}
             
             {/* Report Action */}
             <div className="mt-4 flex gap-3">
               <button className="flex-1 bg-[#FF9F0A] hover:bg-orange-600 rounded-xl py-3 flex flex-col items-center justify-center font-bold text-white shadow-lg active:scale-95 transition-transform">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                   <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                   <line x1="12" y1="9" x2="12" y2="13"/>
                   <line x1="12" y1="17" x2="12.01" y2="17"/>
                 </svg>
                 Reportar Alerta
               </button>
             </div>
           </div>

           <div className="bg-white/5 rounded-[20px] p-4 flex items-center gap-4 mb-auto">
             <div className="relative">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M9 21v-5a4 4 0 0 1 4-4h8" />
                 <polyline points="16 7 21 12 16 17" />
               </svg>
             </div>
             <div className="flex items-baseline gap-2">
               <span className="text-white text-[28px] font-bold tracking-tight leading-none">
                 {distanceText.split(' ')[0] || '...'}
               </span>
               <span className="text-[#AEAEB2] text-[18px] font-medium">
                 {distanceText.split(' ')[1] || 'km'}
               </span>
             </div>
             <div className="text-white text-[18px] font-medium ml-2 border-l border-white/20 pl-4 py-1">
               {currentOS ? currentOS.client : 'Destino'}
             </div>
           </div>

           <div className="flex justify-between items-center mt-6 px-4 shrink-0">
              <div className="flex flex-col items-center gap-2">
                 <button 
                   className="w-[60px] h-[60px] rounded-full bg-[#2C2C2E] flex items-center justify-center active:scale-95 transition-transform"
                   onClick={() => onAddStop && onAddStop()}
                 >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                 </button>
                 <span className="text-[#8E8E93] text-[14px] font-medium">Add Parada</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <button 
                   className="w-[72px] h-[72px] rounded-full bg-[#34C759] flex items-center justify-center active:scale-95 transition-transform shadow-[0_4px_15px_rgba(52,199,89,0.4)]" 
                   onClick={() => onTripComplete && onTripComplete()}
                 >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                 </button>
                 <span className="text-[#8E8E93] text-[14px] font-medium">Cheguei</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <button 
                   className="w-[60px] h-[60px] rounded-full bg-[#FF453A] flex items-center justify-center active:scale-95 transition-transform shadow-[0_4px_15px_rgba(255,69,58,0.4)]"
                   onClick={handleFinish}
                 >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <line x1="18" y1="6" x2="6" y2="18" />
                       <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                 </button>
                 <span className="text-[#8E8E93] text-[14px] font-medium">Cancelar</span>
              </div>
           </div>
        </div>
      ) : (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-[#1C1C1E] rounded-t-[24px] px-6 pt-6 pb-8 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-20 pointer-events-auto cursor-pointer"
          onClick={() => setIsPanelExpanded(true)}
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full"></div>
                    <div className="flex justify-between items-center mb-1 mt-2">
           <div className="flex items-center gap-4">
             <div className="relative">
               {isArrivalPhase ? (
                 <div className="w-10 h-10 rounded-full border-[3px] border-[#0A84FF] flex items-center justify-center bg-[#0A84FF]/10">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
                     <circle cx="6.5" cy="16.5" r="2.5" />
                     <circle cx="17.5" cy="16.5" r="2.5" />
                   </svg>
                 </div>
               ) : (
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD60A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M7 21v-5a4 4 0 0 1 4-4h5" />
                   <polygon points="21 4 16 12 20 12 19 18 24 9 20 9 21 4" stroke="none" fill="#FFD60A" />
                 </svg>
               )}
             </div>
             <div className="flex items-baseline gap-1.5">
               <span className="text-white text-[34px] font-bold tracking-tight leading-none">
                 {distanceText.split(' ')[0] || '...'}
               </span>
               <span className="text-[#AEAEB2] text-[20px] font-medium">
                 {distanceText.split(' ')[1] || 'km'}
               </span>
             </div>
           </div>
           <button className="p-2 text-[#8E8E93] active:scale-95 transition-transform" onClick={onStop}>
             <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="6 9 12 15 18 9" />
             </svg>
           </button>
         </div>

         <div className="text-[#8E8E93] text-[18px] font-medium mb-7 ml-[56px] whitespace-nowrap overflow-hidden text-ellipsis">
           {currentOS ? currentOS.address : "Destino"}
         </div>

         <div className="relative w-full h-[5px] bg-[#1E3A5F] rounded-full mb-8 flex items-center">
           <div className={`absolute left-0 top-0 bottom-0 bg-white rounded-l-full transition-all duration-500 ${isArrivalPhase ? 'w-[98%]' : 'w-[40%]'}`} />
           
           <div className={`absolute ${isArrivalPhase ? 'left-[98%]' : 'left-[40%]'} -translate-x-1/2 w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-500`}>
             <svg width="8" height="10" viewBox="0 0 10 12" fill="#1C1C1E" className="ml-0.5">
               <path d="M0 12V0L10 6L0 12Z" />
             </svg>
           </div>
           
           <div className="absolute right-0 w-[14px] h-[14px] bg-[#FF453A] rounded-full border-[3px] border-[#1C1C1E] z-10 translate-x-1/2" />
         </div>

         <div className="grid grid-cols-3 gap-4">
           <div className="flex flex-col items-center">
             <div className="flex items-baseline gap-1">
               <span className="text-white text-[26px] font-bold tracking-tight">
                 {distanceText.split(' ')[0] || '...'}
               </span>
               <span className="text-white text-[15px] font-medium">
                 {distanceText.split(' ')[1] || 'km'}
               </span>
             </div>
             <span className="text-[#8E8E93] text-[13px] font-medium mt-0.5">Distance</span>
           </div>

           <div className="flex flex-col items-center">
             <div className="flex items-baseline gap-1">
               <span className="text-white text-[26px] font-bold tracking-tight">
                 {durationVal.split(' ')[0] || '...'}
               </span>
               <span className="text-white text-[15px] font-medium">
                 {durationVal.split(' ')[1] || 'min'}
               </span>
             </div>
             <span className="text-[#8E8E93] text-[13px] font-medium mt-0.5">Time</span>
           </div>

           <div className="flex flex-col items-center">
             <div className="flex items-baseline gap-1">
               <span className="text-white text-[26px] font-bold tracking-tight">{arrivalTime}</span>
             </div>
             <span className="text-[#8E8E93] text-[13px] font-medium mt-0.5">Arrival</span>
           </div>
         </div>

      </div>
      )}
      {/* Modals & Overlays */}
      {showFinishConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-[340px] shadow-2xl">
            <h3 className="text-white text-[20px] font-bold mb-2">End Navigation?</h3>
            <p className="text-[#8E8E93] text-[15px] mb-8">Are you sure you want to cancel the current trip? Your route progress will be lost.</p>
            <div className="flex gap-4">
              <button 
                className="flex-1 bg-[#2C2C2E] text-white font-bold text-[16px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
                onClick={() => setShowFinishConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-[#FF453A] text-white font-bold text-[16px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_4px_15px_rgba(255,69,58,0.4)]"
                onClick={confirmFinish}
              >
                End Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsToast && (
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 bg-[#2C2C2E]/90 backdrop-blur-md rounded-full px-5 py-3 z-50 shadow-2xl animate-fade-in pointer-events-none">
          <span className="text-white font-medium text-[15px]">Settings coming soon</span>
        </div>
      )}

    </div>
  );
};


// --- Map Helper Components ---

const ColoredPolyline = ({ path, color, zIndex = 1 }: { path: google.maps.LatLngLiteral[], color: string, zIndex?: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const coreLine = new google.maps.Polyline({
      path,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 6,
      map,
      zIndex: zIndex + 2,
    });

    const midGlow = new google.maps.Polyline({
      path,
      strokeColor: color,
      strokeOpacity: 0.5,
      strokeWeight: 12,
      map,
      zIndex: zIndex + 1,
    });

    const outerGlow = new google.maps.Polyline({
      path,
      strokeColor: color,
      strokeOpacity: 0.2,
      strokeWeight: 20,
      map,
      zIndex,
    });

    return () => {
      coreLine.setMap(null);
      midGlow.setMap(null);
      outerGlow.setMap(null);
    };
  }, [map, path, color, zIndex]);
  
  return null;
};

const MapCenterButton = ({ userLocation, onRecenter }: { userLocation: { lat: number, lng: number } | null, onRecenter: () => void }) => {
  return (
    <button 
      onClick={onRecenter}
      className="w-12 h-12 rounded-full shadow-lg bg-white flex items-center justify-center active:scale-95 transition-transform border border-black/10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  );
};

const RangePolygon = ({ path, color }: { path: google.maps.LatLngLiteral[], color: string }) => {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map) return;
    
    polygonRef.current = new google.maps.Polygon({
      paths: path,
      fillColor: color,
      fillOpacity: 0.35,
      strokeColor: color,
      strokeOpacity: 0,
      strokeWeight: 0,
      map,
      clickable: false,
    });

    return () => {
      if (polygonRef.current) polygonRef.current.setMap(null);
    };
  }, [map, path, color]);
  
  return null;
};
const SmartAPIPath = ({ route, isAlternative }: { route: google.maps.DirectionsRoute, isAlternative?: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !route) return;
    
    const lines: google.maps.Polyline[] = [];
    
    route.legs[0].steps.forEach((step) => {
      // Speed in km/h = (meters / 1000) / (seconds / 3600)
      const speedKmh = (step.distance.value / 1000) / (step.duration.value / 3600);
      
      // Speed-based color segmentation
      let color = '#0A84FF'; // Default / Fast
      if (speedKmh < 25) color = '#FF453A'; // Congested / Red
      else if (speedKmh < 50) color = '#FFD60A'; // Moderate / Yellow
      
      // Alternative routes are forced to green to stand out as the solution
      if (isAlternative) {
        color = '#30D158'; 
      }

      const coreLine = new google.maps.Polyline({
        path: step.path,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map,
        zIndex: isAlternative ? 3 : 2,
      });
      
      const glowLine = new google.maps.Polyline({
        path: step.path,
        strokeColor: color,
        strokeOpacity: 0.3,
        strokeWeight: 14,
        map,
        zIndex: isAlternative ? 2 : 1,
      });
      
      lines.push(coreLine, glowLine);
    });
    
    return () => {
      lines.forEach(l => l.setMap(null));
    };
  }, [map, route, isAlternative]);
  
  return null;
};
