// src/routes/reports.ts
import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";
import { PrismaClient } from "@prisma/client";
import { auth as authMiddleware } from "../auth";

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

/** Helper: get current user id from req.user.id */
function getUserId(req: any): number {
  const raw = req.user?.id;
  const n = Number(raw);
  if (!raw || !Number.isFinite(n)) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return n;
}

// All report routes require auth
router.use(authMiddleware);

/**
 * GET /api/reports/budget?projectId=123
 * Returns budget report for a project owned by the current user
 */
router.get("/budget", async (req, res) => {
  try {
    const userId = getUserId(req);

    // Require ?projectId=123 (Project.id is Int in Prisma)
    const projectId = toInt(req.query.projectId, "projectId");

    // Ensure project exists AND belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: projectId, user_id: userId },
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
