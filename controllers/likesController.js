import { pool } from "../models/database.js";

// Get liked comics for authenticated user
export const getLikedComics = async (req, res) => {
  try {
    // Get userId from session (req.user)
    const userId = req.user.googleid;
    console.log(`📥 GET /api/likes - Fetching likes for user: ${userId}`);

    const result = await pool.query(
      "SELECT comic_id FROM user_likes WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const likedComics = result.rows.map((row) => row.comic_id);
    console.log(`✅ Returning ${likedComics.length} liked comics from Neon DB`);

    res.json({
      success: true,
      likedComics: likedComics,
      count: likedComics.length,
      source: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);

    // If table doesn't exist or user has no likes, return empty array
    if (
      error.message.includes('relation "user_likes" does not exist') ||
      error.message.includes("user_id")
    ) {
      console.log("No likes found, returning empty array");
      return res.json({
        success: true,
        likedComics: [],
        count: 0,
        source: "neon-database",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch liked comics",
    });
  }
};

// Add a like
export const addLike = async (req, res) => {
  try {
    // Get userId from session, comicId from body
    const userId = req.user.googleid;
    const { comicId } = req.body;

    if (!comicId) {
      return res.status(400).json({
        success: false,
        error: "Comic ID is required",
      });
    }

    console.log(`📤 POST /api/likes - User ${userId} liking comic ${comicId}`);

    // Ensure user exists in database first
    await pool.query(
      `INSERT INTO users (googleid, name, email, picture) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (googleid) DO NOTHING`,
      [userId, req.user.name, req.user.email, req.user.picture]
    );

    const result = await pool.query(
      "INSERT INTO user_likes (user_id, comic_id) VALUES ($1, $2) ON CONFLICT (user_id, comic_id) DO NOTHING RETURNING *",
      [userId, comicId]
    );

    console.log("✅ Like saved to Neon DB");
    res.status(201).json({
      success: true,
      message: `Comic ${comicId} liked successfully`,
      liked: result.rows.length > 0,
      savedTo: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);

    // Handle foreign key constraint error
    if (error.message.includes("foreign key constraint")) {
      return res.status(400).json({
        success: false,
        error: "User not found in database. Please try logging in again.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to save like",
    });
  }
};

// Remove a like
export const removeLike = async (req, res) => {
  try {
    // Get userId from session, comicId from body
    const userId = req.user.googleid;
    const { comicId } = req.body;

    if (!comicId) {
      return res.status(400).json({
        success: false,
        error: "Comic ID is required",
      });
    }

    console.log(
      `🗑️ DELETE /api/likes - User ${userId} unliking comic ${comicId}`
    );

    const result = await pool.query(
      "DELETE FROM user_likes WHERE user_id = $1 AND comic_id = $2 RETURNING id",
      [userId, comicId]
    );

    console.log("✅ Like removed from Neon DB");
    res.json({
      success: true,
      message: `Comic ${comicId} unliked successfully`,
      removed: result.rows.length > 0,
      removedFrom: "neon-database",
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove like",
    });
  }
};
