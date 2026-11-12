import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear una nueva idea (Vinculada al usuario autenticado)
export const createIdea = async (req, res) => {
  try {
    const { titulo, servicio, presupuesto, tiempo, detalles } = req.body;
    const userId = req.user.id; // Obtenido desde el middleware JWT

    const newIdea = await prisma.idea.create({
      data: {
        titulo,
        servicio,
        presupuesto,
        tiempo,
        detalles: detalles || "",
        userId
      }
    });

    res.status(201).json({
      message: 'Idea registrada exitosamente en la base de datos.',
      idea: newIdea
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la idea.', error: error.message });
  }
};

// Obtener todas las ideas de la empresa autenticada (incluyendo historial de chat)
export const getMyIdeas = async (req, res) => {
  try {
    const userId = req.user.id;

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
    res.status(500).json({ message: 'Error al obtener las ideas.', error: error.message });
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

    // Verificar que la idea pertenezca a la empresa autenticada
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
    res.status(500).json({ message: 'Error al enviar el mensaje.', error: error.message });
  }
};

// Eliminar una idea por ID
export const deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la idea le pertenezca a la empresa que intenta borrarla
    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea || idea.userId !== userId) {
      return res.status(404).json({ message: 'Idea no encontrada o sin permisos.' });
    }

    await prisma.idea.delete({ where: { id } });

    res.json({ message: 'Idea eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la idea.', error: error.message });
  }
};