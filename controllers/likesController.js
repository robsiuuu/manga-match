import { pool } from '../models/database.js';

export const getLikedComics = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 GET /api/likes/${userId} - Fetching from Neon DB`);
    
    const result = await pool.query(
      'SELECT comic_id FROM user_likes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const likedComics = result.rows.map(row => row.comic_id);
    console.log(`✅ Returning ${likedComics.length} liked comics from Neon DB`);
    
    res.json({ 
      success: true, 
      likedComics: likedComics,
      source: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch liked comics' });
  }
};

export const addLike = async (req, res) => {
  try {
    const { userId, comicId } = req.body;
    console.log(`📤 POST /api/likes - User ${userId} liking comic ${comicId}`);
    
    const result = await pool.query(
      'INSERT INTO user_likes (user_id, comic_id) VALUES ($1, $2) ON CONFLICT (user_id, comic_id) DO NOTHING RETURNING *',
      [userId, comicId]
    );
    
    console.log('✅ Like saved to Neon DB');
    res.json({ 
      success: true, 
      message: `Comic ${comicId} liked by user ${userId}`,
      savedTo: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to save like' });
  }
};

export const removeLike = async (req, res) => {
  try {
    const { userId, comicId } = req.body;
    console.log(`🗑️ DELETE /api/likes - User ${userId} unliking comic ${comicId}`);
    
    const result = await pool.query(
      'DELETE FROM user_likes WHERE user_id = $1 AND comic_id = $2',
      [userId, comicId]
    );
    
    console.log('✅ Like removed from Neon DB');
    res.json({ 
      success: true, 
      message: `Comic ${comicId} unliked by user ${userId}`,
      removedFrom: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to remove like' });
  }
};