// src/routes/dashboard.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";

const router = Router();

// Simple helper to convert Prisma decimals / numbers / null to JS number
function toNum(n: any): number {
  if (n == null) return 0;
  return Number(n);
}

// Helper to get current user id (number) from req.user.id
function getUserId(req: Request): number | null {
  const raw = req.user?.id;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// All dashboard routes require auth
router.use(authMiddleware);

/**
 * GET /api/dashboard/summary
 * Overall metrics for the CURRENT USER ONLY:
 * - totalProjects
 * - totalEstimates
 * - totalEstimateValue
 * - totalExpenses
 * - totalApprovedChangeOrders
 * - contractValue
 * - grossProfit
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projects = await prisma.project.findMany({
      where: { user_id: userId },
      include: {
        estimates: true,
        expenses: true,
        changeOrders: true,
      },
    });

    const totalProjects = projects.length;

    let totalEstimates = 0;
    let totalEstimateValue = 0;
    let totalExpenses = 0;
    let totalApprovedChangeOrders = 0;

    for (const p of projects) {
      totalEstimates += p.estimates.length;

      totalEstimateValue += p.estimates.reduce(
        (s, est) => s + toNum(est.total),
        0
      );

      totalExpenses += p.expenses.reduce(
        (s, e) => s + toNum(e.amount),
        0
      );

      totalApprovedChangeOrders += p.changeOrders
        .filter((co) => co.status === "APPROVED")
        .reduce((s, co) => s + toNum(co.amount), 0);
    }

    const contractValue = totalEstimateValue + totalApprovedChangeOrders;
    const grossProfit = contractValue - totalExpenses;

    return res.json({
      totalProjects,
      totalEstimates,
      totalEstimateValue,
      totalExpenses,
      totalApprovedChangeOrders,
      contractValue,
      grossProfit,
    });
  } catch (e: any) {
    console.error("Dashboard summary error:", e);
    return res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

/**
 * GET /api/dashboard/projects
 * Per-project financials for the CURRENT USER ONLY:
 * - id, name, city, state, created_at
 * - estimatesTotal
 * - expensesTotal
 * - approvedChangeOrdersTotal
 * - contractValue
 * - grossProfit
 */
router.get("/projects", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projects = await prisma.project.findMany({
      where: { user_id: userId },
      include: {
        estimates: true,
        expenses: true,
        changeOrders: true,
      },
      orderBy: { created_at: "desc" },
    });

    const rows = projects.map((p) => {
      const estimatesTotal = p.estimates.reduce(
        (s, est) => s + toNum(est.total),
        0
      );
      const expensesTotal = p.expenses.reduce(
        (s, e) => s + toNum(e.amount),
        0
      );
      const approvedChangeOrdersTotal = p.changeOrders
        .filter((co) => co.status === "APPROVED")
        .reduce((s, co) => s + toNum(co.amount), 0);

      const contractValue = estimatesTotal + approvedChangeOrdersTotal;
      const grossProfit = contractValue - expensesTotal;

      return {
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
        created_at: p.created_at,
        estimatesTotal,
        expensesTotal,
        approvedChangeOrdersTotal,
        contractValue,
        grossProfit,
      };
    });

    return res.json({ projects: rows });
  } catch (e: any) {
    console.error("Dashboard projects error:", e);
    return res.status(500).json({ error: "Failed to load dashboard projects" });
  }
});

export default router;
