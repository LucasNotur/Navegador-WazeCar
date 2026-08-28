import React, { useEffect, useContext } from 'react';
import { ServiceOrder } from '../types';
import { NavigationContext } from './AppMapController';

interface Props {
  order: ServiceOrder;
  onClose: () => void;
  onAcceptRoute: () => void;
}

export const OSDetailsScreen: React.FC<Props> = ({ order, onClose, onAcceptRoute }) => {
  const machine = useContext(NavigationContext);

  useEffect(() => {
    if (machine) {
      machine.selectOrder(order as any);
    }
  }, [machine, order]);

  const handleAccept = () => {
    if (machine) {
      machine.startNavigation();
    }
    onAcceptRoute();
  };

  const handleClose = () => {
    if (machine) {
      machine.cancel();
    }
    onClose();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] rounded-t-[24px] flex flex-col text-white animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-h-[70vh]">
      
      {/* Handle */}
      <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
      </div>

      <div className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center cursor-pointer z-10 hover:bg-black/60 transition-colors" onClick={handleClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <div className="px-6 pb-2 shrink-0">
        <div className="flex justify-between items-start mb-2 mt-2">
          <h1 className="text-[26px] font-bold leading-tight">{order.id}</h1>
          <div className="bg-[#2C2C2E] px-3 py-1 rounded-md text-[13px] font-bold text-[#0A84FF] tracking-wide uppercase">
            {order.type}
          </div>
        </div>
        <p className="text-[#8E8E93] text-[15px] font-medium">{order.client}</p>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 custom-scrollbar">
        <div className="w-full h-[1px] bg-[#2C2C2E] my-5" />

        {/* Address */}
        <div className="mb-6">
          <h2 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Endereço</h2>
          <p className="text-[16px] leading-relaxed flex items-start gap-2 text-white">
            <svg className="w-5 h-5 text-[#0A84FF] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {order.address}
          </p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Problema Relatado</h2>
          <div className="bg-[#2C2C2E] p-4 rounded-xl border border-white/5">
            <p className="text-[15px] leading-relaxed text-neutral-200">
              {order.description}
            </p>
          </div>
        </div>

        {/* Equipment */}
        {order.equipment && order.equipment.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-3">Equipamentos</h2>
            <div className="flex flex-wrap gap-2">
              {order.equipment.map((item, idx) => (
                <div key={idx} className="bg-[#2C2C2E] px-3 py-1.5 rounded-lg text-[14px] flex items-center gap-2 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Action */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E] to-transparent pt-12 shrink-0">
        <button 
          onClick={handleAccept}
          className="w-full h-[56px] bg-[#0A84FF] hover:bg-[#0A84FF]/90 rounded-[16px] flex items-center justify-center text-white text-[17px] font-bold transition-transform active:scale-[0.98] shadow-lg shadow-blue-500/20 gap-2"
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
