const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(
  "onZoomChanged={(e) => setMapZoom(e.detail.zoom)}",
  "onZoomChanged={(e) => setMapZoom(e.detail.zoom)}\n          onDrag={() => { if (hasSnappedInitially) setIsFollowingUser(false); }}\n          onDragStart={() => { if (hasSnappedInitially) setIsFollowingUser(false); }}"
);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
