const fs = require('fs');
let code = fs.readFileSync('src/components/MainMapScreen.tsx', 'utf8');

const oldLogic = `      snap.forEach(doc => {
        const os = doc.data() as ServiceOrder;
        if (os.status !== "concluida") { data.push(os); }
      });`;

const newLogic = `      snap.forEach(doc => {
        const os = doc.data() as ServiceOrder;
        // Filter out orders that are too far in SP if the user is in RJ (simple check based on latitude > -23)
        // Actually, just keep all for now, but let's filter if they are literally in SP center (-23.55) when user is not.
        if (os.status !== "concluida") { 
            // If the OS is one of the initial SP mocks and we are not in SP, we could hide it.
            // But let's just let it be, and ensure the map pans to the user!
            data.push(os); 
        }
      });`;
code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/MainMapScreen.tsx', code);
