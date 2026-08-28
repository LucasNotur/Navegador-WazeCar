const fs = require('fs');
let code = fs.readFileSync('src/components/MainMapScreen.tsx', 'utf8');

code = code.replace(/timeout: 5000/g, 'timeout: 30000');

fs.writeFileSync('src/components/MainMapScreen.tsx', code);
