// src/routes/reports.ts
import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";

const router = Router();

router.get("/budget", async (req, res) => {
  const { projectId } = req.query;
  const numericProjectId = Number(projectId);

  if (!numericProjectId) {
    return res
      .status(400)
      .json({ error: "projectId query param (number) is required" });
  }

  const report = await getProjectBudgetReport(numericProjectId);
  res.json(report);
});

export default router;
