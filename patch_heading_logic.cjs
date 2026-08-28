const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const oldHeadingLogic = /          let heading = userHeading;\n          if \\(position\\.coords\\.heading !== null && !isNaN\\(position\\.coords\\.heading\\)\\) \\{\n            heading = position\\.coords\\.heading;\n          \\} else if \\(prevLocRef\\.current && geometryLibrary\\) \\{\n            heading = geometryLibrary\\.spherical\\.computeHeading\\(prevLocRef\\.current, loc\\);\n          \\}/;

const newHeadingLogic = `          let heading = userHeading;
          if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
            heading = position.coords.heading;
          } else if (prevLocRef.current && geometryLibrary) {
            const distance = geometryLibrary.spherical.computeDistanceBetween(prevLocRef.current, loc);
            // Only update heading if we moved at least 2 meters to avoid erratic spin or resetting to 0
            if (distance > 2) {
              heading = geometryLibrary.spherical.computeHeading(prevLocRef.current, loc);
            }
          }`;

code = code.replace(oldHeadingLogic, newHeadingLogic);

// Wait, because we reference userHeading in the callback of watchPosition, it might be stale if we don't use a ref for userHeading.
// Let's use a setState callback to reliably get the latest heading if we fall back to it!

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
