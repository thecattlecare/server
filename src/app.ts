/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import requestIp from 'request-ip';
import useragent from 'express-useragent';
import staffRoutes from './module/staff/staff.route';
import cattleRoutes from "./module/cattle/cattle.route";
import milkRoutes from './module/milk/milk.route';
import healthRoutes from './module/health/health.route';
import feedingRoutes from './module/feeding/feeding.route';
import reportsRoutes from './module/reports/reports.route';
import taskRoutes from './module/task/task.route';
import authRoutes from './module/auth/auth.route';
import { authenticateRequest } from './module/auth/auth.middleware';
import { ApiResponse } from './utils/api-response';
import { ApiError } from './utils/api-error';
import { broadcastMilkProductionChange } from './utils/milk-notifications';

const app = express();

// 1. CORS Configuration (Moved to the top where it belongs)
const allowedOrigins = [
  'http://localhost:3000', // Added explicitly just in case FRONTEND_URL isn't set locally
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept'
}));

// 2. Other Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(requestIp.mw());
app.use(useragent.express());

// 3. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 4. Routes
app.use('/api/staff', staffRoutes);
app.use('/api/auth', authRoutes);

// Dev-only test route
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/notify', (req, res) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json(ApiResponse.error('Missing notification payload'));
    }
    try {
      console.log('DEV /api/dev/notify received payload:', payload);
      broadcastMilkProductionChange(payload);
      return res.status(200).json(ApiResponse.success('Notification broadcasted', payload));
    } catch (err) {
      console.error('Dev notify failed', err);
      return res.status(500).json(ApiResponse.error('Failed to broadcast'));
    }
  });
}

// Protected routes
app.use('/api', authenticateRequest);
app.use('/api/cattle', cattleRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(ApiResponse.error('Route not found'));
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal server error';
  const response = process.env.NODE_ENV === 'production'
    ? ApiResponse.error(message)
    : ApiResponse.error(message, err instanceof ApiError ? undefined : err?.stack);

  return res.status(statusCode).json(response);
});

export default app;
