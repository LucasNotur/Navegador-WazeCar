const fs = require('fs');
let code = fs.readFileSync('src/components/NavigationScreen.tsx', 'utf8');

const oldLogic = `          } else if (prevLocRef.current && geometryLibrary) {
            heading = geometryLibrary.spherical.computeHeading(prevLocRef.current, loc);
          }`;

const newLogic = `          } else if (prevLocRef.current && geometryLibrary) {
            const distance = geometryLibrary.spherical.computeDistanceBetween(prevLocRef.current, loc);
            if (distance > 2) {
              heading = geometryLibrary.spherical.computeHeading(prevLocRef.current, loc);
            }
          }`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync('src/components/NavigationScreen.tsx', code);
