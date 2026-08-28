import React from 'react';
import { ServiceOrder } from '../types';

interface Props {
  order: ServiceOrder;
  onClose: () => void;
  onAcceptRoute: () => void;
}

export const OSDetailsScreen: React.FC<Props> = ({ order, onClose, onAcceptRoute }) => {
  return (
    <div className="absolute inset-0 z-50 bg-[#0A0A0A] flex flex-col text-white animate-slide-up">
      {/* Header Image / Map Placeholder */}
      <div className="relative h-[250px] w-full bg-neutral-800 flex-shrink-0">
        {/* Pseudo Map Background */}
        <div className="absolute inset-0 bg-[#1A1A1A] bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=55.7355,37.6256&zoom=15&size=400x250&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8E8E93&style=feature:all|element:labels.text.stroke|color:0x1C1C1E&style=feature:administrative|element:geometry.stroke|color:0x2C2C2E&style=feature:landscape|element:geometry|color:0x1C1C1E&style=feature:poi|element:geometry|color:0x2C2C2E&style=feature:road|element:geometry.fill|color:0x3A3A3C&style=feature:road|element:geometry.stroke|color:0x2C2C2E&style=feature:water|element:geometry|color:0x0A0A0A')] bg-cover bg-center opacity-60" />
        
        {/* Close Button */}
        <div 
          className="absolute top-14 left-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer z-10"
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </div>

        {/* Priority Badge */}
        <div className="absolute top-14 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[13px] font-semibold tracking-wide uppercase z-10 shadow-lg">
          {order.priority} Prioridade
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-[28px] font-bold leading-tight">{order.id}</h1>
          <div className="bg-[#2C2C2E] px-3 py-1 rounded-md text-[14px] font-medium text-[#0A84FF]">
            {order.type}
          </div>
        </div>

        <p className="text-[#8E8E93] text-[16px] mb-6">{order.client} • {order.distance}</p>

        <div className="w-full h-[1px] bg-[#2C2C2E] my-6" />

        {/* Address */}
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Endereço</h2>
          <p className="text-[16px] leading-relaxed flex items-start gap-2">
            <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {order.address}
          </p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">Problema Relatado</h2>
          <div className="bg-[#1C1C1E] p-4 rounded-xl border border-[#2C2C2E]">
            <p className="text-[15px] leading-relaxed text-neutral-300">
              {order.description}
            </p>
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">O que levar (Equipamentos)</h2>
          <div className="flex flex-wrap gap-2">
            {order.equipment.map((item, idx) => (
              <div key={idx} className="bg-[#2C2C2E] px-3 py-1.5 rounded-lg text-[14px] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Fixed Action */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pt-12">
        <button 
          onClick={onAcceptRoute}
          className="w-full h-[56px] bg-[#0A84FF] hover:bg-blue-600 rounded-2xl flex items-center justify-center text-white text-[17px] font-bold transition-transform active:scale-95 shadow-lg shadow-blue-500/30 gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Aceitar e Iniciar Rota
        </button>
      </div>
    </div>
  );
}
