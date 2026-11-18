import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Carga .env local si existe, sin sobreescribir variables del entorno de producción
dotenv.config();

// 1. Verificación estricta de variables críticas antes de arrancar
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('❌ ERROR CRÍTICO: Faltan variables de entorno DATABASE_URL o JWT_SECRET.');
  process.exit(1);
}

const app = express();

// Necesario si despliegas detrás de un proxy inverso como Render
app.set('trust proxy', 1);

// 2. Cabeceras de seguridad HTTP
app.use(helmet());

// 3. CORS estricto (Solo permite tu frontend en local y producción)
const allowedOrigins = [
  'http://localhost:5173',
  'https://novacreativa.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite herramientas sin origen o dominios autorizados (incluyendo previews de Vercel si deseas)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Responde explícitamente a las peticiones preflight

// 4. Límite de tamaño en el cuerpo JSON (evita ataques de sobrecarga)
app.use(express.json({ limit: '10kb' }));

// 5. Rate Limiting (Protección contra fuerza bruta y spam)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo 15 intentos de login/registro por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de acceso. Intenta de nuevo en 15 minutos.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones generales por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Has excedido el límite de peticiones. Espera unos minutos.' }
});

// Endpoints de la API protegidos
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ideas', generalLimiter, ideaRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);

app.get('/', (req, res) => {
  res.send('API de NovaCreativa protegida y operativa');
});

// 6. Manejador global de errores (evita filtrar detalles internos del servidor)
app.use((err, req, res, next) => {
  console.error('Error detectado:', err.message);
  if (err.message === 'Bloqueado por política CORS') {
    return res.status(403).json({ message: 'Origen no autorizado.' });
  }
  res.status(500).json({ message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor seguro corriendo en el puerto ${PORT}`);
});