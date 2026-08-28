import React, { useState } from 'react';
import { ServiceOrder } from '../types';

interface Props {
  order: ServiceOrder;
  onComplete: () => void;
}

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const OSCompletionScreen: React.FC<Props> = ({ order, onComplete }) => {
  const handleComplete = async () => {
    try {
      const docRef = doc(db, "service_orders", order.id);
      await updateDoc(docRef, { status: "concluida" });
    } catch (e) { console.error(e); }
    onComplete();
  };

  const [photoCount, setPhotoCount] = useState(0);

  return (
    <div className="absolute inset-0 z-50 bg-[#0A0A0A] flex flex-col text-white animate-slide-up pb-safe">
      <div className="px-5 pt-16 pb-6 flex-shrink-0 border-b border-[#2C2C2E]">
        <h1 className="text-[28px] font-bold">Finalizar OS</h1>
        <p className="text-[#8E8E93] mt-1">{order.id} - {order.client}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        
        <div className="mb-8">
          <h2 className="text-[16px] font-medium mb-3">Relatório de Execução</h2>
          <textarea 
            className="w-full h-32 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl p-4 text-[15px] outline-none focus:border-[#0A84FF] transition-colors resize-none"
            placeholder="Descreva o que foi feito..."
            defaultValue="Limpeza de conectores, troca de drop no poste 4. Sinal normalizado (-18dBm)."
          />
        </div>

        <div className="mb-8">
          <h2 className="text-[16px] font-medium mb-3">Evidências (Fotos)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(photoCount)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#2C2C2E] rounded-xl flex items-center justify-center overflow-hidden border border-[#3A3A3C]">
                <img src={`https://images.unsplash.com/photo-1544253381-8c4608c02a7b?q=80&w=200&auto=format&fit=crop&sig=${i}`} alt="Evidência" className="w-full h-full object-cover" />
              </div>
            ))}
            <button 
              onClick={() => setPhotoCount(p => Math.min(p + 1, 3))}
              className="aspect-square bg-[#1C1C1E] border border-dashed border-[#3A3A3C] hover:border-[#8E8E93] rounded-xl flex flex-col items-center justify-center text-[#8E8E93] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span className="text-[12px]">Tirar Foto</span>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <label className="flex items-center gap-3 bg-[#1C1C1E] p-4 rounded-xl border border-[#2C2C2E] cursor-pointer">
            <input type="checkbox" className="w-6 h-6 rounded bg-[#2C2C2E] border-none text-[#0A84FF] focus:ring-0 focus:ring-offset-0" defaultChecked />
            <span className="text-[15px]">Cliente assinou termo de aceite</span>
          </label>
        </div>

      </div>

      <div className="p-5 flex-shrink-0">
        <button 
          onClick={handleComplete}
          className="w-full h-[56px] bg-[#34C759] hover:bg-green-600 rounded-2xl flex items-center justify-center text-white text-[17px] font-bold transition-transform active:scale-95 shadow-lg shadow-green-500/20"
        >
          Baixar OS e Finalizar
        </button>
      </div>
    </div>
  );
}
