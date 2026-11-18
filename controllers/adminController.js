import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllIdeasForAdmin = async (req, res) => {
    try {
        const ideas = await prisma.idea.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        nombre: true,
                        empresa: true,
                        email: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ideas);
    } catch (error) {
        console.error('Error al obtener ideas para admin:', error.message);
        res.status(500).json({ message: 'Error interno al obtener las ideas.' });
    }
};

export const updateIdeaStatus = async (req, res) => {
    const { id } = req.params;
    const { estado, mensajeAdmin } = req.body;

    const estadosPermitidos = ['en_revision', 'aceptada', 'rechazada'];
    if (estado && !estadosPermitidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido.' });
    }

    if (mensajeAdmin && mensajeAdmin.length > 1000) {
        return res.status(400).json({ message: 'El mensaje administrativo excede los 1,000 caracteres.' });
    }

    try {
        const updatedIdea = await prisma.idea.update({
            where: { id },
            data: {
                ...(estado && { estado }),
                ...(mensajeAdmin !== undefined && { mensajeAdmin: String(mensajeAdmin).trim() })
            }
        });
        res.json(updatedIdea);
    } catch (error) {
        console.error('Error al actualizar estado:', error.message);
        res.status(500).json({ message: 'Error interno al actualizar el estado.' });
    }
};

export const sendMessage = async (req, res) => {
    const { ideaId } = req.params;
    const { content } = req.body;

    const senderId = req.user?.id || 'admin-master-id';

    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío.' });
    }

    if (content.length > 1000) {
        return res.status(400).json({ message: 'El mensaje no puede superar los 1,000 caracteres.' });
    }

    try {
        const existingIdea = await prisma.idea.findUnique({ where: { id: ideaId } });
        if (!existingIdea) {
            return res.status(404).json({ message: 'La idea especificada no existe.' });
        }

        const cleanContent = content.trim();

        const message = await prisma.message.create({
            data: {
                content: cleanContent,
                senderId: String(senderId),
                ideaId,
                isRead: false
            }
        });

        await prisma.idea.update({
            where: { id: ideaId },
            data: { mensajeAdmin: cleanContent }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error Prisma en sendMessage:', error.message);
        res.status(500).json({ message: 'Error interno al enviar el mensaje.' });
    }
};

// Obtener mensajes de una idea y marcar como leídos los del cliente
export const getMessages = async (req, res) => {
    const { ideaId } = req.params;
    const adminId = String(req.user?.id || 'admin-master-id');

    try {
        await prisma.message.updateMany({
            where: {
                ideaId,
                senderId: { not: adminId },
                isRead: false
            },
            data: { isRead: true }
        });

        const messages = await prisma.message.findMany({
            where: { ideaId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        console.error('Error al cargar mensajes:', error.message);
        res.status(500).json({ message: 'Error interno al cargar mensajes.' });
    }
};