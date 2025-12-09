import { pool } from "../models/database.js";

// Create a new list
export const createList = async (req, res) => {
  try {
    // Get userId from session, listName from body
    const userId = req.user.googleid;
    const { listName } = req.body;

    if (!listName || listName.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "List name is required",
      });
    }

    console.log(
      `📤 POST /api/lists - User ${userId} creating list "${listName}"`
    );

    // Ensure user exists in database
    await pool.query(
      `INSERT INTO users (googleid, name, email, picture) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (googleid) DO NOTHING`,
      [userId, req.user.name, req.user.email, req.user.picture]
    );

    const result = await pool.query(
      "INSERT INTO lists (user_id, list_name) VALUES ($1, $2) ON CONFLICT (user_id, list_name) DO NOTHING RETURNING *",
      [userId, listName]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        error: `List "${listName}" already exists`,
      });
    }

    console.log("✅ List created in Neon DB");
    res.status(201).json({
      success: true,
      message: `List "${listName}" created successfully`,
      list: {
        id: result.rows[0].id,
        name: result.rows[0].list_name,
        createdAt: result.rows[0].created_at,
      },
      savedTo: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);

    if (error.message.includes("foreign key constraint")) {
      return res.status(400).json({
        success: false,
        error: "User not found in database. Please try logging in again.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create list",
    });
  }
};

// Get all lists for authenticated user
export const getLists = async (req, res) => {
  try {
    // Get userId from session
    const userId = req.user.googleid;
    console.log(`📥 GET /api/lists - Fetching lists for user: ${userId}`);

    // Get lists with comic counts
    const result = await pool.query(
      `SELECT 
        l.id,
        l.list_name,
        l.created_at,
        COUNT(li.comic_id) as comic_count,
        COALESCE(ARRAY_AGG(li.comic_id) FILTER (WHERE li.comic_id IS NOT NULL), '{}') as comic_ids
       FROM lists l
       LEFT JOIN list_items li ON l.id = li.list_id
       WHERE l.user_id = $1
       GROUP BY l.id, l.list_name, l.created_at
       ORDER BY l.created_at DESC`,
      [userId]
    );

    // Transform into frontend format
    const lists = {};
    result.rows.forEach((row) => {
      lists[row.list_name] = row.comic_ids;
    });

    console.log(`✅ Returning ${Object.keys(lists).length} lists from Neon DB`);
    res.json({
      success: true,
      lists: lists,
      source: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);

    // If no lists found, return empty object
    if (error.message.includes('relation "lists" does not exist')) {
      console.log("No lists found, returning empty object");
      return res.json({
        success: true,
        lists: {},
        source: "neon-database",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch lists",
    });
  }
};

// Rename list
export const renameList = async (req, res) => {
  try {
    const userId = req.user.googleid;
    const { listName } = req.params;
    const { newListName } = req.body;

    console.log(
      `✏️ PUT /api/lists/${listName}/rename - User ${userId} renaming list "${listName}" to "${newListName}"`
    );

    if (!newListName || newListName.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "New list name is required",
      });
    }

    if (newListName === listName) {
      return res.status(400).json({
        success: false,
        error: "New list name must be different from current name",
      });
    }

    // Check if new list name already exists
    const existingList = await pool.query(
      "SELECT id FROM lists WHERE user_id = $1 AND list_name = $2",
      [userId, newListName]
    );

    if (existingList.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `List "${newListName}" already exists`,
      });
    }

    // Update list name
    const result = await pool.query(
      "UPDATE lists SET list_name = $1 WHERE user_id = $2 AND list_name = $3 RETURNING *",
      [newListName, userId, listName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `List "${listName}" not found`,
      });
    }

    console.log(
      `✅ List renamed from "${listName}" to "${newListName}" in Neon DB`
    );
    res.json({
      success: true,
      message: `List renamed to "${newListName}" successfully`,
      oldName: listName,
      newName: newListName,
      updatedAt: result.rows[0].updated_at || result.rows[0].created_at,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to rename list",
    });
  }
};

