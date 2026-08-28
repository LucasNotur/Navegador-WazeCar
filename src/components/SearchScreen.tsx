import React, { useState, useRef, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export const SearchScreen: React.FC<{ onSelectPlace: (location: { lat: number; lng: number }, address: string, name: string) => void, onClose: () => void }> = ({ onSelectPlace, onClose }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (map && placesLib) {
      setPlacesService(new placesLib.PlacesService(map));
    }
  }, [map, placesLib]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const searchPlaces = async () => {
      // Try Google Places first if available
      let googleResults = false;
      if (placesLib) {
        const autocompleteService = new placesLib.AutocompleteService();
        try {
          await new Promise<void>((resolve) => {
            autocompleteService.getPlacePredictions({ input: searchValue, locationBias: { radius: 50000, center: { lat: -22.9068, lng: -43.1729 } } }, (preds, status) => {
              if (status === placesLib.PlacesServiceStatus.OK && preds) {
                setPredictions(preds.map(p => ({
                  id: p.place_id,
                  mainText: p.structured_formatting?.main_text || p.description,
                  secondaryText: p.structured_formatting?.secondary_text || '',
                  source: 'google'
                })));
                googleResults = true;
              }
              resolve();
            });
          });
        } catch (e) {
          console.warn("Google Places API failed, falling back to OSM", e);
        }
      }

      // Fallback to OpenStreetMap (Nominatim) if Google Places fails or returns nothing
      if (!googleResults) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=5`);
          const data = await res.json();
          if (data && data.length > 0) {
            setPredictions(data.map((p: any) => ({
              id: p.place_id,
              mainText: p.display_name.split(',')[0],
              secondaryText: p.display_name.split(',').slice(1).join(',').trim(),
              source: 'osm',
              lat: parseFloat(p.lat),
              lng: parseFloat(p.lon)
            })));
          } else {
            setPredictions([]);
          }
        } catch (e) {
          console.error("OSM search failed", e);
          setPredictions([]);
        }
      }
    };
    
    // Debounce search
    const timer = setTimeout(() => {
      searchPlaces();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchValue, placesLib]);

  const handleSelectPrediction = (prediction: any) => {
    if (prediction.source === 'osm') {
      onSelectPlace(
        { lat: prediction.lat, lng: prediction.lng },
        `${prediction.mainText}, ${prediction.secondaryText}`,
        prediction.mainText
      );
      return;
    }
    
    if (prediction.source === 'google' && placesService) {
      placesService.getDetails({ placeId: prediction.id }, (place, status) => {
        if (status === placesLib.PlacesServiceStatus.OK && place && place.geometry?.location) {
          onSelectPlace(
            { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
            place.formatted_address || '',
            place.name || ''
          );
        }
      });
    }
  };

  const handleGo = () => { if (predictions.length > 0) { handleSelectPrediction(predictions[0]); } };

  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - startY.current;
    if (delta > 0) {
      setOffsetY(delta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (offsetY > 120) {
      onClose();
    } else {
      setOffsetY(0);
    }
  };

  const handleMicClick = () => {
    if (isListening) return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchValue(transcript);
      
      // Auto-trigger a text search with the transcript
      setSearchValue(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };


  const getDistanceStr = (placeLoc?: google.maps.LatLng) => {
    if (!map || !placeLoc) return '';
    const center = map.getCenter();
    if (!center) return '';
    const lat1 = center.lat();
    const lon1 = center.lng();
    const lat2 = placeLoc.lat();
    const lon2 = placeLoc.lng();

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    
    if (d < 1) return `${Math.round(d * 1000)} m`;
    return `${d.toFixed(1)} km`;
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/60 animate-fade-in pointer-events-auto">
      {/* Invisible click area to close sheet */}
      <div className="flex-1 w-full" onClick={onClose} />
      
      {/* Bottom Sheet Container */}
      <div 
        className="w-full h-[92vh] bg-[#1C1C1E] rounded-t-[24px] flex flex-col relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ 
          transform: `translateY(${offsetY}px)`, 
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' 
        }}
      >
        
        {/* Drag Handle Area */}
        <div 
          className="w-full pt-2.5 pb-5 flex justify-center cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 bg-[#D1D1D6] rounded-full opacity-40 pointer-events-none" />
        </div>

        {/* Header */}
        <div className="px-6 flex justify-between items-center mb-6">
          <h2 className="text-white text-[22px] font-bold tracking-tight">Buscar Endereço</h2>
          <button className="text-[#0A84FF] text-[15px] font-medium" onClick={onClose}>Fechar</button>
        </div>

        {/* Recent Section */}
        <div className="px-6 flex-1 mb-6 overflow-y-auto">
          <h3 className="text-white text-[17px] font-bold mb-3">{isSearching ? 'Resultados' : 'Digite para buscar'}</h3>
          
          <div className="flex flex-col">
            {predictions.length > 0 ? (
              predictions.map((place, index) => (
                <RecentItem
                  key={place.id || index}
                  title={place.mainText}
                  subtitle={place.secondaryText}
                  distance={''}
                  border={index !== predictions.length - 1}
                  onClick={() => handleSelectPrediction(place)}
                />
              ))
            ) : (
              <div className="text-[#8E8E93] text-[15px] py-4">
                {isSearching ? 'Nenhum resultado.' : 'Busque por um CEP ou endereço.'}
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="px-4 pb-4">
          <div className={`h-[44px] bg-[#2C2C2E] rounded-[14px] flex items-center px-3 transition-colors ${isListening ? 'ring-2 ring-[#0A84FF]' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text"
              placeholder={isListening ? "Ouvindo..." : "Para onde vamos?"}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGo()}
              className="ml-2 w-full bg-transparent outline-none text-white text-[16px] placeholder:text-[#8E8E93]"
            />
            <button 
              onClick={handleMicClick}
              className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-[#0A84FF] text-white' : 'text-[#8E8E93] hover:text-white'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mock iOS Keyboard */}
        <div className="h-[291px] w-full bg-[#1C1C1E] border-t border-[rgba(255,255,255,0.05)] flex flex-col pb-8 pt-2">
           {/* Keyboard Top Row */}
           <div className="flex justify-between px-1 mb-3 text-white text-[22px] font-medium gap-1.5">
             {['q','w','e','r','t','y','u','i','o','p'].map(char => <Key key={char} char={char} />)}
           </div>
           {/* Second Row */}
           <div className="flex justify-center gap-1.5 px-6 mb-3 text-white text-[22px] font-medium">
             {['a','s','d','f','g','h','j','k','l'].map(char => <Key key={char} char={char} />)}
           </div>
           {/* Third Row */}
           <div className="flex justify-between px-1.5 mb-3 text-white text-[22px] font-medium gap-1.5">
             <div className="w-[42px] h-[42px] bg-[#3A3A3C] rounded-[5px] flex items-center justify-center shadow-sm shadow-black/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
             </div>
             {['z','x','c','v','b','n','m'].map(char => <Key key={char} char={char} />)}
             <div className="w-[42px] h-[42px] bg-[#3A3A3C] rounded-[5px] flex items-center justify-center shadow-sm shadow-black/20">
                <svg width="22" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2zM18 9l-6 6M12 9l6 6"/></svg>
             </div>
           </div>
           {/* Bottom Row */}
           <div className="flex justify-between px-1.5 gap-1.5">
             <div className="w-[88px] h-[42px] bg-[#3A3A3C] rounded-[5px] flex items-center justify-center text-[16px] text-white font-normal tracking-wide shadow-sm shadow-black/20">123</div>
             <div className="flex-1 h-[42px] bg-[#4C4C4E] rounded-[5px] flex items-center justify-center text-[16px] text-white font-normal tracking-wide shadow-sm shadow-black/20">space</div>
             <div 
               onClick={handleGo}
               className="w-[88px] h-[42px] bg-[#0A84FF] rounded-[5px] flex items-center justify-center text-[16px] text-white font-medium tracking-wide shadow-sm shadow-black/20 cursor-pointer active:opacity-80 transition-opacity"
             >
               GO
             </div>
           </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white rounded-full z-10" />
      </div>
    </div>
  );
}

const CategoryIcon = ({ icon, label, bgColor, isActive, onClick }: any) => (
  <div 
    className={`flex flex-col items-center cursor-pointer transition-transform ${isActive ? 'scale-110' : 'active:scale-95'}`}
    onClick={onClick}
  >
    <div 
      className={`w-[48px] h-[48px] rounded-full flex items-center justify-center mb-2 text-white ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C1C1E]' : ''}`} 
      style={{ backgroundColor: bgColor }}
    >
      {icon}
    </div>
    <span className={`text-[11px] font-medium tracking-tight truncate w-[56px] text-center ${isActive ? 'text-white' : 'text-[#8E8E93]'}`}>{label}</span>
  </div>
);

const RecentItem = ({ title, subtitle, distance, border = true, onClick }: any) => (
  <div 
    className={`flex items-start py-3 cursor-pointer active:opacity-70 ${border ? 'border-b border-[rgba(255,255,255,0.08)]' : ''}`} 
    onClick={onClick}
  >
    <div className="mt-0.5 mr-4 shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10" />
         <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <div className="flex flex-col flex-1 min-w-0 pr-3">
      <span className="text-white text-[16px] font-bold tracking-tight leading-tight truncate">{title}</span>
      <span className="text-[#8E8E93] text-[13px] leading-snug mt-0.5 truncate">{subtitle}</span>
    </div>
    <div className="text-[#8E8E93] text-[13px] font-medium pt-0.5 shrink-0">
      {distance}
    </div>
  </div>
);

const Key: React.FC<{ char: string }> = ({ char }) => (
  <div className="flex-1 max-w-[32px] h-[42px] bg-[#4C4C4E] rounded-[5px] flex items-center justify-center pb-1 shadow-sm shadow-black/20 text-white">
    {char}
  </div>
)

