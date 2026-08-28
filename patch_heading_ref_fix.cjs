const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace("setUserHeading(initialHeading);", "setUserHeading(initialHeading);\n          headingRef.current = initialHeading;");
code = code.replace("setUserHeading(heading);", "setUserHeading(heading);\n            headingRef.current = heading;");

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
