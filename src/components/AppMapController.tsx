import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { NavigationStateMachine, ServiceOrder as NavServiceOrder, NavigationSnapshot } from '../utils/navigationStateMachine';
import { getCachedLocation, updateCachedLocation, getUserLocationStrict, LocationStatus } from '../utils/geolocation';
import { darkMapStyle } from '../mapStyle';
import { MainMapScreen } from './MainMapScreen';
import { SearchScreen } from './SearchScreen';
import { OSDetailsScreen } from './OSDetailsScreen';
import { NavigationScreen } from './NavigationScreen';
import { OSCompletionScreen } from './OSCompletionScreen';
import { RouteScreen } from './RouteScreen';
import { ServiceOrder } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { db, seedDatabase } from '../firebase';

export const NavigationContext = createContext<NavigationStateMachine | null>(null);

type ScreenStep = 'main-map' | 'search' | 'os-details' | 'route' | 'navigation' | 'os-completion';

let hasSeeded = false;

export const AppMapController: React.FC = () => {
  const [step, setStep] = useState<ScreenStep>('main-map');
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(getCachedLocation());
  const [locStatus, setLocStatus] = useState<LocationStatus>(getCachedLocation() ? 'ready' : 'loading');
  const [locError, setLocError] = useState('');

  const map = useMap();
  const [machine, setMachine] = useState<NavigationStateMachine | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(getCachedLocation());

  const fetchLocation = () => {
    setLocStatus('loading');
    getUserLocationStrict(
      (loc) => {
        setUserLocation(loc);
        lastPositionRef.current = loc;
        setLocStatus('ready');
        if (!hasSeeded) {
          hasSeeded = true;
          seedDatabase(loc.lat, loc.lng).catch(console.error);
        }
      },
      (status, message) => {
        setLocStatus(status);
        setLocError(message);
      }
    );
  };

  useEffect(() => {
    if (!getCachedLocation()) {
      fetchLocation();
    }
  }, []);

  useEffect(() => {
    let watchId: number;
    if ('geolocation' in navigator && locStatus === 'ready') {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          updateCachedLocation(loc);
          setUserLocation(loc);
          lastPositionRef.current = loc;
          
          if (!hasSeeded) {
            hasSeeded = true;
            seedDatabase(loc.lat, loc.lng).catch(console.error);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
      );
    }
    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locStatus]);

  useEffect(() => {
    if (map && !machine && locStatus === 'ready') {
      const m = new NavigationStateMachine(map, () => lastPositionRef.current);
      setMachine(m);
    }
  }, [map, machine, locStatus]);

  if (locStatus === 'loading') {
    return <LoadingSpinner text="Obtendo sua localização real (GPS)..." />;
  }

  if (locStatus === 'error' || locStatus === 'denied') {
    return <ErrorMessage text={locError} onRetry={fetchLocation} />;
  }

  return (
    <NavigationContext.Provider value={machine}>
      <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden animate-fade-in">
        {/* Real Google Map - Always Rendered */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Map
            mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
            mapTypeId={"roadmap"}
            defaultCenter={userLocation || { lat: -23.55052, lng: -46.633308 }}
            defaultZoom={14}
            disableDefaultUI={true}
            styles={darkMapStyle}
            gestureHandling="greedy"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          >
            {/* The rest of the overlay content will be handled by screens. We can render standard markers in MainMapScreen */}
            {machine && (
               <ScreenRouter 
                  step={step} 
                  setStep={setStep} 
                  selectedOS={selectedOS} 
                  setSelectedOS={setSelectedOS} 
                  userLocation={userLocation}
               />
            )}
          </Map>
        </div>
      </div>
    </NavigationContext.Provider>
  );
};

const ScreenRouter: React.FC<{
  step: ScreenStep, 
  setStep: (s: ScreenStep) => void,
  selectedOS: ServiceOrder | null,
  setSelectedOS: (os: ServiceOrder | null) => void,
  userLocation: { lat: number; lng: number } | null
}> = ({ step, setStep, selectedOS, setSelectedOS, userLocation }) => {
   
   return (
      <>
         {(step === 'main-map' || step === 'search' || step === 'route') && (
            <MainMapScreen 
               userLocation={userLocation}
               onSearch={() => setStep('search')} 
               onSelectOS={(os) => {
                  setSelectedOS(os);
                  setStep('os-details');
               }}
            />
         )}

         {step === 'search' && (
            <SearchScreen 
               onSelectPlace={async (location, address, name) => {
                  const { collection, doc, setDoc } = await import('firebase/firestore');
                  const { db } = await import('../firebase');
                  
                  const newOS: ServiceOrder = {
                     id: `OS-${Math.floor(1000 + Math.random() * 9000)}`,
                     type: 'Reparo',
                     status: 'pendente',
                     client: name || 'Navegação Avulsa',
                     address: address || 'Endereço buscado',
                     location: location,
                     description: 'Navegação avulsa criada via busca.',
                     equipment: [],
                     priority: 'Baixa',
                  };
                  
                  try {
                     const docRef = doc(db, 'service_orders', newOS.id);
                     await setDoc(docRef, newOS);
                  } catch (e) {
                     console.error("Error creating OS", e);
                  }
                  
                  setSelectedOS(newOS);
                  setStep('os-details');
               }} 
               onClose={() => setStep('main-map')} 
            />
         )}

         {step === 'os-details' && selectedOS && (
            <OSDetailsScreen
               order={selectedOS}
               onClose={() => setStep('main-map')}
               onAcceptRoute={() => setStep('navigation')}
            />
         )}

         {step === 'route' && (
            <RouteScreen 
               onBack={() => setStep('main-map')} 
               onStartNavigation={() => setStep('navigation')}
               onStationDetails={() => {}} 
               onTripComplete={() => setStep('os-completion')}
            />
         )}

         {step === 'navigation' && (
            <NavigationScreen 
               onStop={() => setStep('main-map')} 
               onAddStop={() => setStep('search')}
               onTripComplete={() => setStep('os-completion')}
               currentOS={selectedOS}
            />
         )}

         {step === 'os-completion' && selectedOS && (
            <OSCompletionScreen 
               order={selectedOS} 
               onComplete={() => {
                  setSelectedOS(null);
                  setStep('main-map');
               }} 
            />
         )}
      </>
   );
};
