import { Router } from "express";
import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/* ------------------------------------------------------
   Local helpers: numeric coercion & validation
------------------------------------------------------ */
function toInt(value: unknown, fieldName: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err: any = new Error(`${fieldName} must be an integer`);
    err.status = 400;
    throw err;
  }
  return n;
}

function toNumber(value: unknown, fieldName: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    const err: any = new Error(`${fieldName} must be a number`);
    err.status = 400;
    throw err;
  }
  return n;
}

function parseISODate(value: unknown, fieldName: string): Date {
  if (typeof value !== "string" || !value.trim()) {
    const err: any = new Error(`${fieldName} is required`);
    err.status = 400;
    throw err;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err: any = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return d;
}

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
   Helper: resolve project by numeric id
------------------------------------------------------ */
async function resolveProjectId(input: { projectId?: string | number | null }) {
  const id = toInt(input.projectId, "projectId");
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) {
    const err: any = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  return p.id; // number
}

/* ------------------------------------------------------
   POST /api/expenses
   Create a new expense
------------------------------------------------------ */
router.post("/", async (req, res) => {
  try {
    const {
      projectId,
      estimateId,       // optional (String in Prisma)
      estimateLineId,   // optional (String in Prisma)
      category,
      vendor,
      description,
      amount,
      currency,
      date,
      receiptUrl,
      meta,
    } = req.body as {
      projectId?: string | number;
      estimateId?: string | number | null;
      estimateLineId?: string | number | null;
      category?: string;
      vendor?: string | null;
      description?: string | null;
      amount?: string | number;
      currency?: string | null;
      date?: string;
      receiptUrl?: string | null;
      meta?: any;
    };

    // Resolve numeric project id (throws 400/404 if invalid/not found)
    const resolvedProjectId = await resolveProjectId({ projectId });

    // Coerce amount & date
    const amountNum = toNumber(amount, "amount");
    const when = parseISODate(date, "date");

    // 🔧 Ensure STRING types for Prisma (estimateId, estimateLineId are String in schema)
    const estimateIdStr =
      estimateId === null || estimateId === undefined || String(estimateId).trim() === ""
        ? undefined
        : String(estimateId);

    const estimateLineIdStr =
      estimateLineId === null || estimateLineId === undefined || String(estimateLineId).trim() === ""
        ? undefined
        : String(estimateLineId);

    const expense = await prisma.expense.create({
      data: {
        projectId: resolvedProjectId, // number (Int)
        estimateId: estimateIdStr,          // string | undefined
        estimateLineId: estimateLineIdStr,  // string | undefined
        category: parseCategory(category),
        vendor: vendor || undefined,
        description: description || undefined,
        amount: amountNum, // Prisma Decimal accepts number
        currency: (currency && currency.trim()) || "USD",
        date: when,
        receiptUrl: receiptUrl || undefined,
        meta: meta || undefined,
      },
    });

    res.json(expense);
  } catch (e: any) {
    console.error(e);
    res.status(e?.status ?? 400).json({ error: e.message });
  }
});

/* ------------------------------------------------------
   GET /api/expenses?projectId=123
   Optional: ?take=100&skip=0 for pagination
------------------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const resolvedProjectId = await resolveProjectId({
      projectId: (req.query.projectId as string | number) ?? undefined,
    });

    // Optional pagination
    const take =
      req.query.take !== undefined && String(req.query.take).trim() !== ""
        ? toInt(req.query.take, "take")
        : undefined;

    const skip =
      req.query.skip !== undefined && String(req.query.skip).trim() !== ""
        ? toInt(req.query.skip, "skip")
        : undefined;

    const expenses = await prisma.expense.findMany({
      where: { projectId: resolvedProjectId }, // number (Int)
      orderBy: { date: "asc" },
      ...(typeof take === "number" ? { take } : {}),
      ...(typeof skip === "number" ? { skip } : {}),
    });

    res.json(expenses);
  } catch (e: any) {
    console.error(e);
    res.status(e?.status ?? 400).json({ error: e.message });
  }
});

export default router;
