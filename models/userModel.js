import { pool } from './database.js';

// Get user by Google ID
export const getUserByGoogleId = async (googleId) => {
  try {
    const query = `
      SELECT id, googleid, name, email, picture, created_at, updated_at 
      FROM users 
      WHERE googleid = $1
    `;
    const { rows } = await pool.query(query, [googleId]);
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting user by Google ID:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const query = `
      SELECT id, googleid, name, email, picture, created_at, updated_at 
      FROM users 
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting user by ID:', error);
    throw error;
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    const { googleid, name, email, picture } = userData;
    
    const query = `
      INSERT INTO users (googleid, name, email, picture) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (googleid) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        picture = EXCLUDED.picture,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, googleid, name, email, picture, created_at, updated_at
    `;
    
    const { rows } = await pool.query(query, [googleid, name, email, picture]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const createNewUser = async (userData) => {
  // Convert array format to object format
  const [googleId, displayName, firstName, lastName, email] = userData;
  return createUser({
    googleid: googleId,
    name: displayName,
    email: email,
    picture: null
  });
};