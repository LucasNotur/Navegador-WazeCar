const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

code = code.replace("let heading = userHeading;", "let heading = headingRef.current;");

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
