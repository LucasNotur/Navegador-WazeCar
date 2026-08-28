const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// Move geometryLibrary to top
code = code.replace(/  const geometryLibrary = useMapsLibrary\('geometry'\);\n/g, "");
code = code.replace(
  "  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);",
  "  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);\n  const geometryLibrary = useMapsLibrary('geometry');\n  const [isFollowingUser, setIsFollowingUser] = useState(true);\n  const [userHeading, setUserHeading] = useState(0);\n  const prevLocRef = useRef<{lat: number, lng: number} | null>(null);"
);

const newUseEffect = `
  useEffect(() => {
    let watchId: number;
    let initialLocationSet = false;

    // Fast initial location fetch
    getUserLocation((loc) => {
      if (!initialLocationSet) {
        initialLocationSet = true;
        setUserLocation(loc);
        prevLocRef.current = loc;
        if (map && !simMode) {
          map.moveCamera({ center: loc, heading: userHeading, tilt: 65, zoom: 19 });
        }
      }
    });

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          
          let heading = userHeading;
          if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
            heading = position.coords.heading;
          } else if (prevLocRef.current && geometryLibrary) {
            heading = geometryLibrary.spherical.computeHeading(prevLocRef.current, loc);
          }
          if (heading !== undefined && !isNaN(heading)) {
            setUserHeading(heading);
          }
          prevLocRef.current = loc;

          if (!initialLocationSet) {
            initialLocationSet = true;
          }
          
          // Only update map view if in follow mode and not simulating
          if (isFollowingUser && map && !simMode) {
             map.moveCamera({ center: loc, heading: heading, tilt: 65, zoom: 19 });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map, simMode, isFollowingUser, userHeading, geometryLibrary]);
`;

// Replace the old useEffect
const oldUseEffectRegex = /  useEffect\(\(\) => \{\n    let watchId: number;\n    let initialLocationSet = false;\n[\s\S]*?\}, \[map, simMode\]\);/;
code = code.replace(oldUseEffectRegex, newUseEffect.trim());

// Update MapCenterButton to handle follow mode
const mapCenterButtonRegex = /<MapCenterButton userLocation=\{userLocation\} \/>/;
code = code.replace(mapCenterButtonRegex, `<MapCenterButton userLocation={userLocation} onRecenter={() => {
          setIsFollowingUser(true);
          if (map && userLocation) {
             map.moveCamera({ center: userLocation, heading: userHeading, tilt: 65, zoom: 19 });
          }
        }} />`);

// Update MapCenterButton component signature
code = code.replace(/const MapCenterButton = \(\{ userLocation \}: \{ userLocation: \{ lat: number, lng: number \} \| null \}\) => \{[\s\S]*?className="w-12 h-12/, `const MapCenterButton = ({ userLocation, onRecenter }: { userLocation: { lat: number, lng: number } | null, onRecenter: () => void }) => {
  return (
    <button 
      onClick={onRecenter}
      className="w-12 h-12`);

// Update Map props
const mapPropsRegex = /<Map\n          defaultCenter=\{userLocation \|\| \{ lat: -23\.5505, lng: -46\.6333 \}\}\n          defaultZoom=\{13\}\n          disableDefaultUI=\{true\}\n          styles=\{navigationMapStyle\}\n          gestureHandling="greedy"\n          mapId="DEMO_MAP_ID"\n          tilt=\{isArrivalPhase \? 60 : 0\}\n          heading=\{isArrivalPhase \? 15 : 0\}\n          onZoomChanged=\{\(e\) => setMapZoom\(e\.detail\.zoom\)\}\n        >/;

const newMapProps = `<Map
          defaultCenter={userLocation || { lat: -23.5505, lng: -46.6333 }}
          defaultZoom={19}
          disableDefaultUI={true}
          styles={navigationMapStyle}
          gestureHandling="greedy"
          mapId="DEMO_MAP_ID"
          tilt={simMode ? (isArrivalPhase ? 60 : 0) : (isFollowingUser ? 65 : 0)}
          heading={simMode ? (isArrivalPhase ? 15 : 0) : (isFollowingUser ? userHeading : 0)}
          onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
          onDragStart={() => setIsFollowingUser(false)}
        >`;

code = code.replace(mapPropsRegex, newMapProps);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
