const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(/  \}, \[map, isFollowingUser\]\);/g, '  }, [map, isFollowingUser, userLocation]);');

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
