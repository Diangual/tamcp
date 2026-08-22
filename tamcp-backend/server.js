const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool, SYNC_TABLES } = require('./db');

const app = express();

// Trust le premier proxy (Caddy/Docker) pour que le rate limiter voie la vraie IP client
app.set('trust proxy', 1);

// --- 1. SÉCURITÉ DE BASE ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- 2. LIMITATION DES REQUÊTES (RATE LIMITING) ---
// Limiteur Global (adapté pour le hors-ligne / longues campagnes avec synchronisation massive)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // 50 000 requêtes par fenêtre — supporte les longues synchronisations après des campagnes hors-ligne
  message: { error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.' }
});

// Limiteur pour l'Authentification (anti Brute-Force mais adapté au terrain)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // 10 000 tentatives — adapté aux équipes de terrain partageant une même IP
  message: { error: 'Trop de tentatives, veuillez réessayer dans 15 minutes.' }
});

app.use('/api', globalLimiter);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tamcp_super_secret_dev_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '120d'; // 4 mois

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
};

// Configurer le transporteur Nodemailer pour Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// --- NOTIFICATIONS ENDPOINTS ---
app.post('/api/notify/stock', async (req, res) => {
  const { roles, subject, text, campaignName } = req.body;

  const to = process.env.NOTIFICATION_TEST_EMAIL || process.env.GMAIL_USER;

  if (!to || !process.env.GMAIL_USER) {
    return res.status(500).json({ error: "Configuration SMTP incomplète sur le serveur." });
  }

  const mailOptions = {
    from: `"TamCP Alertes" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: subject || `[TamCP - ${campaignName || 'Campagne'}] Rapport d'alertes pharmacie`,
    text: text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé :', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

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
      return res.status(403).json({ error: 'L\'application a déjà été initialisée. Vous ne pouvez pas créer de compte setup.' });
    }
    
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Données invalides ou mot de passe trop court.' });
    }
    
    const adminId = 'backend-admin-id-' + Date.now();
    const now = new Date().toISOString();
    
    // IMPORTANT : normaliser l'email en minuscules pour éviter les problèmes de casse au login
    const normalizedEmail = email.toLowerCase().trim();
    
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const adminData = {
      id: adminId,
      firstName,
      lastName,
      email: normalizedEmail,
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

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  // Normaliser l'email pour garantir la correspondance (fix bug "Identifiants invalides")
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const result = await pool.query(
      `SELECT data FROM users WHERE deleted = 0 AND data->>'email' = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const userRow = result.rows[0];
    const user = typeof userRow.data === 'string' ? JSON.parse(userRow.data) : userRow.data;

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { passwordHash, ...userWithoutHash } = user;
    
    res.json({ token, user: userWithoutHash });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route : Inscription (normalise l'email aussi)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { firstName, lastName, email, password, role, specialty } = req.body;

  if (!firstName || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Données invalides ou mot de passe trop court (min 6).' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Vérifier si l'email existe déjà
    const existing = await pool.query(
      `SELECT id FROM users WHERE deleted = 0 AND data->>'email' = $1`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const userData = {
      id: userId,
      firstName,
      lastName: lastName || '',
      email: normalizedEmail,
      role: (role && role !== 'admin') ? role : 'other',
      specialty: specialty || '',
      preferredLang: 'fr',
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      _syncStatus: 'synced'
    };

    await pool.query(
      'INSERT INTO users (id, data, deleted, updatedAt) VALUES ($1, $2, 0, $3)',
      [userId, JSON.stringify(userData), now]
    );

    const { passwordHash: _, ...userWithoutHash } = userData;
    const token = jwt.sign({ id: userId, email: normalizedEmail, role: userData.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ token, user: userWithoutHash });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route : Mot de passe oublié (Envoi de l'email)
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  
  try {
    const result = await pool.query(`SELECT data FROM users WHERE deleted = 0 AND data->>'email' = $1`, [normalizedEmail]);
    if (result.rows.length > 0) {
      const user = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
      
      const resetToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      
      const resetLink = `${process.env.FRONTEND_URL || 'https://tamcp.org'}/reset-password?token=${resetToken}`;
      
      await transporter.sendMail({
        from: `"TamCP Admin" <${process.env.GMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Réinitialisation de votre mot de passe TamCP',
        text: `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe. Cliquez sur ce lien (valable 1 heure) : \n${resetLink}\n\nSi vous n'avez rien demandé, ignorez cet e-mail.`,
      });
    }
    
    res.json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: "Erreur lors de la procédure de réinitialisation" });
  }
});

