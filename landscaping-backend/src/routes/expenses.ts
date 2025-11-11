import { Router } from "express";
import { PrismaClient, ExpenseCategory } from "@prisma/client";
const prisma = new PrismaClient();
const r = Router;

// helper to validate category safely
function parseCategory(c: string): ExpenseCategory {
  const v = c?.toUpperCase();
  if (["MATERIAL","LABOR","EQUIPMENT","SUBCONTRACTOR","OTHER"].includes(v)) {
    return v as ExpenseCategory;
  }
  return "OTHER";
}

// POST /api/expenses
const router = Router();

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
      meta
    } = req.body;

    if (!projectId || !amount || !date) {
      return res.status(400).json({ error: "projectId, amount, date required" });
    }

    const expense = await prisma.expense.create({
      data: {
        projectId,
        estimateId,
        estimateLineId,
        category: parseCategory(category),
        vendor,
        description,
        amount,
        currency: currency || "USD",
        date: new Date(date),
        receiptUrl,
        meta
      }
    });

    res.json(expense);
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/expenses?projectId=...
router.get("/", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const expenses = await prisma.expense.findMany({
    where: { projectId: String(projectId) },
    orderBy: { date: "asc" }
  });

  res.json(expenses);
});

export default router;
