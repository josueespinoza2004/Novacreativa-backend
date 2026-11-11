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

// Obtener todas las ideas de la empresa autenticada
export const getMyIdeas = async (req, res) => {
  try {
    const userId = req.user.id;

    const ideas = await prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las ideas.', error: error.message });
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