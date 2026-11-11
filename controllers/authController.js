import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Instanciamos PrismaClient apuntando explícitamente a process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Registro de empresa
export const register = async (req, res) => {
  try {
    const { nombre, empresa, email, password } = req.body;

    // Validación preventiva de campos
    if (!nombre || !empresa || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        nombre,
        empresa,
        email,
        password: hashedPassword
      }
    });

    const token = jwt.sign(
      { id: newUser.id, empresa: newUser.empresa },
      process.env.JWT_SECRET || 'admin12345',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        empresa: newUser.empresa,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    // Esto es clave: imprimirá el stack trace exacto en la pestaña Logs de Render
    console.error('Error detallado en register:', error);
    res.status(500).json({ message: 'Error al registrar empresa.', error: error.message });
  }
};

// Login de empresa
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Empresa no encontrada.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: user.id, empresa: user.empresa },
      process.env.JWT_SECRET || 'admin12345',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        empresa: user.empresa,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Error detallado en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión.', error: error.message });
  }
};