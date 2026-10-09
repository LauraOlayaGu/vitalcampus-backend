import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { usuarioDemoMiddleware } from './middlewares/auth.middleware';

import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import sleepRoutes from './routes/sleep.routes';
import asignaturaRoutes from './routes/asignatura.routes';
import entregaRoutes from './routes/entrega.routes';
import estudioRoutes from './routes/estudio.routes';
import indicadoresRoutes from './routes/indicadores.routes';
import alertRoutes from './routes/alert.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Application = express();

// Middleware globales
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Ruta pública de salud
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

// Aplicar middleware temporal de autenticación demo para las rutas de negocio
app.use(usuarioDemoMiddleware);

// Rutas protegidas por usuario demo MVP
app.use('/api/suenos', sleepRoutes);
app.use('/api/asignaturas', asignaturaRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/estudio', estudioRoutes);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/alertas', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta raíz de información
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'VitalCampus Backend API',
    version: '1.0.0',
    status: 'online',
    authMode: 'Demo MVP Middleware (estudiante@vitalcampus.com)',
    documentation: '/api/health'
  });
});

// Manejador de ruta no encontrada (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores (500)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no controlado en el servidor:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor', message: err.message });
});

export default app;
