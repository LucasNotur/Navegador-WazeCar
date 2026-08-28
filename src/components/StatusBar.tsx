import React, { useState, useEffect } from 'react';

interface StatusBarProps {
  title?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ title }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-between items-center px-6 pt-3 pb-2 z-50 relative pointer-events-none">
      {/* Time */}
      <span className="text-white text-[15px] font-semibold tracking-wide w-1/3">
        {time}
      </span>

      {/* Middle Title */}
      <div className="w-1/3 flex justify-center">
        {title && (
          <span className="text-[#C7C7CC] text-[13px] font-semibold tracking-[0.1em] uppercase">
            {title}
          </span>
        )}
      </div>

      {/* Icons */}
      <div className="flex items-center justify-end gap-1.5 text-white w-1/3">
        {/* Cell Signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="8" width="3" height="4" rx="1" fill="white" />
          <rect x="6" y="5" width="3" height="7" rx="1" fill="white" />
          <rect x="11" y="2" width="3" height="10" rx="1" fill="white" />
          <rect x="16" y="0" width="3" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
        </svg>

        {/* Wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 11C8.82843 11 9.5 10.3284 9.5 9.5C9.5 8.67157 8.82843 8 8 8C7.17157 8 6.5 8.67157 6.5 9.5C6.5 10.3284 7.17157 11 8 11Z" fill="white" />
          <path d="M11.666 6.31301C10.7417 5.48526 9.49755 4.97548 8.12502 4.97548C6.75249 4.97548 5.50835 5.48526 4.58405 6.31301" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M14.9205 3.40027C13.2384 1.89531 10.9749 0.957545 8.47728 0.957545C5.97968 0.957545 3.71617 1.89531 2.03406 3.40027" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-0.5">
          <rect x="1" y="1" width="20" height="10" rx="3" stroke="white" strokeWidth="1.2" opacity="0.5"/>
          <rect x="3" y="3" width="12" height="6" rx="1" fill="white" />
          <path d="M23 4C23.5523 4 24 4.44772 24 5V7C24 7.55228 23.5523 8 23 8V4Z" fill="white" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
};
