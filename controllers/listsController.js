import { pool } from '../models/database.js';

export const createList = async (req, res) => {
  try {
    const { userId, listName } = req.body;
    console.log(`📤 POST /api/lists - User ${userId} creating list "${listName}"`);
    
    // Create the list in the lists table
    const result = await pool.query(
      'INSERT INTO lists (user_id, list_name) VALUES ($1, $2) ON CONFLICT (user_id, list_name) DO NOTHING RETURNING *',
      [userId, listName]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'List already exists' 
      });
    }
    
    console.log('✅ List created in Neon DB');
    res.json({ 
      success: true, 
      message: `List "${listName}" created for user ${userId}`,
      savedTo: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

export const getLists = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 GET /api/lists/${userId} - Fetching lists from Neon DB`);
    
    // Get all lists for this user with their comic counts
    const result = await pool.query(
      `SELECT 
        l.id,
        l.list_name,
        l.created_at,
        COUNT(li.comic_id) as comic_count,
        ARRAY_AGG(li.comic_id) FILTER (WHERE li.comic_id IS NOT NULL) as comic_ids
       FROM lists l
       LEFT JOIN list_items li ON l.id = li.list_id
       WHERE l.user_id = $1
       GROUP BY l.id, l.list_name, l.created_at
       ORDER BY l.created_at DESC`,
      [userId]
    );
    
    // Transform into the format your frontend expects
    const lists = {};
    result.rows.forEach(row => {
      lists[row.list_name] = row.comic_ids || [];
    });
    
    console.log(`✅ Returning ${Object.keys(lists).length} lists from Neon DB`);
    res.json({ 
      success: true, 
      lists: lists,
      source: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
};

export const addToList = async (req, res) => {
  try {
    const { listName } = req.params;
    const { userId, comicId } = req.body;
    console.log(`📤 POST /api/lists/${listName}/add - Adding comic ${comicId} to list`);
    
    // First get the list ID
    const listResult = await pool.query(
      'SELECT id FROM lists WHERE user_id = $1 AND list_name = $2',
      [userId, listName]
    );
    
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    const listId = listResult.rows[0].id;
    
    // Add comic to list
    const result = await pool.query(
      'INSERT INTO list_items (list_id, comic_id) VALUES ($1, $2) ON CONFLICT (list_id, comic_id) DO NOTHING RETURNING *',
      [listId, comicId]
    );
    
    console.log('✅ Comic added to list in Neon DB');
    res.json({ 
      success: true, 
      message: `Comic ${comicId} added to list "${listName}"`,
      savedTo: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to add to list' });
  }
};

export const removeFromList = async (req, res) => {
  try {
    const { listName } = req.params;
    const { userId, comicId } = req.body;
    console.log(`🗑️ POST /api/lists/${listName}/remove - Removing comic ${comicId}`);
    
    // First get the list ID
    const listResult = await pool.query(
      'SELECT id FROM lists WHERE user_id = $1 AND list_name = $2',
      [userId, listName]
    );
    
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    const listId = listResult.rows[0].id;
    
    // Remove comic from list
    const result = await pool.query(
      'DELETE FROM list_items WHERE list_id = $1 AND comic_id = $2',
      [listId, comicId]
    );
    
    console.log('✅ Comic removed from list in Neon DB');
    res.json({ 
      success: true, 
      message: `Comic ${comicId} removed from list "${listName}"`,
      removedFrom: 'neon-database'
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to remove from list' });
  }
};