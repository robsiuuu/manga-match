import express from 'express';
const router = express.Router();

// Import controllers
import {
  getLikedComics,
  addLike,
  removeLike
} from '../controllers/likesController.js';

import {
  getLists,
  createList,
  addToList,
  removeFromList,
  renameList,    // ADD THIS
  deleteList     // ADD THIS
} from '../controllers/listsController.js';

// Import auth middleware
import { requireAuth } from '../auth/auth.js';

// ============ PUBLIC ROUTES ============

// API info
router.get('/', (req, res) => {
  res.json({ 
    message: 'MangaMatch API',
    version: '1.0.0',
    endpoints: {
      auth: {
        me: 'GET /auth/me',
        google: 'GET /auth/google',
        logout: 'POST /auth/logout'
      },
      api: {
        likes: {
          get: 'GET /api/likes (auth required)',
          add: 'POST /api/likes (auth required)',
          remove: 'DELETE /api/likes (auth required)'
        },
        lists: {
          get: 'GET /api/lists (auth required)',
          create: 'POST /api/lists (auth required)',
          addItem: 'POST /api/lists/:listName/add (auth required)',
          removeItem: 'POST /api/lists/:listName/remove (auth required)',
          rename: 'PUT /api/lists/:listName/rename (auth required)',    // ADD THIS
          delete: 'DELETE /api/lists/:listName (auth required)'         // ADD THIS
        }
      }
    }
  });
});

// ============ PROTECTED ROUTES ============

// Likes routes
router.get('/likes', requireAuth, getLikedComics);
router.post('/likes', requireAuth, addLike);
router.delete('/likes', requireAuth, removeLike);

// Lists routes
router.get('/lists', requireAuth, getLists);
router.post('/lists', requireAuth, createList);
router.post('/lists/:listName/add', requireAuth, addToList);
router.post('/lists/:listName/remove', requireAuth, removeFromList);
router.put('/lists/:listName/rename', requireAuth, renameList);    // ADD THIS
router.delete('/lists/:listName', requireAuth, deleteList);        // ADD THIS

export default router;