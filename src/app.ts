import express from "express";
import cattleRoutes from "./module/cattle/cattle.route";

const app = express();
app.use(express.json())

// Routes
app.use('/api/cattle', cattleRoutes);

export default app;
