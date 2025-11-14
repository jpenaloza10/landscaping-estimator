import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getProjectBudgetReport } from "../services/reports";

const prisma = new PrismaClient();
const router = Router();

// GET /api/export/expenses.csv?projectId=...
router.get("/expenses.csv", async (req, res) => {
  const { projectId } = req.query;
  if (projectId == null) return res.status(400).send("projectId required");

  // projectId for Expense is numeric in the DB — coerce and validate
  const pidNum = Number(Array.isArray(projectId) ? projectId[0] : projectId);
  if (Number.isNaN(pidNum)) {
    return res.status(400).send("projectId must be a number");
  }

  const expenses = await prisma.expense.findMany({
    where: { projectId: pidNum },
    orderBy: { date: "asc" }
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
    e.receiptUrl ?? ""
  ]);
  const body = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  res.send(header + body);
});

// GET /api/export/budget.csv?projectId=...
router.get("/budget.csv", async (req, res) => {
  const { projectId } = req.query;
  if (projectId == null) return res.status(400).send("projectId required");

  // Your reporting service expects a numeric project id
  const pidNum = Number(Array.isArray(projectId) ? projectId[0] : projectId);
  if (Number.isNaN(pidNum)) {
    return res.status(400).send("projectId must be a number");
  }

  const report = await getProjectBudgetReport(pidNum); // number

  // Strongly type categories to avoid TS7053
  type Category = "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OTHER";
  const CATS: Category[] = [
    "MATERIAL",
    "LABOR",
    "EQUIPMENT",
    "SUBCONTRACTOR",
    "OTHER"
  ];

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
});

export default router;
