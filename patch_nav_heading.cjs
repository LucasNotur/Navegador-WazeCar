const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(
  "currentHeading = geometryLibrary.spherical.computeHeading(userLocation, currentOS.location);",
  "try { currentHeading = geometryLibrary.spherical.computeHeading(userLocation, currentOS.location); } catch (e) { console.error('Heading err:', e); currentHeading = 0; }"
);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
