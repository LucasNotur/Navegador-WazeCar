const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');
code = code.replace(/const fetchRoute = async \(\) => \{\s*try \{\s*if \(\!directionsService\)/, "const fetchRoute = async () => {\n      if (!directionsService)");
fs.writeFileSync('src/components/NavigationScreen.tsx', code);
