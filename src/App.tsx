import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { StartScreen } from './components/StartScreen';
import { MainMapScreen } from './components/MainMapScreen';
import { SearchScreen } from './components/SearchScreen';
import { RouteScreen } from './components/RouteScreen';
import { NavigationScreen } from './components/NavigationScreen';
import { OSDetailsScreen } from './components/OSDetailsScreen';
import { OSCompletionScreen } from './components/OSCompletionScreen';
import { ServiceOrder } from './types';
import { seedDatabase } from './firebase';

type ScreenStep = 'splash' | 'main-map' | 'search' | 'os-details' | 'route' | 'navigation' | 'os-completion';

export default function App() {
  const [step, setStep] = useState<ScreenStep>('splash');
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    // Database will be seeded in MainMapScreen once location is obtained
  }, []);

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-0 sm:p-8 font-sans selection:bg-blue-500/30">
        
        {/* Mobile Device Container Constraint */}
        <div className="w-full h-[100dvh] sm:w-[393px] sm:h-[852px] bg-black sm:rounded-[48px] sm:border-[12px] border-[#1C1C1E] relative overflow-hidden shadow-2xl sm:shadow-black/50">
          
          {step === 'splash' && (
            <StartScreen onNext={() => setStep('main-map')} />
          )}

          {(step === 'main-map' || step === 'search' || step === 'route') && (
            <MainMapScreen 
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
                const { db } = await import('./firebase');
                
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
                
                // Add to firestore
                try {
                  const docRef = doc(db, 'service_orders', newOS.id);
                  await setDoc(docRef, newOS);
                } catch (e) {
                  console.error("Error creating OS", e);
                }
                
                setSelectedOS(newOS);
                setStep('navigation');
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
              onStationDetails={() => {}} // Remove or adapt if needed
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

        </div>
        
      </div>
    </APIProvider>
  );
}
