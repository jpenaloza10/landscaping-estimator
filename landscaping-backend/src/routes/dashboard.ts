import { Router } from "express";
import { prisma } from "../prisma";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

function dec(n: Decimal | number | null | undefined): number {
  if (n == null) return 0;
  if (n instanceof Decimal) return Number(n);
  return n;
}

/**
 * GET /api/dashboard/summary
 * Overall metrics:
 * - totalProjects
 * - totalEstimates
 * - totalEstimateValue
 * - totalExpenses
 * - totalApprovedChangeOrders
 * - contractValue
 * - grossProfit
 *
 * NOTE: For now this is global across all projects in the DB.
 * If you later want it per-user, you can filter by user_id here.
 */
router.get("/summary", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
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
        (s, est) => s + dec(est.total),
        0
      );
      totalExpenses += p.expenses.reduce((s, e) => s + dec(e.amount), 0);
      totalApprovedChangeOrders += p.changeOrders
        .filter((co) => co.status === "APPROVED")
        .reduce((s, co) => s + dec(co.amount), 0);
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
 * Per-project financials:
 * - id, name, city, state, created_at
 * - estimatesTotal
 * - expensesTotal
 * - approvedChangeOrdersTotal
 * - contractValue
 * - grossProfit
 */
router.get("/projects", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        estimates: true,
        expenses: true,
        changeOrders: true,
      },
      orderBy: { created_at: "desc" },
    });

    const rows = projects.map((p) => {
      const estimatesTotal = p.estimates.reduce(
        (s, est) => s + dec(est.total),
        0
      );
      const expensesTotal = p.expenses.reduce(
        (s, e) => s + dec(e.amount),
        0
      );
      const approvedChangeOrdersTotal = p.changeOrders
        .filter((co) => co.status === "APPROVED")
        .reduce((s, co) => s + dec(co.amount), 0);

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
