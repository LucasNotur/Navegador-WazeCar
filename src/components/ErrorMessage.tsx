import React from 'react';

export const ErrorMessage: React.FC<{ text: string; onRetry?: () => void }> = ({ text, onRetry }) => (
  <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center animate-fade-in z-50">
    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-white font-medium text-[17px] mb-8 opacity-80">{text}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-6 py-3 bg-[#0A84FF] text-white rounded-xl font-semibold active:scale-95 transition-transform"
      >
        Tentar Novamente
      </button>
    )}
  </div>
);
