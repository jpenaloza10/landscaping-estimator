// src/routes/reports.ts
import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/** Coerce a value to an integer; throw 400 if invalid */
function toInt(value: unknown, fieldName: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err: any = new Error(`${fieldName} must be an integer`);
    err.status = 400;
    throw err;
  }
  return n;
}

router.get("/budget", async (req, res) => {
  try {
    // Require ?projectId=123 (Project.id is Int in Prisma)
    const projectId = toInt(req.query.projectId, "projectId");

    // Optional: ensure project exists; return 404 if not
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const report = await getProjectBudgetReport(projectId);
    return res.json(report);
  } catch (error: any) {
    const status = error?.status ?? 500;
    console.error("Budget report error:", error?.message || error);
    return res
      .status(status)
      .json({ error: error?.message ?? "Failed to get budget report" });
  }
});

export default router;
