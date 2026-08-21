const fs = require('fs');

const setupPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-app/src/pages/auth/SetupPage/SetupPage.jsx';
let setupCode = fs.readFileSync(setupPath, 'utf8');
setupCode = setupCode.replace(/'Créer l'Administrateur'/, '"Créer l\\'Administrateur"');
fs.writeFileSync(setupPath, setupCode);
console.log('Fixed syntax error in SetupPage.jsx');
