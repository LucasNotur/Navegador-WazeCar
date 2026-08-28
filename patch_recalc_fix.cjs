const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// 1. Remove recalcTrigger state, just use lastRecalcTime
code = code.replace(
  "const [realRoutePath, setRealRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);\n  const [recalcTrigger, setRecalcTrigger] = useState(0);\n  const lastRecalcTime = useRef<number>(0);",
  "const [realRoutePath, setRealRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);\n  const lastRecalcTime = useRef<number>(0);"
);

// 2. Fix the deviation detection to use setRealRoutePath(null)
const oldDeviationLogicRegex = /\/\/ Route deviation detection[\s\S]*?\/\/ Fetch real route using Routes API v2/m;
const newDeviationLogic = `// Route deviation detection
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

  // Fetch real route using Routes API v2`;

code = code.replace(oldDeviationLogicRegex, newDeviationLogic);

// 3. Revert fetchRoute effect dependencies and early return
const oldFetchRouteStartRegex = /if \(\!userLocation \|\| \!currentOS \|\| \!geometryLibrary\) return;\n    if \(realRoutePath && recalcTrigger === 0\) return;/;
code = code.replace(oldFetchRouteStartRegex, "if (!userLocation || !currentOS || !geometryLibrary || realRoutePath) return;");

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
