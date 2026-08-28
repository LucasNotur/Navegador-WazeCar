const fs = require('fs');

const mainMapPath = 'src/components/MainMapScreen.tsx';
let mainMapCode = fs.readFileSync(mainMapPath, 'utf8');

// Add import for updateCachedLocation in MainMapScreen
mainMapCode = mainMapCode.replace(
  "import { getUserLocation } from '../utils/geolocation';",
  "import { getUserLocation, updateCachedLocation } from '../utils/geolocation';"
);

mainMapCode = mainMapCode.replace(
  "const loc = { lat: position.coords.latitude, lng: position.coords.longitude };\n          setUserLocation(loc);",
  "const loc = { lat: position.coords.latitude, lng: position.coords.longitude };\n          updateCachedLocation(loc);\n          setUserLocation(loc);"
);

fs.writeFileSync(mainMapPath, mainMapCode);

const navScreenPath = 'src/components/NavigationScreen.tsx';
let navScreenCode = fs.readFileSync(navScreenPath, 'utf8');

navScreenCode = navScreenCode.replace(
  "import { getUserLocation } from '../utils/geolocation';",
  "import { getUserLocation, updateCachedLocation } from '../utils/geolocation';"
);

navScreenCode = navScreenCode.replace(
  "const loc = { lat: position.coords.latitude, lng: position.coords.longitude };\n          setUserLocation(loc);",
  "const loc = { lat: position.coords.latitude, lng: position.coords.longitude };\n          updateCachedLocation(loc);\n          setUserLocation(loc);"
);

fs.writeFileSync(navScreenPath, navScreenCode);

