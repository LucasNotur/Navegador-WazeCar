const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const newEffect = `
  // Sync Camera when map becomes available or user re-centers
  useEffect(() => {
    if (map && userLocation && isFollowingUser) {
      map.moveCamera({ center: userLocation, heading: userHeading, tilt: 65, zoom: 19 });
    }
  }, [map, isFollowingUser]);

  // User Location State
`;

code = code.replace(/  \/\/ User Location State/, newEffect);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
