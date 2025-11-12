// src/routes/export.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getProjectBudgetReport } from "../services/reports";

const prisma = new PrismaClient();
const router = Router();

// GET /api/export/expenses.csv?projectId=...
router.get("/expenses.csv", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).send("projectId required");

  const expenses = await prisma.expense.findMany({
    where: { projectId: String(projectId) },
    orderBy: { date: "asc" }
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="expenses-${projectId}.csv"`);

  const header = "Date,Category,Vendor,Description,Amount,ReceiptUrl\n";
  const rows = expenses.map(e => [
    e.date.toISOString().slice(0,10),
    e.category,
    e.vendor ?? "",
    (e.description ?? "").replace(/"/g, '""'),
    e.amount.toString(),
    e.receiptUrl ?? ""
  ]);
  const body = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  res.send(header + body);
});

// GET /api/export/budget.csv?projectId=...
router.get("/budget.csv", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).send("projectId required");

  const report = await getProjectBudgetReport(String(projectId));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="budget-${projectId}.csv"`);

  const header = "Category,Budget,Actual,Remaining\n";
  const cats = Object.keys(report.byCategory || {});
  const rows = cats.map(cat => [
    cat,
    (report.byCategory[cat] || 0).toFixed(2),
    (report.actualByCategory[cat] || 0).toFixed(2),
    (report.remainingByCategory[cat] || 0).toFixed(2)
  ]);
  const body = rows.map(r => r.join(",")).join("\n");
  res.send(header + body);
});

export default router;
