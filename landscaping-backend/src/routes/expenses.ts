import { Router } from "express";
import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/* ------------------------------------------------------
   Helper: validate category safely
------------------------------------------------------ */
function parseCategory(c: string | undefined): ExpenseCategory {
  const v = (c ?? "").toUpperCase();
  if (["MATERIAL", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OTHER"].includes(v)) {
    return v as ExpenseCategory;
  }
  return "OTHER";
}

/* ------------------------------------------------------
   Helper: resolve projectId by id or slug
   NOTE: use findFirst for slug (not unique in schema)
------------------------------------------------------ */
async function resolveProjectId(input: {
  projectId?: string | null;
  projectSlug?: string | null;
}) {
  if (input.projectId && String(input.projectId).trim()) {
    return String(input.projectId).trim();
  }

  if (input.projectSlug && String(input.projectSlug).trim()) {
    const p = await prisma.project.findFirst({
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
    } = req.body as {
      projectId?: string;
      projectSlug?: string;
      estimateId?: string | null;
      estimateLineId?: string | null;
      category?: string;
      vendor?: string | null;
      description?: string | null;
      amount?: string | number;
      currency?: string | null;
      date?: string;
      receiptUrl?: string | null;
      meta?: any;
    };

    const resolvedProjectId = await resolveProjectId({ projectId, projectSlug });

    // amount required & must be numeric
    const amountNum =
      typeof amount === "string" ? parseFloat(amount) : Number(amount);
    if (!Number.isFinite(amountNum)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!date) {
      return res.status(400).json({ error: "amount and date required" });
    }
    const when = new Date(date);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const expense = await prisma.expense.create({
      data: {
        projectId: resolvedProjectId,
        estimateId: estimateId || undefined,
        estimateLineId: estimateLineId || undefined,
        category: parseCategory(category),
        vendor: vendor || undefined,
        description: description || undefined,
        amount: amountNum, // Prisma Decimal will handle this number
        currency: (currency && currency.trim()) || "USD",
        date: when,
        receiptUrl: receiptUrl || undefined,
        meta: meta || undefined,
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
   Optional: ?take=100&skip=0 for pagination
------------------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const resolvedProjectId = await resolveProjectId({
      projectId: (req.query.projectId as string) ?? undefined,
      projectSlug: (req.query.projectSlug as string) ?? undefined,
    });

    // Optional pagination (safe parsing)
    const take = req.query.take ? parseInt(String(req.query.take), 10) : undefined;
    const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;

    const expenses = await prisma.expense.findMany({
      where: { projectId: resolvedProjectId },
      orderBy: { date: "asc" },
      ...(Number.isFinite(take as number) ? { take: take as number } : {}),
      ...(Number.isFinite(skip as number) ? { skip: skip as number } : {}),
    });

    res.json(expenses);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

export default router;
