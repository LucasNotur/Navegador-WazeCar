import React from 'react';
import { StatusBar } from './StatusBar';

interface StartScreenProps {
  onNext: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onNext }) => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#000000] flex flex-col items-center animate-fade-in">
      
      {/* Background Tech Simulation */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <svg width="100%" height="100%" viewBox="0 0 390 844" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M 0 300 Q 150 250, 390 350" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <path d="M -50 450 Q 150 480, 200 650 T 400 700" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <path d="M 150 200 L 150 500" stroke="#1A1A1A" strokeWidth="2" fill="none" />
        </svg>
      </div>

      <StatusBar />

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 -mt-10 px-8">
        
        {/* Logo SVG (Tools/Wrench style) */}
        <div className="w-[140px] h-[140px] relative flex items-center justify-center bg-[#0A84FF]/10 rounded-full mb-8">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-white text-[32px] font-bold tracking-tight mb-2">
          TechRouter
        </h1>
        <p className="text-[#6C6C6E] text-[15px] text-center leading-snug max-w-[260px]">
          Gestão de Ordens de Serviço & Navegação Integrada
        </p>

        {/* User Card */}
        <div className="w-full bg-[#1C1C1E] border border-[#2C2C2E] p-4 rounded-2xl flex items-center gap-4 mt-10">
          <div className="w-12 h-12 bg-[#0A84FF] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-bold text-[16px]">Carlos Técnico</span>
            <span className="text-[#8E8E93] text-[13px]">Base: Zona Sul SP</span>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="z-10 w-full px-8 pb-[50px]">
        <button 
          onClick={onNext}
          className="w-full h-[56px] bg-[#0A84FF] hover:bg-blue-600 rounded-2xl flex items-center justify-center text-white text-[17px] font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
        >
          Iniciar Turno
        </button>
      </div>

    </div>
  );
};
