const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// Remove onDrag, onDragstart, onDragStart
code = code.replace(/          onDrag=\\{\\(\\) => setIsFollowingUser\\(false\\)\\}\\n/g, "");
code = code.replace(/          onDragstart=\\{\\(\\) => setIsFollowingUser\\(false\\)\\}\\n/g, "");
code = code.replace(/          onDragStart=\\{\\(\\) => setIsFollowingUser\\(false\\)\\}\\n/g, "");

// We need a better way to detect user panning, or we can just let isFollowingUser be true and only disable it if the user interacts.
// Google Maps has `onDrag` but maybe it fires on programmatic moves.
// A safe way is to add a gesture handling listener, but react-google-maps might not expose it simply.
// Let's use `onDrag` but ONLY if `isFollowingUser` is true and we haven't just programmatic moved.
// Actually, `onDrag` does NOT fire for `map.moveCamera()` in the official JS API, but maybe the React wrapper fires it?
// Let's just remove it and use `onMouseCapture` on a wrapper div? No, Google Maps intercepts events.
// Let's use `onDrag` but wait until the initial snap!
// Wait, better yet, `useMap` provides the map. We can add a DOM listener to the map div? No.

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
