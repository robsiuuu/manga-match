import express from 'express';
import likesRouter from './likes.js';
import listsRouter from './lists.js';

const router = express.Router();

router.use('/likes', likesRouter);
router.use('/lists', listsRouter);

export default router;