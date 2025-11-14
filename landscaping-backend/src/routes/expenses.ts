import { Router } from "express";
import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/* ------------------------------------------------------
   Helper: validate category safely
------------------------------------------------------ */
function parseCategory(c: string): ExpenseCategory {
  const v = c?.toUpperCase();
  if (["MATERIAL", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OTHER"].includes(v)) {
    return v as ExpenseCategory;
  }
  return "OTHER";
}

/* ------------------------------------------------------
   Helper: resolve projectId by id or slug
------------------------------------------------------ */
async function resolveProjectId(input: {
  projectId?: string | null;
  projectSlug?: string | null;
}) {
  if (input.projectId && String(input.projectId).trim()) {
    return String(input.projectId).trim();
  }

  if (input.projectSlug && String(input.projectSlug).trim()) {
    const p = await prisma.project.findUnique({
      where: { slug: String(input.projectSlug).trim() },
      select: { id: true },
    });
    if (!p) throw new Error("Project not found for given slug");
    return p.id;
  }

  throw new Error("projectId or projectSlug is required");
}

/* ------------------------------------------------------
   POST /api/expenses
   Create a new expense
------------------------------------------------------ */
router.post("/", async (req, res) => {
  try {
    const {
      projectId,
      projectSlug,
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
    } = req.body;

    const resolvedProjectId = await resolveProjectId({ projectId, projectSlug });

    if (!amount || !date) {
      return res.status(400).json({ error: "amount and date required" });
    }

    const expense = await prisma.expense.create({
      data: {
        projectId: resolvedProjectId,
        estimateId,
        estimateLineId,
        category: parseCategory(category),
        vendor,
        description,
        amount,
        currency: currency || "USD",
        date: new Date(date),
        receiptUrl,
        meta,
      },
    });

    res.json(expense);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

/* ------------------------------------------------------
   GET /api/expenses?projectId=... or ?projectSlug=...
   List all expenses for a project
------------------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const resolvedProjectId = await resolveProjectId({
      projectId: (req.query.projectId as string) ?? undefined,
      projectSlug: (req.query.projectSlug as string) ?? undefined,
    });

    const expenses = await prisma.expense.findMany({
      where: { projectId: resolvedProjectId },
      orderBy: { date: "asc" },
    });

    res.json(expenses);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

export default router;
