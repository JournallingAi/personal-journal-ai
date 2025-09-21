const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        mood VARCHAR(50),
        tags TEXT[],
        ai_insight TEXT,
        mood_follow_up JSONB,
        capability_assessment JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create otp_store table (for temporary OTP storage)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_store (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Database helper functions
const db = {
  // User operations
  async createUser(phoneNumber, name, email) {
    const result = await pool.query(
      'INSERT INTO users (phone_number, name, email) VALUES ($1, $2, $3) RETURNING *',
      [phoneNumber, name, email]
    );
    return result.rows[0];
  },

  async getUserByPhone(phoneNumber) {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
    return result.rows[0];
  },

  // Entry operations
  async createEntry(userId, content, mood, tags, aiInsight, moodFollowUp, capabilityAssessment) {
    const result = await pool.query(
      'INSERT INTO entries (user_id, content, mood, tags, ai_insight, mood_follow_up, capability_assessment) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, content, mood, tags, aiInsight, moodFollowUp, capabilityAssessment]
    );
    return result.rows[0];
  },

  async getEntriesByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM entries WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );
    return result.rows;
  },

  async updateEntry(entryId, updates) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [entryId, ...Object.values(updates)];
    const result = await pool.query(
      `UPDATE entries SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteEntry(entryId) {
    await pool.query('DELETE FROM entries WHERE id = $1', [entryId]);
  },

  // OTP operations
  async storeOTP(phoneNumber, otp, expiresAt) {
    await pool.query(
      'INSERT INTO otp_store (phone_number, otp, expires_at) VALUES ($1, $2, $3)',
      [phoneNumber, otp, expiresAt]
    );
  },

  async getOTP(phoneNumber) {
    const result = await pool.query(
      'SELECT * FROM otp_store WHERE phone_number = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phoneNumber]
    );
    return result.rows[0];
  },

  async deleteOTP(phoneNumber) {
    await pool.query('DELETE FROM otp_store WHERE phone_number = $1', [phoneNumber]);
  },

  // Analytics
  async getMoodAnalytics(userId) {
    const result = await pool.query(
      'SELECT mood, COUNT(*) as count FROM entries WHERE user_id = $1 AND mood IS NOT NULL GROUP BY mood',
      [userId]
    );
    return result.rows.reduce((acc, row) => {
      acc[row.mood] = parseInt(row.count);
      return acc;
    }, {});
  }
};

module.exports = { pool, initDatabase, db };
