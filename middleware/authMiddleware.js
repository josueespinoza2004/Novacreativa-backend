import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token válido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin12345');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};