// Delete list
export const deleteList = async (req, res) => {
  try {
    const userId = req.user.googleid;
    const { listName } = req.params;

    console.log(
      `🗑️ DELETE /api/lists/${listName} - User ${userId} deleting list "${listName}"`
    );

    // First, get the list ID
    const listResult = await pool.query(
      "SELECT id FROM lists WHERE user_id = $1 AND list_name = $2",
      [userId, listName]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `List "${listName}" not found`,
      });
    }

    const listId = listResult.rows[0].id;

    // Start a transaction to delete list items first, then the list
    await pool.query("BEGIN");

    try {
      // Delete all comics from this list
      await pool.query("DELETE FROM list_items WHERE list_id = $1", [listId]);

      // Delete the list itself
      const deleteResult = await pool.query(
        "DELETE FROM lists WHERE id = $1 RETURNING list_name",
        [listId]
      );

      await pool.query("COMMIT");

      console.log(`✅ List "${listName}" deleted from Neon DB`);
      res.json({
        success: true,
        message: `List "${listName}" deleted successfully`,
        deleted: true,
        deletedItemsCount: deleteResult.rows.length,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete list",
    });
  }
};

// Add comic to list
export const addToList = async (req, res) => {
  try {
    // Get userId from session, listName from params, comicId from body
    const userId = req.user.googleid;
    const { listName } = req.params;
    const { comicId } = req.body;

    if (!comicId) {
      return res.status(400).json({
        success: false,
        error: "Comic ID is required",
      });
    }

    console.log(
      `📤 POST /api/lists/${listName}/add - Adding comic ${comicId} to list "${listName}"`
    );

    // First get the list ID
    const listResult = await pool.query(
      "SELECT id FROM lists WHERE user_id = $1 AND list_name = $2",
      [userId, listName]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `List "${listName}" not found`,
      });
    }

    const listId = listResult.rows[0].id;

    // Add comic to list
    const result = await pool.query(
      "INSERT INTO list_items (list_id, comic_id) VALUES ($1, $2) ON CONFLICT (list_id, comic_id) DO NOTHING RETURNING *",
      [listId, comicId]
    );

    console.log("✅ Comic added to list in Neon DB");
    res.status(201).json({
      success: true,
      message: `Comic ${comicId} added to list "${listName}" successfully`,
      added: result.rows.length > 0,
      savedTo: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);

    if (error.message.includes("foreign key constraint")) {
      return res.status(404).json({
        success: false,
        error: "List not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to add to list",
    });
  }
};

// Remove comic from list
export const removeFromList = async (req, res) => {
  try {
    // Get userId from session, listName from params, comicId from body
    const userId = req.user.googleid;
    const { listName } = req.params;
    const { comicId } = req.body;

    console.log(
      `🗑️ POST /api/lists/${listName}/remove - User ${userId} removing comic ${comicId} from list "${listName}"`
    );

    if (!comicId) {
      return res.status(400).json({
        success: false,
        error: "Comic ID is required",
      });
    }

    // Convert comicId to string for consistent database comparison
    const comicIdStr = comicId.toString();

    // First get the list ID
    const listResult = await pool.query(
      "SELECT id FROM lists WHERE user_id = $1 AND list_name = $2",
      [userId, listName]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `List "${listName}" not found`,
      });
    }

    const listId = listResult.rows[0].id;

    // Remove comic from list - using comicId as string
    const result = await pool.query(
      "DELETE FROM list_items WHERE list_id = $1 AND comic_id = $2 RETURNING id",
      [listId, comicIdStr]
    );

    console.log(
      `✅ Comic ${comicIdStr} removed from list "${listName}" in Neon DB`
    );

    res.json({
      success: true,
      message: `Comic ${comicIdStr} removed from list "${listName}" successfully`,
      removed: result.rows.length > 0,
      removedFrom: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove from list",
    });
  }
};
