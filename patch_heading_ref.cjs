const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// 1. Add headingRef
code = code.replace(/  const \[userHeading, setUserHeading\] = useState\(0\);\n/g, "  const [userHeading, setUserHeading] = useState(0);\n  const headingRef = useRef(0);\n");

// 2. Update the watchPosition callback to use headingRef
const oldLogic = /          let heading = userHeading;\n          if \\(position\\.coords\\.heading !== null && !isNaN\\(position\\.coords\\.heading\\)\\) \\{\n            heading = position\\.coords\\.heading;\n          \\} else if \\(prevLocRef\\.current && geometryLibrary\\) \\{\n            const distance = geometryLibrary\\.spherical\\.computeDistanceBetween\\(prevLocRef\\.current, loc\\);\n            \/\/ Only update heading if we moved at least 2 meters to avoid erratic spin or resetting to 0\n            if \\(distance > 2\\) \\{\n              heading = geometryLibrary\\.spherical\\.computeHeading\\(prevLocRef\\.current, loc\\);\n            \\}\n          \\}/;

const newLogic = `          let heading = headingRef.current;
          if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
            heading = position.coords.heading;
          } else if (prevLocRef.current && geometryLibrary) {
            const distance = geometryLibrary.spherical.computeDistanceBetween(prevLocRef.current, loc);
            // Only update heading if we moved at least 2 meters to avoid erratic spin or resetting to 0
            if (distance > 2) {
              heading = geometryLibrary.spherical.computeHeading(prevLocRef.current, loc);
            }
          }`;

code = code.replace(oldLogic, newLogic);

// 3. Ensure we update headingRef whenever we call setUserHeading inside getUserLocation
const oldSetUserHeading = /          setUserHeading\\(initialHeading\\);/g;
const newSetUserHeading = `          setUserHeading(initialHeading);
          headingRef.current = initialHeading;`;
code = code.replace(oldSetUserHeading, newSetUserHeading);

// 4. Update headingRef in watchPosition
const watchPosSetUserHeading = /            setUserHeading\\(heading\\);/g;
const newWatchPosSetUserHeading = `            setUserHeading(heading);
            headingRef.current = heading;`;
code = code.replace(watchPosSetUserHeading, newWatchPosSetUserHeading);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
