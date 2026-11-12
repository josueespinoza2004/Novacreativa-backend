import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createIdea, getMyIdeas, deleteIdea, sendUserMessage } from '../controllers/ideaController.js';

const router = express.Router();

// Todas las rutas de ideas requieren token JWT activo
router.post('/', verifyToken, createIdea);
router.get('/', verifyToken, getMyIdeas);
router.delete('/:id', verifyToken, deleteIdea);
router.post('/:ideaId/messages', verifyToken, sendUserMessage);

export default router;