import { PrismaClient, ExpenseCategory } from "@prisma/client";
const prisma = new PrismaClient();

// Simple mapping logic: decide which estimate lines count to which category.
// For MVP: everything -> MATERIAL unless notes or assembly name suggests LABOR/SUBS/etc.
function categorizeLine(assemblyName: string | null): ExpenseCategory {
  if (!assemblyName) return "MATERIAL";
  const name = assemblyName.toLowerCase();
  if (name.includes("labor")) return "LABOR";
  if (name.includes("equip")) return "EQUIPMENT";
  if (name.includes("sub")) return "SUBCONTRACTOR";
  return "MATERIAL";
}

export async function createBudgetSnapshot(projectId: string, estimateId: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { lines: { include: { assembly: true } } }
  });
  if (!estimate) throw new Error("Estimate not found");

  const byCategory: Record<ExpenseCategory, number> = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACTOR: 0,
    OTHER: 0
  };

  for (const line of estimate.lines) {
    const assemblyName = line.assembly?.name ?? "";
    const cat = categorizeLine(assemblyName);
    byCategory[cat] += Number(line.lineTotal);
  }

  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);

  const snapshot = await prisma.budgetSnapshot.create({
    data: {
      projectId,
      estimateId,
      total,
      byCategory
    }
  });

  return snapshot;
}
