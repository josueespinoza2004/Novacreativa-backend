import express from 'express';
import { getAllIdeasForAdmin, updateIdeaStatus, sendMessage, getMessages } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // Tu middleware de autenticación existente

const router = express.Router();

router.get('/ideas', verifyToken, getAllIdeasForAdmin);
router.put('/ideas/:id/status', verifyToken, updateIdeaStatus);
router.get('/ideas/:ideaId/messages', verifyToken, getMessages);
router.post('/ideas/:ideaId/messages', verifyToken, sendMessage);

export default router;