// Route : Réinitialiser le mot de passe (Utilisation du token)
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Token invalide ou mot de passe trop court (min 6).' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(`SELECT id, data FROM users WHERE deleted = 0 AND data->>'email' = $1`, [decoded.email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    
    let user = typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data;
    const userId = result.rows[0].id;
    
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    user.updatedAt = new Date().toISOString();
    
    await pool.query(
      `UPDATE users SET data = $1, updatedAt = $2 WHERE id = $3`, 
      [JSON.stringify(user), user.updatedAt, userId]
    );
    
    res.json({ message: "Mot de passe réinitialisé avec succès !" });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(400).json({ error: "Lien invalide ou expiré." });
  }
});

// --- SYNCHRONIZATION ENDPOINTS ---

app.get('/api/sync/pull', authMiddleware, async (req, res) => {
  const since = req.query.since || new Date(0).toISOString();
  
  try {
    const changes = {};
    let hasChanges = false;
    
    for (const table of SYNC_TABLES) {
      const result = await pool.query(
        `SELECT id, data, deleted, updatedAt FROM ${table} WHERE updatedAt > $1`, 
        [since]
      );
      const rows = result.rows;
      
      if (rows.length > 0) {
        hasChanges = true;
        changes[table] = rows.map(row => {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          if (row.deleted) {
            parsed._deleted = true;
          }
          return parsed;
        });
      }
    }

    const serverTimestamp = new Date().toISOString();
    
    res.json({
      changes: hasChanges ? changes : {},
      serverTimestamp
    });
  } catch (err) {
    console.error('Pull Error:', err);
    res.status(500).json({ error: 'Internal server error during pull' });
  }
});

app.post('/api/sync/push', authMiddleware, async (req, res) => {
  const { operations } = req.body;
  if (!operations || !Array.isArray(operations)) {
    return res.status(400).json({ error: 'Invalid operations payload' });
  }

  const results = [];
  const serverTimestamp = new Date().toISOString();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const op of operations) {
      if (!SYNC_TABLES.includes(op.table)) {
        results.push({ status: 'error', message: `Unknown table ${op.table}` });
        continue;
      }

      const id = op.entityId;
      const currentRes = await client.query(`SELECT updatedAt FROM ${op.table} WHERE id = $1`, [id]);
      const currentServerRecord = currentRes.rows.length > 0 ? currentRes.rows[0] : null;

      if (currentServerRecord && new Date(currentServerRecord.updatedat || currentServerRecord.updatedAt) > new Date(op.timestamp)) {
        results.push({ status: 'conflict', message: 'Server has newer version' });
        continue;
      }

      if (op.operation === 'create' || op.operation === 'update') {
        const dataStr = JSON.stringify(op.payload);
        
        await client.query(`
          INSERT INTO ${op.table} (id, data, deleted, updatedAt)
          VALUES ($1, $2, 0, $3)
          ON CONFLICT (id) DO UPDATE SET
            data = EXCLUDED.data,
            deleted = 0,
            updatedAt = EXCLUDED.updatedAt
        `, [id, dataStr, serverTimestamp]);
        
        results.push({ status: 'synced' });
      } else if (op.operation === 'delete') {
        await client.query(`
          UPDATE ${op.table}
          SET deleted = 1, updatedAt = $1
          WHERE id = $2
        `, [serverTimestamp, id]);
        
        results.push({ status: 'synced' });
      } else {
        results.push({ status: 'error', message: `Unknown operation ${op.operation}` });
      }
    }

    await client.query('COMMIT');
    res.json({ results });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Push Error:', err);
    res.status(500).json({ error: 'Internal server error during push' });
  } finally {
    client.release();
  }
});

// Santé du serveur
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Le backend TamCP fonctionne (PostgreSQL).' });
});

app.listen(PORT, () => {
  console.log(`Serveur TamCP Backend démarré sur le port ${PORT}`);
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️ AVERTISSEMENT: GMAIL_USER ou GMAIL_APP_PASSWORD non défini. Les envois d'email échoueront.");
  }
});

// Force le maintien du serveur en vie
setInterval(() => {}, 1000 * 60 * 60);