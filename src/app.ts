import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import cattleRoutes from "./module/cattle/cattle.route";
import milkRoutes from './module/milk/milk.route';
import healthRoutes from './module/health/health.route';
import feedingRoutes from './module/feeding/feeding.route';
import authRoutes from './module/auth/auth.route';
import { authenticateRequest } from './module/auth/auth.middleware';
import { ApiResponse } from './utils/api-response';
import { ApiError } from './utils/api-error';
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);

app.use('/api', authenticateRequest);

app.use('/api/cattle', cattleRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/feeding', feedingRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal server error';

  return res.status(statusCode).json(ApiResponse.error(message, err instanceof ApiError ? undefined : err?.stack));
});

export default app;