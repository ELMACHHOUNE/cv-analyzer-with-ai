import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { jobMatchRouter, matchRouter } from './routes/matchRoutes.js';
import { errorMiddleware, notFoundHandler } from './middleware/errorMiddleware.js';
import { AppError } from './utils/AppError.js';
import { sendSuccess } from './utils/apiResponse.js';

export function createApp(environment = getEnv({ requireSecrets: false })) {
  const app = express();
  const allowedOrigins = new Set(environment.corsOrigins);
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.set('trust proxy', environment.trustProxy);
  app.use(helmet());
  app.use(cors({
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError('Origin is not allowed', 403, 'CORS_NOT_ALLOWED'));
    }
  }));
  app.use(express.json({ limit: '100kb', strict: true, type: 'application/json' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb', parameterLimit: 50 }));
  const healthHandler = (_req, res) => sendSuccess(res, { status: 'ok' });
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);
  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api', jobMatchRouter);
  app.use('/api/matches', matchRouter);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use(notFoundHandler);
  app.use(errorMiddleware);
  return app;
}

export const app = createApp();
export default app;
