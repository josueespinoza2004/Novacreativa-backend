import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token válido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Eliminamos el fallback inseguro 'admin12345'; exige JWT_SECRET real
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    // 1. Si usas un admin maestro hardcoded (como vimos 'admin-master-id' en AdminPanel.jsx)
    if (req.user.id === 'admin-master-id' && req.user.isAdmin === true) {
      return next();
    }

    // 2. Verificación en tiempo real contra PostgreSQL (evita tokens viejos con permisos revocados)
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!dbUser || dbUser.isAdmin !== true) {
      return res.status(403).json({
        message: 'Acceso denegado: se requieren permisos de administrador.'
      });
    }

    next();
  } catch (error) {
    console.error('Error en verificación de administrador:', error.message);
    return res.status(500).json({ message: 'Error interno al verificar permisos.' });
  }
};