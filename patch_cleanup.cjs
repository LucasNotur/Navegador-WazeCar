const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const fakeGpsRegex = /  useEffect\(\(\) => \{\n    if \(true\) return;[\s\S]*?  \}, \[simMode, gpsSignal, speedLimit\]\);\n/;
code = code.replace(fakeGpsRegex, '');

code = code.replace(/setSimMode\(false\);\n/g, '');
code = code.replace(/\{Math\.max\(0, Math\.round\(simDistance\)\)\}/g, '');
code = code.replace(/simDistance/g, '0');

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
