const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const targetToReplace = /      if \(\!directionsService\) \{[\s\S]*?console\.error\("Error fetching route:", err\);\n      \}/;

const replacement = `
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("No Google Maps API key found in env vars for Routes API.");
        return;
      }
      
      const body = {
        origin: { location: { latLng: { latitude: userLocation.lat, longitude: userLocation.lng } } },
        destination: { location: { latLng: { latitude: currentOS.location.lat, longitude: currentOS.location.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE"
      };
      
      try {
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error(\`Routes API request failed: \${response.status}\`);
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0 && isMounted) {
          const route = data.routes[0];
          const path = geometryLibrary.encoding.decodePath(route.polyline.encodedPolyline);
          setRealRoutePath(path.map(p => ({ lat: p.lat(), lng: p.lng() })));
          
          const distKm = (route.distanceMeters / 1000).toFixed(1);
          const durSecs = parseInt(route.duration.replace('s', ''));
          const durMins = Math.round(durSecs / 60);
          const arrivalDate = new Date(Date.now() + durSecs * 1000);
          const arrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          setRouteInfo({
            distance: \`\${distKm} km\`,
            duration: durMins > 60 ? \`\${Math.floor(durMins/60)} hr \${durMins%60} min\` : \`\${durMins} min\`,
            arrivalTime: arrivalStr
          });
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
`;

code = code.replace(targetToReplace, replacement);
fs.writeFileSync('src/components/NavigationScreen.tsx', code);
