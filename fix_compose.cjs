const fs = require('fs');

const composePath = 'c:/Users/talibe/Documents/YARWAY/TamCP/docker-compose.yml';
let compose = fs.readFileSync(composePath, 'utf8');

// Add caddy volumes to frontend service
compose = compose.replace(
  /    networks:\n      - tamcp-network\n\nvolumes:/,
  `    volumes:
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - tamcp-network

volumes:
  caddy_data:
  caddy_config:`
);

fs.writeFileSync(composePath, compose);
console.log('docker-compose updated with caddy volumes.');
