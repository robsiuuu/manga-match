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

// Create tables if they don't exist - SIMPLE VERSION
export const initDB = async () => {
  try {
    await pool.query(`
      -- Users table for authentication
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        googleid VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_googleid UNIQUE (googleid)
      );
      
      -- User likes table
      CREATE TABLE IF NOT EXISTS user_likes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        comic_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, comic_id),
        CONSTRAINT fk_user_likes_user 
          FOREIGN KEY (user_id) 
          REFERENCES users(googleid) 
          ON DELETE CASCADE
      );
      
      -- Lists table
      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        list_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, list_name),
        CONSTRAINT fk_lists_user 
          FOREIGN KEY (user_id) 
          REFERENCES users(googleid) 
          ON DELETE CASCADE
      );
      
      -- List items table
      CREATE TABLE IF NOT EXISTS list_items (
        id SERIAL PRIMARY KEY,
        list_id INTEGER NOT NULL,
        comic_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(list_id, comic_id),
        CONSTRAINT fk_list_items_list 
          FOREIGN KEY (list_id) 
          REFERENCES lists(id) 
          ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Database tables initialized');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};