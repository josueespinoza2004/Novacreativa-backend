import express from 'express';
import {
    getAllIdeasForAdmin,
    updateIdeaStatus,
    sendMessage,
    getMessages
} from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protege TODAS las rutas de este archivo: primero valida el token y luego exige rol Admin
router.use(verifyToken, verifyAdmin);

router.get('/ideas', getAllIdeasForAdmin);
router.put('/ideas/:id/status', updateIdeaStatus);
router.get('/ideas/:ideaId/messages', getMessages);
router.post('/ideas/:ideaId/messages', sendMessage);

export default router;