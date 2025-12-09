import { Router, Request, Response } from "express";
import { ExpenseCategory } from "@prisma/client";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";

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
   Helper: get current user id from req.user
------------------------------------------------------ */
function getUserId(req: Request): number {
  const raw = req.user?.id;
  const n = raw != null ? Number(raw) : NaN;
  if (!Number.isFinite(n)) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return n;
}

/* ------------------------------------------------------
   Helper: resolve project by numeric id AND ownership
------------------------------------------------------ */
async function resolveProjectId(
  input: { projectId?: string | number | null },
  userId: number
) {
  const id = toInt(input.projectId, "projectId");

  const p = await prisma.project.findFirst({
    where: {
      id,
      user_id: userId, // enforce ownership
    },
  });

  if (!p) {
    const err: any = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return p.id; // number
}

/* ------------------------------------------------------
   All expense routes require auth
------------------------------------------------------ */
router.use(authMiddleware);

/* ------------------------------------------------------
   POST /api/expenses
   Create a new expense (only for user's own project)
------------------------------------------------------ */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const {
      projectId,
      estimateId, // optional (String in Prisma)
      estimateLineId, // optional (String in Prisma)
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

    // Resolve numeric project id and check ownership (throws 400/404 if invalid/not found)
    const resolvedProjectId = await resolveProjectId({ projectId }, userId);

    // Coerce amount & date
    const amountNum = toNumber(amount, "amount");
    const when = parseISODate(date, "date");

    // Ensure STRING types for Prisma (estimateId, estimateLineId are String in schema)
    const estimateIdStr =
      estimateId === null ||
      estimateId === undefined ||
      String(estimateId).trim() === ""
        ? undefined
        : String(estimateId);

    const estimateLineIdStr =
      estimateLineId === null ||
      estimateLineId === undefined ||
      String(estimateLineId).trim() === ""
        ? undefined
        : String(estimateLineId);

    const expense = await prisma.expense.create({
      data: {
        projectId: resolvedProjectId, // number (Int)
        estimateId: estimateIdStr, // string | undefined
        estimateLineId: estimateLineIdStr, // string | undefined
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
    console.error("[expenses.post]", e);
    res.status(e?.status ?? 400).json({ error: e.message ?? "Failed to create expense" });
  }
});

/* ------------------------------------------------------
   GET /api/expenses?projectId=123
   Optional: ?take=100&skip=0 for pagination
   Only returns expenses for user's own project
------------------------------------------------------ */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const resolvedProjectId = await resolveProjectId(
      {
        projectId: (req.query.projectId as string | number) ?? undefined,
      },
      userId
    );

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
      where: { projectId: resolvedProjectId }, // number (Int), already scoped by ownership via resolveProjectId
      orderBy: { date: "asc" },
      ...(typeof take === "number" ? { take } : {}),
      ...(typeof skip === "number" ? { skip } : {}),
    });

    res.json(expenses);
  } catch (e: any) {
    console.error("[expenses.get]", e);
    res.status(e?.status ?? 400).json({ error: e.message ?? "Failed to load expenses" });
  }
});

export default router;
