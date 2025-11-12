import { Router } from "express";
import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// helper to validate category safely
function parseCategory(c: string): ExpenseCategory {
  const v = c?.toUpperCase();
  if (["MATERIAL", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OTHER"].includes(v)) {
    return v as ExpenseCategory;
  }
  return "OTHER";
}

// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const {
      projectId,
      estimateId,
      estimateLineId,
      category,
      vendor,
      description,
      amount,
      currency,
      date,
      receiptUrl,
      meta,
      userId,
    } = req.body;

    const numericProjectId = Number(projectId);
    if (!numericProjectId || !amount || !date) {
      return res
        .status(400)
        .json({ error: "projectId (number), amount, and date are required" });
    }

    const expense = await prisma.expense.create({
      data: {
        projectId: numericProjectId,
        estimateId: estimateId || null,
        estimateLineId: estimateLineId || null,
        category: parseCategory(category),
        vendor: vendor || null,
        description: description || null,
        amount: Number(amount),
        currency: currency || "USD",
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        meta: meta || {},
        userId: userId ?? null,
      },
    });

    res.json(expense);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/expenses?projectId=123
router.get("/", async (req, res) => {
  const { projectId } = req.query;
  const numericProjectId = Number(projectId);

  if (!numericProjectId) {
    return res
      .status(400)
      .json({ error: "projectId query param (number) is required" });
  }

  const expenses = await prisma.expense.findMany({
    where: { projectId: numericProjectId },
    orderBy: { date: "asc" },
  });

  res.json(expenses);
});

export default router;
