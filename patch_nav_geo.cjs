const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(/timeout: 5000/g, 'timeout: 30000');

// Ensure that when watchPosition fires, if it's the first real GPS, it forces a pan even if a fallback happened
// Actually, setting timeout to 30000 in both might be enough, because it won't fallback until 30s pass, giving ample time to click allow.
fs.writeFileSync('src/components/NavigationScreen.tsx', code);
