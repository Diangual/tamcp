const fs = require('fs');
const path = 'c:/Users/talibe/Documents/YARWAY/TamCP/tamcp-backend/server.js';
let content = fs.readFileSync(path, 'utf8');

const routes = `
// Route : Obtenir l'état du setup initial
app.get('/api/auth/setup-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0].count, 10);
    res.json({ setupRequired: userCount === 0 });
  } catch (error) {
    console.error('Erreur setup-status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route : Créer le premier administrateur
app.post('/api/auth/setup', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0].count, 10);
    
    if (userCount > 0) {
      return res.status(403).json({ error: 'L\\'application a déjà été initialisée. Vous ne pouvez pas créer de compte setup.' });
    }
    
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Données invalides ou mot de passe trop court.' });
    }
    
    const adminId = 'backend-admin-id-' + Date.now();
    const now = new Date().toISOString();
    
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const adminData = {
      id: adminId,
      firstName,
      lastName,
      email,
      role: 'admin',
      specialty: 'Administration',
      preferredLang: 'fr',
      passwordHash,
      createdAt: now,
      updatedAt: now,
      _syncStatus: 'synced'
    };
    
    await pool.query(
      'INSERT INTO users (id, data, deleted, updatedAt) VALUES ($1, $2, 0, $3)',
      [adminId, JSON.stringify(adminData), now]
    );
    
    res.json({ message: 'Compte administrateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur setup:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
`;

// Insert the routes before app.post('/api/auth/login')
content = content.replace("app.post('/api/auth/login'", routes + "\napp.post('/api/auth/login'");
fs.writeFileSync(path, content);
console.log('Setup routes added to server.js');
