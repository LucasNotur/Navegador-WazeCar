const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace(
  /<div className="w-10 h-10 bg-\[#0A84FF\] rounded-full flex items-center justify-center shadow-\[0_0_20px_rgba\(10,132,255,0\.4\)\] border-2 border-white\/20 z-10 relative">/g,
  '<div className="w-10 h-10 bg-[#0A84FF] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] border-2 border-white/20 z-10 relative" style={{ transform: `rotate(${isFollowingUser ? 0 : userHeading}deg)`, transition: "transform 0.3s ease-out" }}>'
);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
