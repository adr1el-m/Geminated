import express from "express";
import { getTriage, getHistory } from "../controllers/triageController.js";
import { 
  getDashboardSummary, 
  getRegionalStats, 
  getTrends, 
  getAlerts 
} from "../controllers/healthIntelligenceController.js";

const router = express.Router();

router.post("/triage", getTriage);
router.get("/triage/history", getHistory);
router.get("/dashboard/summary", getDashboardSummary);
router.get("/dashboard/regional", getRegionalStats);
router.get("/dashboard/trends", getTrends);
router.get("/alerts", getAlerts);

export default router;
