import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
    createIdea,
    getMyIdeas,
    deleteIdea,
    sendUserMessage,
    markIdeaMessagesAsRead
} from '../controllers/ideaController.js';

const router = express.Router();

router.post('/', verifyToken, createIdea);
router.get('/', verifyToken, getMyIdeas);
router.delete('/:id', verifyToken, deleteIdea);
router.post('/:ideaId/messages', verifyToken, sendUserMessage);
router.patch('/:ideaId/read', verifyToken, markIdeaMessagesAsRead);

export default router;