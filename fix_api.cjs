const fs = require('fs');

const loginPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-app/src/pages/auth/LoginPage/LoginPage.jsx';
let loginCode = fs.readFileSync(loginPath, 'utf8');
loginCode = loginCode.replace("import api from '../../../services/api';", "import { api } from '../../../sync/api';");
fs.writeFileSync(loginPath, loginCode);

const setupPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-app/src/pages/auth/SetupPage/SetupPage.jsx';
let setupCode = fs.readFileSync(setupPath, 'utf8');
setupCode = setupCode.replace("import api from '../../../services/api';", "import { api } from '../../../sync/api';");
// Also in setup effect, wait, api.get might return data differently. fetchWrapper returns parsed json directly!
// So res is the parsed JSON, not an axios response!
setupCode = setupCode.replace(/error\.response\?\.data\?\.error/g, 'error.message');
// Check setup effect in LoginPage.jsx!
loginCode = loginCode.replace(/res\.data && res\.data\.setupRequired/, 'res && res.setupRequired');
loginCode = loginCode.replace(/res\.data\?\.setupRequired/, 'res?.setupRequired');
fs.writeFileSync(loginPath, loginCode);

fs.writeFileSync(setupPath, setupCode);

console.log('Fixed imports and api responses.');
