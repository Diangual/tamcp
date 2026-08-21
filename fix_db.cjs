const fs = require('fs');
const dbPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-backend/db.js';
let db = fs.readFileSync(dbPath, 'utf8');

// Remove await initDefaultUser();
db = db.replace(/await initDefaultUser\(\);\n/, '');

// Remove the initDefaultUser function definition entirely
db = db.replace(/\/\/ Initialize default admin user if users table is empty[\s\S]*?console\.log\('Default admin user created.*?\n  \}\n\}\n/, '');

fs.writeFileSync(dbPath, db);
console.log('db.js modified.');
