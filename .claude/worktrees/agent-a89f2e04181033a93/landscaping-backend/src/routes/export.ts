import { Router, Request, Response } from "express";
import { auth as authMiddleware } from "../auth";
import { prisma } from "../prisma";
import { getProjectBudgetReport } from "../services/reports";

const router = Router();

// All export routes must be authenticated
router.use(authMiddleware);

function getUserId(req: Request): number | null {
  const raw = req.user?.id;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// GET /api/export/expenses.csv?projectId=...
router.get("/expenses.csv", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).send("Unauthorized");
    }

    const { projectId } = req.query;
    if (projectId == null) return res.status(400).send("projectId required");

    // projectId is numeric in the DB — coerce and validate
    const pidNum = Number(Array.isArray(projectId) ? projectId[0] : projectId);
    if (Number.isNaN(pidNum)) {
      return res.status(400).send("projectId must be a number");
    }

    // Ensure the project belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: pidNum, user_id: userId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).send("Project not found");
    }

    const expenses = await prisma.expense.findMany({
      where: { projectId: pidNum },
      orderBy: { date: "asc" },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses-${pidNum}.csv"`
    );

    const header = "Date,Category,Vendor,Description,Amount,ReceiptUrl\n";
    const rows = expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      e.category,
      e.vendor ?? "",
      (e.description ?? "").replace(/"/g, '""'),
      String(e.amount),
      e.receiptUrl ?? "",
    ]);
    const body = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    res.send(header + body);
  } catch (err) {
    console.error("[export.expenses]", err);
    res.status(500).send("Failed to export expenses");
  }
});

// GET /api/export/budget.csv?projectId=...
router.get("/budget.csv", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).send("Unauthorized");
    }

    const { projectId } = req.query;
    if (projectId == null) return res.status(400).send("projectId required");

    const pidNum = Number(Array.isArray(projectId) ? projectId[0] : projectId);
    if (Number.isNaN(pidNum)) {
      return res.status(400).send("projectId must be a number");
    }

    // Ensure the project belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: pidNum, user_id: userId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).send("Project not found");
    }

    const report = await getProjectBudgetReport(pidNum); // number

    type Category = "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OTHER";
    const CATS: Category[] = ["MATERIAL", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OTHER"];

    const by = report.byCategory as Record<Category, number>;
    const act = report.actualByCategory as Record<Category, number>;
    const rem = report.remainingByCategory as Record<Category, number>;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="budget-${pidNum}.csv"`
    );

    const header = "Category,Budget,Actual,Remaining\n";
    const lines = CATS.map((cat) => {
      const b = Number(by?.[cat] ?? 0);
      const a = Number(act?.[cat] ?? 0);
      const r = Number(rem?.[cat] ?? 0);
      return `${cat},${b.toFixed(2)},${a.toFixed(2)},${r.toFixed(2)}`;
    }).join("\n");

    res.send(header + lines);
  } catch (err) {
    console.error("[export.budget]", err);
    res.status(500).send("Failed to export budget");
  }
});

export default router;
