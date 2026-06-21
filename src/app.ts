/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import requestIp from 'request-ip';
import useragent from 'express-useragent';
import cattleRoutes from "./module/cattle/cattle.route";
import milkRoutes from './module/milk/milk.route';
import healthRoutes from './module/health/health.route';
import feedingRoutes from './module/feeding/feeding.route';
import taskRoutes from './module/task/task.route';
import authRoutes from './module/auth/auth.route';
import { authenticateRequest } from './module/auth/auth.middleware';
import { ApiResponse } from './utils/api-response';
import { ApiError } from './utils/api-error';
import staffRoutes from './module/staff/staff.route';
import financeRoutes from './module/finance/finance.route';
const app = express();

// Middleware
app.use(express.json({ limit: '5mb' })); // Added limit for larger payloads
app.use(cookieParser());

// IP Detection middleware
app.use(requestIp.mw());

// User Agent parsing middleware
app.use(useragent.express());

// CORS configuration for both dev and production
const allowedOrigins = [
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
}));

// Health check endpoint (useful for Vercel)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/finance', financeRoutes);
// Dev-only test route to broadcast a synthetic milk notification (public in development)
// if (process.env.NODE_ENV !== 'production') {
//   app.post('/api/dev/notify', (req, res) => {
//     const payload = req.body;
//     if (!payload) {
//       return res.status(400).json(ApiResponse.error('Missing notification payload'));
//     }

//     try {
//       console.log('DEV /api/dev/notify received payload:', payload);
//       // Broadcast without requiring authentication in development for easy testing
//       // Note: keep this guarded by NODE_ENV !== 'production'
//       broadcastMilkProductionChange(payload);
//       return res.status(200).json(ApiResponse.success('Notification broadcasted', payload));
//     } catch (err) {
//       console.error('Dev notify failed', err);
//       return res.status(500).json(ApiResponse.error('Failed to broadcast'));
//     }
//   });
// }

// Routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authenticateRequest);

app.use('/api/cattle', cattleRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/staff', staffRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(ApiResponse.error('Route not found'));
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal server error';

  // Don't expose stack traces in production
  const response = process.env.NODE_ENV === 'production'
    ? ApiResponse.error(message)
    : ApiResponse.error(message, err instanceof ApiError ? undefined : err?.stack);

  return res.status(statusCode).json(response);
});

export default app;
