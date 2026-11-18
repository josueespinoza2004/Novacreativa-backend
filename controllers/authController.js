import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registro de empresa
export const register = async (req, res) => {
  try {
    const { nombre, empresa, email, password } = req.body;

    // 1. Validación estricta de campos y longitudes
    if (!nombre?.trim() || !empresa?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    if (nombre.length > 100 || empresa.length > 100 || email.length > 150) {
      return res.status(400).json({ message: 'Uno o más campos exceden la longitud permitida.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Evitar que alguien registre el correo reservado del administrador
    if (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        empresa: empresa.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isAdmin: false
      }
    });

    const token = jwt.sign(
      { id: newUser.id, empresa: newUser.empresa, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        empresa: newUser.empresa,
        email: newUser.email,
        isAdmin: false
      },
      token
    });
  } catch (error) {
    console.error('Error en register:', error.message);
    res.status(500).json({ message: 'Error interno al registrar empresa.' });
  }
};

// Login de empresa (Con Acceso Maestro desde Variables de Entorno)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    // 1. ACCESO MAESTRO DE ADMINISTRADOR (Leído desde .env / Render, nunca en el código)
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      email.trim() === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const adminUser = {
        id: 'admin-master-id',
        nombre: 'Administrador Maestro',
        empresa: 'NovaCreativa Admin',
        email: email.trim(),
        isAdmin: true
      };

      const token = jwt.sign(
        { id: adminUser.id, empresa: adminUser.empresa, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '12h' } // Sesión admin más corta por seguridad
      );

      return res.json({
        user: adminUser,
        token
      });
    }

    // 2. Login normal buscando en PostgreSQL (sin revelar si existe o no el correo)
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, empresa: user.empresa, isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        empresa: user.empresa,
        email: user.email,
        isAdmin: user.isAdmin || false
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ message: 'Error interno al iniciar sesión.' });
  }
};