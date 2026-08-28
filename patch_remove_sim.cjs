const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

// 1. Remove simMode state
code = code.replace(/  const \[simMode, setSimMode\] = useState\(false\);\n/, '');

// 2. Remove simMode logic from useEffect (map setup & geolocation)
code = code.replace(/if \(map && !simMode\)/g, 'if (map)');
code = code.replace(/if \(!simMode\)/g, 'if (true)');
code = code.replace(/if \(isFollowingUser && map && !simMode\)/g, 'if (isFollowingUser && map)');
code = code.replace(/, simMode/g, '');

// 3. Remove simDistance and arrival phase simulation
const simEffectsRegex = /  const \[isArrivalPhase, setIsArrivalPhase\] = useState<boolean>\(false\);[\s\S]*?const handleFinish = \(\) => \{/;
const newRealArrivalLogic = `  const [isArrivalPhase, setIsArrivalPhase] = useState<boolean>(false);

  // Real Arrival Phase Detection
  useEffect(() => {
    if (!userLocation || !currentOS || !geometryLibrary) return;
    try {
      const dist = geometryLibrary.spherical.computeDistanceBetween(userLocation, currentOS.location);
      if (dist <= 200 && !isArrivalPhase) {
        setIsArrivalPhase(true);
      } else if (dist > 200 && isArrivalPhase) {
        setIsArrivalPhase(false);
      }
    } catch (e) {
      // ignore
    }
  }, [userLocation, currentOS, geometryLibrary, isArrivalPhase]);

  const handleFinish = () => {`;
code = code.replace(simEffectsRegex, newRealArrivalLogic);

// 4. Remove fake GPS/speed simulation effect
const fakeGpsRegex = /  useEffect\(\(\) => \{\n    if \(!simMode\) return;[\s\S]*?  \}, \[simMode, gpsSignal, speedLimit\]\);\n\n/;
code = code.replace(fakeGpsRegex, '');

// 5. Remove simMode from alternate route acceptance/dismissal
const acceptAltRegex = /  const handleAcceptAlt = \(\) => \{\n    if \(simMode\) \{\n      setSimMode\(false\);\n      setAlertState\('hidden'\);\n      setCooldownUntil\(Date\.now\(\) \+ 5 \* 60 \* 1000\);\n      return;\n    \}/;
code = code.replace(acceptAltRegex, `  const handleAcceptAlt = () => {`);

const dismissAltRegex = /  const handleDismissAlert = \(\) => \{\n    setCooldownUntil\(Date\.now\(\) \+ 5 \* 60 \* 1000\); \/\/ 5 min cooldown\n    setAlertState\('hidden'\);\n    if \(simMode\) \{\n      setSimMode\(false\);\n    \} else \{\n      setAltRoute\(null\);\n    \}\n  \};/;
code = code.replace(dismissAltRegex, `  const handleDismissAlert = () => {\n    setCooldownUntil(Date.now() + 5 * 60 * 1000);\n    setAlertState('hidden');\n    setAltRoute(null);\n  };`);

// 6. Fix variables setting using simMode
const formatVarsRegex = /  if \(!simMode && routeInfo\) \{[\s\S]*?  \} else if \(simMode\) \{[\s\S]*?  \}/;
const newFormatVars = `  if (routeInfo) {
    distanceText = routeInfo.distance;
    durationVal = routeInfo.duration;
    arrivalTime = routeInfo.arrivalTime;
  }`;
code = code.replace(formatVarsRegex, newFormatVars);

// 7. Fix Map tilt/heading
code = code.replace(/tilt=\{simMode \? \(isArrivalPhase \? 60 : 0\) : \(isFollowingUser \? 65 : 0\)\}/, 'tilt={isFollowingUser ? 65 : 0}');
code = code.replace(/heading=\{simMode \? \(isArrivalPhase \? 15 : 0\) : \(isFollowingUser \? userHeading : 0\)\}/, 'heading={isFollowingUser ? userHeading : 0}');

// 8. Remove toggle button
const simBtnRegex = /      \{\/\* Top Left Floating Buttons \*\/\}[\s\S]*?<\/div>\n/;
code = code.replace(simBtnRegex, '');

// 9. Remove simMode specific rendering
code = code.replace(/\{simMode \? '200' : \(distanceText\.split\(' '\)\[0\] \|\| '200'\)\}/g, "{distanceText.split(' ')[0] || '...'}");
code = code.replace(/\{simMode \? 'm' : \(distanceText\.split\(' '\)\[1\] \|\| 'm'\)\}/g, "{distanceText.split(' ')[1] || 'km'}");
code = code.replace(/\{simMode \? Math\.max\(0, Math\.round\(simDistance\)\) : \(distanceText\.split\(' '\)\[0\] \|\| '200'\)\}/g, "{distanceText.split(' ')[0] || '...'}");

code = code.replace(/\{simMode \? '12' : \(distanceText\.split\(' '\)\[0\] \|\| '12'\)\}/g, "{distanceText.split(' ')[0] || '...'}");
code = code.replace(/\{simMode \? 'km' : \(distanceText\.split\(' '\)\[1\] \|\| 'km'\)\}/g, "{distanceText.split(' ')[1] || 'km'}");

code = code.replace(/\{simMode \? '25' : \(durationVal\.split\(' '\)\[0\] \|\| '25'\)\}/g, "{durationVal.split(' ')[0] || '...'}");
code = code.replace(/\{simMode \? 'min' : \(durationVal\.split\(' '\)\[1\] \|\| 'min'\)\}/g, "{durationVal.split(' ')[1] || 'min'}");

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
