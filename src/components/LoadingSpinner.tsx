import React from 'react';

export const LoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] flex flex-col items-center justify-center animate-fade-in z-50">
    <div className="w-12 h-12 border-4 border-white/10 border-t-[#0A84FF] rounded-full animate-spin mb-6" />
    <p className="text-white font-medium text-[17px] opacity-80">{text}</p>
  </div>
);
