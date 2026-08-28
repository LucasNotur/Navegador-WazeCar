const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(
  "const [isFollowingUser, setIsFollowingUser] = useState(true);",
  "const [isFollowingUser, setIsFollowingUser] = useState(true);\n  const [hasSnappedInitially, setHasSnappedInitially] = useState(false);"
);

const oldEffect = `  // Sync Camera when map becomes available or user re-centers
  useEffect(() => {
    if (map && userLocation && isFollowingUser) {
      let currentHeading = userHeading;
      // If we are stationary and just started (heading is 0), point towards the destination
      if (currentHeading === 0 && currentOS && geometryLibrary) {
        currentHeading = geometryLibrary.spherical.computeHeading(userLocation, currentOS.location);
      }
      map.moveCamera({ center: userLocation, heading: currentHeading, tilt: 65, zoom: 19 });
    }
  }, [map, isFollowingUser, userLocation, userHeading, currentOS, geometryLibrary]);`;

const newEffect = `  // Sync Camera when map becomes available or user re-centers
  useEffect(() => {
    if (map && userLocation && (isFollowingUser || !hasSnappedInitially)) {
      let currentHeading = userHeading;
      // If we are stationary and just started (heading is 0), point towards the destination
      if (currentHeading === 0 && currentOS && geometryLibrary) {
        currentHeading = geometryLibrary.spherical.computeHeading(userLocation, currentOS.location);
      }
      map.moveCamera({ center: userLocation, heading: currentHeading, tilt: 65, zoom: 19 });
      if (!hasSnappedInitially) {
        setHasSnappedInitially(true);
      }
    }
  }, [map, isFollowingUser, userLocation, userHeading, currentOS, geometryLibrary, hasSnappedInitially]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
