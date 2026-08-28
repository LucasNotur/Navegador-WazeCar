import React, { useEffect, useState } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StatusBar } from './StatusBar';
import { ServiceOrder } from '../types';

export const MainMapScreen: React.FC<{ 
  onSearch: () => void, 
  onSelectOS: (os: ServiceOrder) => void,
  userLocation: { lat: number; lng: number } | null 
}> = ({ onSearch, onSelectOS, userLocation }) => {
  const map = useMap();
  const [hasCenteredMap, setHasCenteredMap] = useState(false);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  
  useEffect(() => {
    if (map && userLocation && !hasCenteredMap) {
      map.panTo(userLocation);
      setHasCenteredMap(true);
    }
  }, [map, userLocation, hasCenteredMap]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'service_orders'), (snap) => {
      const data: ServiceOrder[] = [];
      snap.forEach(doc => {
        const os = doc.data() as ServiceOrder;
        if (os.status !== "concluida") { 
            data.push(os); 
        }
      });
      setOrders(data);
    });
    return () => unsub();
  }, []);

  return (
    <>
      {/* Markers rendered globally on the shared Map */}
      {userLocation && (
        <AdvancedMarker position={userLocation} zIndex={100}>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 bg-white/10 rounded-full blur-md animate-pulse" />
            <div className="w-[18px] h-[18px] bg-[#0A84FF] rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(10,132,255,0.5)] relative z-10" />
          </div>
        </AdvancedMarker>
      )}

      {orders.map(order => (
        <AdvancedMarker 
          key={order.id}
          position={order.location}
          onClick={() => onSelectOS(order)}
        >
          <div className="w-10 h-10 bg-[#FF9F0A] rounded-full flex items-center justify-center border-4 border-[#1C1C1E] shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
        </AdvancedMarker>
      ))}

      <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden animate-fade-in pointer-events-none">
        
        {/* Subtle top gradient to make status bar legible against map */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A0A0A]/80 to-transparent pointer-events-none z-0" />

        <StatusBar title="ÁREA DE COBERTURA" />

        {/* Map Controls */}
        <div className="absolute top-14 left-4 right-4 flex justify-between z-10 pointer-events-auto">
           
           {/* Top Left: Location */}
           <div 
             className="w-11 h-11 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer active:scale-95 text-white shadow-lg"
             onClick={() => {
               if (userLocation && map) {
                 map.panTo(userLocation);
                 map.setZoom(15);
               }
             }}
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <polygon points="3 11 22 2 13 21 11 13 3 11"/>
             </svg>
           </div>

           {/* Filter */}
           <div className="w-11 h-11 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
           </div>

           {/* Top Right: Search */}
           <div 
             className="w-11 h-11 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer transition-colors active:scale-95 text-white"
             onClick={onSearch}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
           </div>
        </div>

        {/* Bottom Floating List of OSes */}
        <div className="absolute bottom-6 left-0 right-0 z-10 pointer-events-auto px-4 pb-safe flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1 px-2">
            <h3 className="text-white font-bold text-[18px]">Ordens Próximas</h3>
            <span className="text-[#8E8E93] text-[13px]">{orders.length} Pendentes</span>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-hide">
            {orders.map(order => (
              <div 
                key={order.id} 
                onClick={() => onSelectOS(order)}
                className="min-w-[280px] snap-center bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#2C2C2E] rounded-[20px] p-4 flex flex-col cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[12px] font-bold px-2 py-1 rounded-md ${order.priority === 'Alta' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {order.priority}
                  </span>
                  <span className="text-[#8E8E93] text-[13px] font-medium">{order.distance}</span>
                </div>
                <h4 className="text-white font-bold text-[16px] mb-1 truncate">{order.client}</h4>
                <p className="text-[#8E8E93] text-[13px] line-clamp-2">{order.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white/50 rounded-full z-10 pointer-events-none" />
      </div>
    </>
  );
}
