import { PrismaClient, ExpenseCategory } from "@prisma/client";
const prisma = new PrismaClient();

export async function getProjectBudgetReport(projectId: string) {
  const snapshot = await prisma.budgetSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" }
  });

  if (!snapshot) {
    return {
      hasBaseline: false,
      baselineTotal: 0,
      byCategory: {},
      actualByCategory: {},
      remainingByCategory: {},
      totalActual: 0,
      totalRemaining: 0
    };
  }

  const baseline = snapshot.byCategory as Record<ExpenseCategory, number>;

  const raw = await prisma.expense.groupBy({
    by: ["category"],
    where: { projectId },
    _sum: { amount: true }
  });

  const actualByCategory: Record<ExpenseCategory, number> = {
    MATERIAL: 0, LABOR: 0, EQUIPMENT: 0, SUBCONTRACTOR: 0, OTHER: 0
  };
  raw.forEach((r:any) => {
    actualByCategory[r.category as ExpenseCategory] = Number(r._sum.amount || 0);
  });

  const remainingByCategory: Record<ExpenseCategory, number> = {
    MATERIAL: 0, LABOR: 0, EQUIPMENT: 0, SUBCONTRACTOR: 0, OTHER: 0
  };

  (Object.keys(remainingByCategory) as ExpenseCategory[]).forEach(cat => {
    remainingByCategory[cat] = (baseline[cat] || 0) - (actualByCategory[cat] || 0);
  });

  const baselineTotal = Object.values(baseline).reduce((a,b)=>a+b,0);
  const totalActual = Object.values(actualByCategory).reduce((a,b)=>a+b,0);
  const totalRemaining = baselineTotal - totalActual;

  return {
    hasBaseline: true,
    baselineTotal,
    byCategory: baseline,
    actualByCategory,
    remainingByCategory,
    totalActual,
    totalRemaining
  };
}
