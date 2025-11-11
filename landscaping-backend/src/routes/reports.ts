import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";
const router = Router();

router.get("/budget", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const report = await getProjectBudgetReport(String(projectId));
  res.json(report);
});

export default router;
