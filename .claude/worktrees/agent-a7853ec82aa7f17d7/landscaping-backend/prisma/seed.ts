import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding assemblies + templates...");

  /* ---------------------------------------------------------
   * 1) PAVER PATIO (existing)
   * --------------------------------------------------------- */
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
          { name: "Paver Pallet", unit: "pallet", unitCost: 520.0, qtyFormula: "area/100" },
          { name: "Bedding Sand", unit: "ton", unitCost: 45.0, qtyFormula: "(area*0.083)/27" },
          { name: "Base Rock", unit: "ton", unitCost: 38.0, qtyFormula: "(area*0.25)/27" },
          { name: "Labor", unit: "hr", unitCost: 45.0, qtyFormula: "area/25" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * 2) ARTIFICIAL TURF
   * --------------------------------------------------------- */
  const turf = await prisma.assembly.upsert({
    where: { slug: "artificial-turf" },
    update: {},
    create: {
      slug: "artificial-turf",
      name: "Artificial Turf",
      trade: "Landscape",
      unit: "sqft",
      wastePct: 0.1,
      items: {
        create: [
          { name: "Turf Rolls", unit: "sqft", unitCost: 2.85, qtyFormula: "area * 1.05" },
          { name: "Weed Barrier Fabric", unit: "sqft", unitCost: 0.15, qtyFormula: "area" },
          { name: "Decomposed Granite Base", unit: "ton", unitCost: 46.0, qtyFormula: "(area*0.25)/27" },
          { name: "Silica Sand Infill", unit: "lb", unitCost: 0.12, qtyFormula: "area * 1.75" },
          { name: "Labor", unit: "hr", unitCost: 40.0, qtyFormula: "area/40" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * 3) IRRIGATION
   * --------------------------------------------------------- */
  const irrigation = await prisma.assembly.upsert({
    where: { slug: "irrigation" },
    update: {},
    create: {
      slug: "irrigation",
      name: "Irrigation System",
      trade: "Landscape",
      unit: "sqft",
      wastePct: 0,
      items: {
        create: [
          { name: "PVC Pipe 1\"", unit: "ft", unitCost: 1.75, qtyFormula: "area/10" },
          { name: "Sprinkler Heads", unit: "each", unitCost: 5.5, qtyFormula: "area/200" },
          { name: "Valve + Box", unit: "each", unitCost: 65.0, qtyFormula: "area/1000" },
          { name: "Controller & Wiring", unit: "allowance", unitCost: 150.0, qtyFormula: "1" },
          { name: "Labor", unit: "hr", unitCost: 48.0, qtyFormula: "area/75" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * 4) FENCE
   * --------------------------------------------------------- */
  const fence = await prisma.assembly.upsert({
    where: { slug: "fence" },
    update: {},
    create: {
      slug: "fence",
      name: "Wood Fence",
      trade: "Carpentry",
      unit: "linear-ft",
      wastePct: 0.05,
      items: {
        create: [
          { name: "Fence Boards", unit: "each", unitCost: 3.25, qtyFormula: "length * (12/5)" },
          { name: "4x4 Posts", unit: "each", unitCost: 18.5, qtyFormula: "length/8" },
          { name: "2x4 Rails", unit: "each", unitCost: 9.0, qtyFormula: "length/4" },
          { name: "Concrete", unit: "bag", unitCost: 5.5, qtyFormula: "length/8" },
          { name: "Labor", unit: "hr", unitCost: 50.0, qtyFormula: "length/10" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * 5) PLANTINGS
   * --------------------------------------------------------- */
  const plantings = await prisma.assembly.upsert({
    where: { slug: "plantings" },
    update: {},
    create: {
      slug: "plantings",
      name: "Plantings",
      trade: "Landscape",
      unit: "sqft",
      wastePct: 0.05,
      items: {
        create: [
          { name: "Shrubs (5 gal)", unit: "each", unitCost: 32.0, qtyFormula: "area/40" },
          { name: "Trees (15 gal)", unit: "each", unitCost: 95.0, qtyFormula: "area/300" },
          { name: "Mulch", unit: "cubic-yd", unitCost: 38.0, qtyFormula: "area/100" },
          { name: "Soil Amendment", unit: "bag", unitCost: 7.0, qtyFormula: "area/50" },
          { name: "Labor", unit: "hr", unitCost: 38.0, qtyFormula: "area/60" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * 6) RETAINING WALL
   * --------------------------------------------------------- */
  const retainingWall = await prisma.assembly.upsert({
    where: { slug: "retaining-wall" },
    update: {},
    create: {
      slug: "retaining-wall",
      name: "Retaining Wall",
      trade: "Hardscape",
      unit: "linear-ft",
      wastePct: 0.08,
      items: {
        create: [
          { name: "Wall Blocks", unit: "each", unitCost: 2.25, qtyFormula: "length * 1.25" },
          { name: "Cap Blocks", unit: "each", unitCost: 3.75, qtyFormula: "length" },
          { name: "Base Rock", unit: "ton", unitCost: 38.0, qtyFormula: "length * 0.05" },
          { name: "Drainage Gravel", unit: "ton", unitCost: 42.0, qtyFormula: "length * 0.04" },
          { name: "Drain Pipe", unit: "ft", unitCost: 1.1, qtyFormula: "length" },
          { name: "Labor", unit: "hr", unitCost: 52.0, qtyFormula: "length/6" }
        ],
      },
    },
  });

  /* ---------------------------------------------------------
   * TEMPLATE (1 basic example)
   * --------------------------------------------------------- */
  await prisma.template.upsert({
    where: { name: "Basic Patio" },
    update: {},
    create: {
      name: "Basic Patio",
      description: 'Standard 2" sand bed and 3" base rock',
      lines: {
        create: [
          {
            assemblyId: patio.id,
            defaults: { depthIn: 2 },
          },
        ],
      },
    },
  });

  console.log("Seeded 6 assemblies + templates.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Seed finished.");
  });
