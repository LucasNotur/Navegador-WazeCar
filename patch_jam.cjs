const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(/  const handleSimulateJam = \(\) => \{\n    setSimMode\(true\);\n/g, '  const handleSimulateJam = () => {\n');

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
