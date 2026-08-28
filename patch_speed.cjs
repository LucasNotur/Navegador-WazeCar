const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// Initialize currentSpeed to 0 instead of 38
code = code.replace(
  "const [currentSpeed, setCurrentSpeed] = useState<number | null>(38);",
  "const [currentSpeed, setCurrentSpeed] = useState<number | null>(0);"
);

// Add state for tracking prev position for speed calculation
code = code.replace(
  "const prevLocRef = useRef<{lat: number, lng: number} | null>(null);",
  "const prevLocRef = useRef<{lat: number, lng: number} | null>(null);\n  const prevTimeRef = useRef<number | null>(null);"
);

const oldWatchPosition = `          if (!initialLocationSet) {
            initialLocationSet = true;
          }
          
          // Only update map view if in follow mode and not simulating
          if (isFollowingUser && map && !simMode) {
             map.moveCamera({ center: loc, heading: heading, tilt: 65, zoom: 19 });
          }`;

const newWatchPosition = `          if (!initialLocationSet) {
            initialLocationSet = true;
          }
          
          if (!simMode) {
            if (position.coords.speed !== null && !isNaN(position.coords.speed) && position.coords.speed >= 0) {
              setCurrentSpeed(Math.round(position.coords.speed * 3.6));
            } else if (prevLocRef.current && prevTimeRef.current && geometryLibrary) {
              const distance = geometryLibrary.spherical.computeDistanceBetween(prevLocRef.current, loc);
              const timeDiff = (position.timestamp - prevTimeRef.current) / 1000;
              if (timeDiff > 0) {
                const speedMps = distance / timeDiff;
                if (speedMps < 60) {
                  setCurrentSpeed(Math.round(speedMps * 3.6));
                }
              }
            } else {
              setCurrentSpeed(0);
            }
          }
          prevTimeRef.current = position.timestamp;

          // Only update map view if in follow mode and not simulating
          if (isFollowingUser && map && !simMode) {
             map.moveCamera({ center: loc, heading: heading, tilt: 65, zoom: 19 });
          }`;

code = code.replace(oldWatchPosition, newWatchPosition);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
