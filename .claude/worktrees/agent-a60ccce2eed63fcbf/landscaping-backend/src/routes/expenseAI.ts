import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { aiCategorizeExpense } from "../services/aiCategorize";
import { auth as authMiddleware } from "../auth";

const router = Router();

// All routes in here require auth
router.use(authMiddleware);

// Helper to normalize user id from req.user
function getUserId(req: Request): number | null {
  const rawId = req.user?.id;
  if (!rawId) return null;
  const num = Number(rawId);
  return Number.isFinite(num) ? num : null;
}

// POST /api/expenses/:id/auto-categorize
router.post("/:id/auto-categorize", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params; // expense id (string in your TS type)

    // Load expense + its project so we can enforce ownership
    const exp = await prisma.expense.findUnique({
      where: { id }, // if your schema uses a different PK (e.g. id: string), adjust this
      include: {
        project: true,
      },
    });

    if (!exp || !exp.project || exp.project.user_id !== userId) {
      // Either not found, or belongs to a different user
      return res.status(404).json({ error: "Not found" });
    }

    const ocrText = (exp.meta as any)?.ocrRaw?.text || undefined;

    const result = await aiCategorizeExpense({
      vendor: exp.vendor || undefined,
      description: exp.description || undefined,
      ocrText,
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
            auto: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error("[expenseAI.auto-categorize]", e);
    return res.status(500).json({ error: "Failed to auto-categorize expense" });
  }
});

export default router;
