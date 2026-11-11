import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';

// Carga .env local si existe, sin sobreescribir variables del entorno de producción
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Verificación diagnóstica de variables al iniciar
console.log('--- ESTADO DE VARIABLES ---');
console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET presente:', !!process.env.JWT_SECRET);
console.log('---------------------------');

// Endpoints de la API
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);

app.get('/', (req, res) => {
  res.send('API de NovaCreativa con PostgreSQL y Prisma lista');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});