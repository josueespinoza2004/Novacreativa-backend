import express from 'express';
import { createIdea, getMyIdeas, deleteIdea } from '../controllers/ideaController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de ideas requieren token JWT activo
router.post('/', verifyToken, createIdea);
router.get('/', verifyToken, getMyIdeas);
router.delete('/:id', verifyToken, deleteIdea);

export default router;