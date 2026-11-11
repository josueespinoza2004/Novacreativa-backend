import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Obtener todas las ideas para el panel de admin
export const getAllIdeasForAdmin = async (req, res) => {
    try {
        const ideas = await prisma.idea.findMany({
            include: { user: true, messages: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ideas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ideas para admin', error: error.message });
    }
};

// 2. Cambiar estado (Aceptar o Rechazar)
export const updateIdeaStatus = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // "aceptada" o "rechazada"

    try {
        const updatedIdea = await prisma.idea.update({
            where: { id },
            data: { estado }
        });
        res.json(updatedIdea);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
};

// 3. Enviar mensaje en el chat de una idea
export const sendMessage = async (req, res) => {
    const { ideaId } = req.params;
    const { content } = req.body;
    const senderId = req.user.userId;

    try {
        const message = await prisma.message.create({
            data: {
                content,
                senderId,
                ideaId
            }
        });
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar mensaje', error: error.message });
    }
};

// 4. Obtener mensajes de una idea
export const getMessages = async (req, res) => {
    const { ideaId } = req.params;
    try {
        const messages = await prisma.message.findMany({
            where: { ideaId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar mensajes', error: error.message });
    }
};