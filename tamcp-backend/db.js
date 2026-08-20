const { Pool } = require('pg');
require('dotenv').config();

// Default connection string if not provided in .env
// We assume a local postgres instance with a database named 'tamcp'
let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.DB_USER) {
  connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
}

connectionString = connectionString || 'postgresql://postgres:postgres@localhost:5432/tamcp';

const pool = new Pool({
  connectionString,
});

// Test the connection
pool.connect()
  .then(client => {
    console.log('Connecté à la base de données PostgreSQL.');
    client.release();
  })
  .catch(err => {
    console.error('Erreur de connexion à PostgreSQL :', err.message);
  });

// The list of tables to synchronize
const SYNC_TABLES = [
  'campaigns',
  'users',
  'campaign_team',
  'patients',
  'consultations',
  'medications',
  'stock_entries',
  'dispensations',
  'announcements'
];

// Initialize schema
async function initDB() {
  try {
    for (const table of SYNC_TABLES) {
      // We use a generic Document Store approach for flexibility:
      // id: the string primary key
      // data: the JSON representation of the entity (JSONB is better for PostgreSQL)
      // deleted: 1 if deleted, 0 otherwise
      // updatedAt: the timestamp of the last modification on the server
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          deleted INTEGER DEFAULT 0,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    await initDefaultUser();
    console.log('Schéma de base de données initialisé avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Initialize default admin user if users table is empty
async function initDefaultUser() {
  const bcrypt = require('bcryptjs');
  
  const res = await pool.query('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(res.rows[0].count, 10);
  
  if (userCount === 0) {
    const adminId = 'backend-admin-id-001';
    const now = new Date().toISOString();
    const adminData = {
      id: adminId,
      firstName: 'Admin',
      lastName: 'Système',
      email: 'admin@tamcp.com',
      role: 'admin',
      specialty: 'Administration',
      preferredLang: 'fr',
      passwordHash: bcrypt.hashSync('admin', 10),
      createdAt: now,
      updatedAt: now,
      _syncStatus: 'synced'
    };
    
    await pool.query(
      'INSERT INTO users (id, data, deleted, updatedAt) VALUES ($1, $2, 0, $3)',
      [adminId, JSON.stringify(adminData), now]
    );
      
    console.log('Default admin user created: admin@tamcp.com / admin');
  }
}

// Ensure tables exist on startup
initDB();

module.exports = {
  pool,
  SYNC_TABLES
};
