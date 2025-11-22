import express from 'express';
import { getLikedComics, addLike, removeLike } from '../controllers/likesController.js';

const router = express.Router();

router.get('/:userId', getLikedComics);
router.post('/', addLike);
router.delete('/', removeLike);

export default router;