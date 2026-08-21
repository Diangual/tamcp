const fs = require('fs');

// 1. Update router.jsx
const routerPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-app/src/router.jsx';
let routerCode = fs.readFileSync(routerPath, 'utf8');

routerCode = routerCode.replace(
  "import LoginPage from './pages/auth/LoginPage/LoginPage';",
  "import LoginPage from './pages/auth/LoginPage/LoginPage';\nimport SetupPage from './pages/auth/SetupPage/SetupPage';"
);

routerCode = routerCode.replace(
  '<Route path="/login" element={<LoginPage />} />',
  '<Route path="/login" element={<LoginPage />} />\n      <Route path="/setup" element={<SetupPage />} />'
);

fs.writeFileSync(routerPath, routerCode);
console.log('router.jsx updated.');

// 2. Update LoginPage.jsx
const loginPath = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-app/src/pages/auth/LoginPage/LoginPage.jsx';
let loginCode = fs.readFileSync(loginPath, 'utf8');

// Change import to include useEffect
loginCode = loginCode.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport api from '../../../services/api';"
);

// Clear initial state
loginCode = loginCode.replace(
  "const [email, setEmail] = useState('admin@tamcp.com');",
  "const [email, setEmail] = useState('');"
);
loginCode = loginCode.replace(
  "const [password, setPassword] = useState('admin');",
  "const [password, setPassword] = useState('');"
);

// Insert useEffect check before handleSubmit
const setupEffect = `
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.data && res.data.setupRequired) {
          navigate('/setup');
        }
      } catch (err) {
        console.error('Error checking setup status', err);
      }
    };
    checkSetup();
  }, [navigate]);

  const handleSubmit = async (e) => {`;

loginCode = loginCode.replace("  const handleSubmit = async (e) => {", setupEffect);

fs.writeFileSync(loginPath, loginCode);
console.log('LoginPage.jsx updated.');
