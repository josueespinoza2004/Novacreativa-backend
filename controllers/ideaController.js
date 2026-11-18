import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear una nueva idea (Vinculada al usuario autenticado)
export const createIdea = async (req, res) => {
  try {
    const { titulo, servicio, presupuesto, tiempo, detalles } = req.body;
    const userId = req.user.id;

    if (!titulo?.trim() || !servicio?.trim() || !presupuesto?.trim()) {
      return res.status(400).json({ message: 'Título, servicio y presupuesto son obligatorios.' });
    }

    if (titulo.length > 150 || (detalles && detalles.length > 2000)) {
      return res.status(400).json({ message: 'El título o los detalles exceden el límite permitido.' });
    }

    const newIdea = await prisma.idea.create({
      data: {
        titulo: titulo.trim(),
        servicio: servicio.trim(),
        presupuesto: presupuesto.trim(),
        tiempo: tiempo ? tiempo.trim() : 'Por definir',
        detalles: detalles ? detalles.trim() : '',
        userId
      }
    });

    res.status(201).json({
      message: 'Idea registrada exitosamente en la base de datos.',
      idea: newIdea
    });
  } catch (error) {
    console.error('Error al crear idea:', error.message);
    res.status(500).json({ message: 'Error interno al registrar la idea.' });
  }
};

// Obtener todas las ideas de la empresa autenticada (incluyendo historial de chat)
export const getMyIdeas = async (req, res) => {
  try {
    const userId = req.user.id;

    if (userId === 'admin-master-id') {
      return res.json([]);
    }

    const ideas = await prisma.idea.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(ideas);
  } catch (error) {
    console.error('Error al obtener ideas:', error.message);
    res.status(500).json({ message: 'Error interno al obtener las ideas.' });
  }
};

// Enviar mensaje en el chat de una idea propia (Usuario -> Admin)
export const sendUserMessage = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío.' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'El mensaje no puede superar los 1,000 caracteres.' });
    }

    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea || idea.userId !== userId) {
      return res.status(403).json({ message: 'Idea no encontrada o sin permisos para comentar.' });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: String(userId),
        ideaId
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error al enviar mensaje:', error.message);
    res.status(500).json({ message: 'Error interno al enviar el mensaje.' });
  }
};

// Eliminar una idea por ID
export const deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea || idea.userId !== userId) {
      return res.status(404).json({ message: 'Idea no encontrada o sin permisos.' });
    }

    await prisma.idea.delete({ where: { id } });

    res.json({ message: 'Idea eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar idea:', error.message);
    res.status(500).json({ message: 'Error interno al eliminar la idea.' });
  }
};