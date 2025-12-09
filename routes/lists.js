import express from 'express';
import { getLists, addToList, createList, removeFromList } from '../controllers/listsController.js';

const router = express.Router();

router.get('/:userId', getLists);
router.post('/', createList);
router.post('/:listName/add', addToList);
router.post('/:listName/remove', removeFromList);

export default router;