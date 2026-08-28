import React, { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { StartScreen } from './components/StartScreen';
import { AppMapController } from './components/AppMapController';

type ScreenStep = 'splash' | 'app';

export default function App() {
  const [step, setStep] = useState<ScreenStep>('splash');

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-0 sm:p-8 font-sans selection:bg-blue-500/30">
        
        {/* Mobile Device Container Constraint */}
        <div className="w-full h-[100dvh] sm:w-[393px] sm:h-[852px] bg-black sm:rounded-[48px] sm:border-[12px] border-[#1C1C1E] relative overflow-hidden shadow-2xl sm:shadow-black/50">
          
          {step === 'splash' && (
            <StartScreen onNext={() => setStep('app')} />
          )}

          {step === 'app' && (
            <AppMapController />
          )}

        </div>
      </div>
    </APIProvider>
  );
}
