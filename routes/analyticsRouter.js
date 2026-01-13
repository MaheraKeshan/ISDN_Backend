import express from "express";
import { getKPIStats } from "../controllers/analyticsController.js";

const analyticsRouter = express.Router();

// GET /api/analytics/kpi
analyticsRouter.get("/kpi", getKPIStats);

export default analyticsRouter;