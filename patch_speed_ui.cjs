const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const oldSpeedUI = `{/* Current Speed */}
        <div className={\`w-[52px] h-[52px] flex items-center justify-center rounded-full transition-colors duration-200 \${isOverspeeding ? 'bg-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.3)]' : 'bg-transparent'}\`}>
          <span className="text-white text-[28px] font-bold tracking-tight drop-shadow-md">
            {!gpsSignal || currentSpeed === null ? "--" : currentSpeed}
          </span>
        </div>`;

const newSpeedUI = `{/* Current Speed Gauge */}
        <div className={\`w-[60px] h-[64px] flex flex-col items-center justify-center rounded-[16px] backdrop-blur-md transition-colors duration-200 shadow-xl \${isOverspeeding ? 'bg-[#FF3B30]/90 border border-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.4)]' : 'bg-[#1C1C1E]/80 border border-white/10'}\`}>
          <span className="text-white text-[28px] leading-none font-bold tracking-tight drop-shadow-md mt-1">
            {!gpsSignal || currentSpeed === null ? "--" : currentSpeed}
          </span>
          <span className="text-white/60 text-[11px] font-bold tracking-wider mt-0.5">
            km/h
          </span>
        </div>`;

code = code.replace(oldSpeedUI, newSpeedUI);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
