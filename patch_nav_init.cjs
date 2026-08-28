const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(
  "import { getUserLocation, updateCachedLocation } from '../utils/geolocation';",
  "import { getUserLocation, updateCachedLocation, getCachedLocation } from '../utils/geolocation';"
);

code = code.replace(
  "const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);",
  "const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(getCachedLocation());"
);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);

// Same for MainMapScreen
let mapCode = fs.readFileSync('src/components/MainMapScreen.tsx', 'utf8');

mapCode = mapCode.replace(
  "import { getUserLocation, updateCachedLocation } from '../utils/geolocation';",
  "import { getUserLocation, updateCachedLocation, getCachedLocation } from '../utils/geolocation';"
);

mapCode = mapCode.replace(
  "const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);",
  "const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(getCachedLocation());"
);

fs.writeFileSync('src/components/MainMapScreen.tsx', mapCode);
