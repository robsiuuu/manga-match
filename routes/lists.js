import express from 'express';
import {
  createList,
  getLists,
  addToList,
  removeFromList,
  renameList,    // Add this
  deleteList     // Add this
} from '../controllers/listsController.js';

const router = express.Router();

// All routes should match these patterns:
router.get('/', getLists);                    // GET /api/lists
router.post('/', createList);                 // POST /api/lists
router.post('/:listName/add', addToList);     // POST /api/lists/:listName/add
router.post('/:listName/remove', removeFromList); // POST /api/lists/:listName/remove
router.put('/:listName/rename', renameList);  // PUT /api/lists/:listName/rename (NEW)
router.delete('/:listName', deleteList);      // DELETE /api/lists/:listName (NEW)

export default router;