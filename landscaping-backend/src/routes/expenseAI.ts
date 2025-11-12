// src/routes/expenseAI.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { aiCategorizeExpense } from "../services/aiCategorize";

const prisma = new PrismaClient();
const router = Router();

// POST /api/expenses/:id/auto-categorize
router.post("/:id/auto-categorize", async (req, res) => {
  const { id } = req.params;
  const exp = await prisma.expense.findUnique({ where: { id } });
  if (!exp) return res.status(404).json({ error: "Not found" });

  const ocrText = (exp.meta as any)?.ocrRaw?.text || undefined;
  const result = await aiCategorizeExpense({
    vendor: exp.vendor || undefined,
    description: exp.description || undefined,
    ocrText
  });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      category: result.category,
      meta: {
        ...(exp.meta as any),
        aiCategory: {
          category: result.category,
          confidence: result.confidence,
          auto: true
        }
      }
    }
  });

  res.json(updated);
});

export default router;
