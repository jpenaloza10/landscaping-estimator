import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const patio = await prisma.assembly.upsert({
    where: { slug: "paver-patio" },
    update: {},
    create: {
      slug: "paver-patio",
      name: "Paver Patio",
      trade: "Hardscape",
      unit: "sqft",
      wastePct: 0.07,
      items: {
        create: [
          { name: "Paver Pallet", unit: "pallet", unitCost: 520.00, qtyFormula: "area/100" },
          { name: "Bedding Sand", unit: "ton", unitCost: 45.00, qtyFormula: "(area*0.083)/27" },
          { name: "Base Rock", unit: "ton", unitCost: 38.00, qtyFormula: "(area*0.25)/27" },
          { name: "Labor", unit: "hr", unitCost: 45.00, qtyFormula: "area/25" } // 25 sqft/hr
        ]
      }
    }
  });

  await prisma.template.upsert({
    where: { name: "Basic Patio" },
    update: {},
    create: {
      name: "Basic Patio",
      description: "Standard 2\" sand bed and 3\" base rock",
      lines: { create: [{ assemblyId: patio.id, defaults: { depthIn: 2 } }] }
    }
  });
}

main().finally(() => prisma.$disconnect());
