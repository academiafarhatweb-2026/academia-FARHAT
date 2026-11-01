import './config/env.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import HttpError from './utils/httpError.js';
import sanitizeInput from './middleware/sanitize.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import instrumentRoutes from './routes/instrumentRoutes.js';
import planRoutes from './routes/planRoutes.js';
import classRoutes from './routes/classRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Vercel's proxy: lets rate limiting see the real client IP
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(sanitizeInput);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/products', productRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'No encontrado' }));

// Known client-side mistakes get a 4xx with a clear message; anything else is
// logged server-side and answered with a generic 500 so no internals leak.
app.use((err, req, res, _next) => {
  if (err.name === 'CastError') return res.status(400).json({ message: 'Identificador o dato inválido' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: 'Hay datos inválidos en el formulario' });
  if (err.code === 11000) return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ message: 'Solicitud inválida' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
