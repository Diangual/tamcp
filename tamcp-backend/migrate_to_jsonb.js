const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tamcp';

const pool = new Pool({
  connectionString,
});

const SYNC_TABLES = [
  'campaigns',
  'users',
  'campaign_team',
  'patients',
  'consultations',
  'medications',
  'stock_entries',
  'dispensations'
];

async function migrateData() {
  try {
    console.log('Début de la migration...');
    
    // Create new tables
    for (const table of SYNC_TABLES) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          deleted INTEGER DEFAULT 0,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(`Table ${table} (Document Store) créée/vérifiée.`);
    }

    // Migrate data from legacy tables
    for (const table of SYNC_TABLES) {
      console.log(`Migration des données pour ${table}...`);
      const legacyTable = 'legacy_' + table;
      
      try {
        const res = await pool.query(`SELECT row_to_json(t) as json_data FROM ${legacyTable} t`);
        const rows = res.rows;
        
        let count = 0;
        for (const row of rows) {
          const data = row.json_data;
          
          let id = data.id;
          if (!id && table === 'campaign_team') {
            id = `${data.campaignId}_${data.userId}`;
          }
          if (!id) {
            console.log(`Pas d'ID trouvé pour une ligne de ${table}, on l'ignore.`);
            continue;
          }

          const updatedAt = data.updatedAt || data.createdAt || new Date().toISOString();
          const deleted = data.deletedAt ? 1 : 0;
          
          await pool.query(`
            INSERT INTO ${table} (id, data, deleted, updatedAt)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING
          `, [id, JSON.stringify(data), deleted, updatedAt]);
          count++;
        }
        console.log(`${count} lignes migrées pour la table ${table}.`);
      } catch (err) {
        console.error(`Erreur lors de la migration de ${legacyTable}: `, err.message);
      }
    }

    console.log('Migration terminée !');
  } catch (err) {
    console.error('Erreur globale:', err);
  } finally {
    pool.end();
  }
}

migrateData();
