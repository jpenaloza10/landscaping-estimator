import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();

type CategoryTotals = Record<ExpenseCategory, number>;

type BudgetReport =
  | {
      hasBaseline: false;
      baselineTotal: 0;
      byCategory: Record<string, never>;
      actualByCategory: Record<string, never>;
      remainingByCategory: Record<string, never>;
      totalActual: 0;
      totalRemaining: 0;
    }
  | {
      hasBaseline: true;
      baselineTotal: number;
      byCategory: CategoryTotals;
      actualByCategory: CategoryTotals;
      remainingByCategory: CategoryTotals;
      totalActual: number;
      totalRemaining: number;
    };

// Keep a canonical list of categories for consistent iteration
const CATS: ExpenseCategory[] = [
  "MATERIAL",
  "LABOR",
  "EQUIPMENT",
  "SUBCONTRACTOR",
  "OTHER",
];

/**
 * Normalize any incoming snapshot.byCategory JSON into a strongly-typed CategoryTotals,
 * coercing numeric-like values safely and defaulting missing categories to 0.
 */
function normalizeCategoryTotals(input: unknown): CategoryTotals {
  const base: Partial<CategoryTotals> =
    (typeof input === "object" && input !== null ? input : {}) as Partial<CategoryTotals>;

  const out: CategoryTotals = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACTOR: 0,
    OTHER: 0,
  };

  for (const cat of CATS) {
    const raw = (base as any)[cat];
    const n = Number(raw);
    out[cat] = Number.isFinite(n) ? n : 0;
  }
  return out;
}

/**
 * Returns the project budget report with:
 * - Baseline (from latest BudgetSnapshot) + approved Change Orders
 * - Actuals by category (from Expense)
 * - Remaining by category and totals
 *
 * NOTE: projectId is a number (Prisma Project.id is Int).
 */
export async function getProjectBudgetReport(projectId: number): Promise<BudgetReport> {
  // Latest snapshot becomes our baseline-by-category
  const snapshot = await prisma.budgetSnapshot.findFirst({
    where: { projectId }, // number, not string
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) {
    return {
      hasBaseline: false,
      baselineTotal: 0,
      byCategory: {},
      actualByCategory: {},
      remainingByCategory: {},
      totalActual: 0,
      totalRemaining: 0,
    };
  }

  // Normalize snapshot.byCategory (it’s JSON in DB)
  const baseline: CategoryTotals = normalizeCategoryTotals(snapshot.byCategory);

  // --- Include APPROVED change orders in the baseline total ---
  const approvedCOs = await prisma.changeOrder.findMany({
    where: { projectId, status: "APPROVED" },
    select: { amount: true },
  });
  const changeOrderTotal = approvedCOs.reduce((sum, co) => sum + Number(co.amount ?? 0), 0);

  // Group actual expenses by category
  const grouped = await prisma.expense.groupBy({
    by: ["category"],
    where: { projectId },
    _sum: { amount: true },
  });

  const actualByCategory: CategoryTotals = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACTOR: 0,
    OTHER: 0,
  };

  for (const row of grouped) {
    const cat = row.category as ExpenseCategory;
    const val = Number(row._sum.amount ?? 0);
    // Guard against unexpected category values
    if ((CATS as string[]).includes(cat)) {
      actualByCategory[cat] = val;
    }
  }

  const remainingByCategory: CategoryTotals = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACTOR: 0,
    OTHER: 0,
  };

  for (const cat of CATS) {
    const b = baseline[cat] ?? 0;
    const a = actualByCategory[cat] ?? 0;
    remainingByCategory[cat] = b - a;
  }

  // Baseline total includes approved change orders
  const baselineTotal =
    CATS.reduce((sum, cat) => sum + (baseline[cat] ?? 0), 0) + changeOrderTotal;

  const totalActual = CATS.reduce((sum, cat) => sum + (actualByCategory[cat] ?? 0), 0);
  const totalRemaining = baselineTotal - totalActual;

  return {
    hasBaseline: true,
    baselineTotal,
    byCategory: baseline,
    actualByCategory,
    remainingByCategory,
    totalActual,
    totalRemaining,
  };
}
