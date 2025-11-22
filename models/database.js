import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

// Neon PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create tables if they don't exist
export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_likes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        comic_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, comic_id)
      );
      
      -- New table for lists
      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        list_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, list_name)
      );
      
      -- Updated table for list items
      CREATE TABLE IF NOT EXISTS list_items (
        id SERIAL PRIMARY KEY,
        list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
        comic_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(list_id, comic_id)
      );
    `);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};