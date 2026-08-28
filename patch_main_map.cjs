const fs = require('fs');
let code = fs.readFileSync('src/components/MainMapScreen.tsx', 'utf8');

// Fix the map panning logic
code = code.replace(
  /const \[userLocation, setUserLocation\] = useState<\{ lat: number; lng: number \} \| null>\(null\);/,
  `const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasCenteredMap, setHasCenteredMap] = useState(false);`
);

code = code.replace(
  /if \(map\) map\.panTo\(loc\);/g,
  `// map panning handled by separate effect`
);

const effectToInsert = `
  useEffect(() => {
    if (map && userLocation && !hasCenteredMap) {
      map.panTo(userLocation);
      setHasCenteredMap(true);
    }
  }, [map, userLocation, hasCenteredMap]);
`;

code = code.replace(
  /const \[orders, setOrders\] = useState<ServiceOrder\[\]>\(\[\]\);/,
  `const [orders, setOrders] = useState<ServiceOrder[]>([]);
  ${effectToInsert}`
);

// Add center button
const buttonToAdd = `
         {/* Top Left: Location */}
         <div 
           className="w-11 h-11 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer active:scale-95 text-white shadow-lg"
           onClick={() => {
             if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                 (position) => {
                   const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                   setUserLocation(loc);
                   if (map) {
                     map.panTo(loc);
                     map.setZoom(15);
                   }
                 },
                 (err) => console.warn(err),
                 { enableHighAccuracy: true }
               );
             }
           }}
         >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <polygon points="3 11 22 2 13 21 11 13 3 11"/>
           </svg>
         </div>
`;

code = code.replace(
  /\{\/\* Top Left: Filter \*\/\}/,
  buttonToAdd + '\n         {/* Filter (now hidden or shifted, actually let us put them in a flex-col or row) */}'
);

fs.writeFileSync('src/components/MainMapScreen.tsx', code);
