#!/bin/bash
cat << 'INNER_EOF' > temp_nav_patch.js
const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const targetToReplace = /const apiKey = import\.meta\.env\.VITE_GOOGLE_MAPS_API_KEY;[\s\S]*?\} catch \(err\) \{[\s\S]*?console\.error\("Error fetching route:", err\);[\s\S]*?\}/;

const replacement = `
      if (!directionsService) {
        if (routesLibrary) {
          const ds = new routesLibrary.DirectionsService();
          setDirectionsService(ds);
        }
        return;
      }
      
      try {
        directionsService.route(
          {
            origin: userLocation,
            destination: currentOS.location,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result && isMounted) {
              const route = result.routes[0];
              const path = route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              setRealRoutePath(path);
              
              const leg = route.legs[0];
              const durSecs = leg.duration?.value || 0;
              const arrivalDate = new Date(Date.now() + durSecs * 1000);
              const arrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              setRouteInfo({
                distance: leg.distance?.text || '',
                duration: leg.duration?.text || '',
                arrivalTime: arrivalStr
              });
            } else {
              console.error("Directions request failed due to " + status);
            }
          }
        );
      } catch (err) {
        console.error("Error fetching route:", err);
      }
`;

code = code.replace(targetToReplace, replacement);
fs.writeFileSync('src/components/NavigationScreen.tsx', code);
INNER_EOF

node temp_nav_patch.js
