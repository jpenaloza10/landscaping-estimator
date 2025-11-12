import { PrismaClient, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();

type CategoryTotals = Record<ExpenseCategory, number>;

export async function getProjectBudgetReport(projectId: number) {
  const snapshot = await prisma.budgetSnapshot.findFirst({
    where: { projectId },
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

  const baseline = snapshot.byCategory as CategoryTotals;

  // --- ✅ Include approved Change Orders in the baseline total ---
  const approvedCOs = await prisma.changeOrder.findMany({
    where: { projectId, status: "APPROVED" },
  });
  const changeOrderTotal = approvedCOs.reduce(
    (sum, co) => sum + Number(co.amount || 0),
    0
  );
  // ---------------------------------------------------------------

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

  grouped.forEach((row) => {
    const cat = row.category as ExpenseCategory;
    actualByCategory[cat] = Number(row._sum.amount || 0);
  });

  const remainingByCategory: CategoryTotals = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACTOR: 0,
    OTHER: 0,
  };

  (Object.keys(remainingByCategory) as ExpenseCategory[]).forEach((cat) => {
    const b = baseline[cat] || 0;
    const a = actualByCategory[cat] || 0;
    remainingByCategory[cat] = b - a;
  });

  // Baseline now includes approved change orders
  const baselineTotal =
    Object.values(baseline).reduce((sum, val) => sum + val, 0) + changeOrderTotal;

  const totalActual = Object.values(actualByCategory).reduce(
    (sum, val) => sum + val,
    0
  );

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
