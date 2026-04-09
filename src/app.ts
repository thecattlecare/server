import express from "express";
import cors from "cors";
import cattleRoutes from "./module/cattle/cattle.route";
import milkRoutes from './module/milk/milk.route';
import healthRoutes from './module/health/health.route';
import feedingRoutes from './module/feeding/feeding.route';
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Routes
app.use('/api/cattle', cattleRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/feeding', feedingRoutes);
export default app;