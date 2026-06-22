import { Router, Request, Response } from "express";
import { resolveUnitPrice } from "../services/pricing/resolvePrice";
import { auth as authMiddleware } from "../auth";
import { prisma } from "../prisma";

const r = Router();

/**
 * POST /api/pricing/price-material
 * { materialSlug:"base-rock-34-minus", uom:"ton", zip:"94103", qty:4.5 }
 */
r.post("/price-material", async (req, res) => {
  const { materialSlug, uom, zip, qty } = req.body;
  const result = await resolveUnitPrice({ materialSlug, uom, qty, zip });
  if (!result) return res.status(404).json({ error: "No price found" });
  res.json(result);
});

// ─── User pricing sheet (requires auth) ──────────────────────────────────────

function getUserId(req: Request): number | null {
  const raw = req.user?.id;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Default price sheet — starter rates for each category
const DEFAULT_ITEMS: Array<{
  category: string;
  itemName: string;
  unit: string;
  unitPrice: number;
}> = [
  // Demo / Site Prep
  { category: "DEMO",       itemName: "Demo Labor",           unit: "hour",  unitPrice: 65   },
  { category: "DEMO",       itemName: "Haul Away",            unit: "ton",   unitPrice: 95   },
  { category: "DEMO",       itemName: "Grading",              unit: "sqft",  unitPrice: 0.35 },
  // Soil Preparation
  { category: "SOIL_PREP",  itemName: "Topsoil",              unit: "yard",  unitPrice: 55   },
  { category: "SOIL_PREP",  itemName: "Soil Amendment",       unit: "bag",   unitPrice: 18   },
  { category: "SOIL_PREP",  itemName: "Soil Prep Labor",      unit: "hour",  unitPrice: 60   },
  // Irrigation
  { category: "IRRIGATION", itemName: "Drip Line",            unit: "lf",    unitPrice: 1.25 },
  { category: "IRRIGATION", itemName: "Sprinkler Head",       unit: "each",  unitPrice: 45   },
  { category: "IRRIGATION", itemName: "Irrigation Labor",     unit: "hour",  unitPrice: 75   },
  // Hardscape
  { category: "HARDSCAPE",  itemName: "Pavers",               unit: "sqft",  unitPrice: 8.50 },
  { category: "HARDSCAPE",  itemName: "Sand Base",            unit: "ton",   unitPrice: 85   },
  { category: "HARDSCAPE",  itemName: "Hardscape Labor",      unit: "sqft",  unitPrice: 12   },
  // Concrete
  { category: "CONCRETE",   itemName: "Concrete",             unit: "yard",  unitPrice: 175  },
  { category: "CONCRETE",   itemName: "Form Labor",           unit: "lf",    unitPrice: 4.50 },
  { category: "CONCRETE",   itemName: "Concrete Labor",       unit: "sqft",  unitPrice: 9    },
  // Planting / Sod
  { category: "PLANTING",   itemName: "Sod",                  unit: "sqft",  unitPrice: 1.10 },
  { category: "PLANTING",   itemName: "Plant – 5 Gal",        unit: "each",  unitPrice: 35   },
  { category: "PLANTING",   itemName: "Tree – 24\" Box",      unit: "each",  unitPrice: 450  },
  { category: "PLANTING",   itemName: "Planting Labor",       unit: "hour",  unitPrice: 55   },
  // Mulch / Rock
  { category: "MULCH_ROCK", itemName: "Wood Mulch",           unit: "yard",  unitPrice: 55   },
  { category: "MULCH_ROCK", itemName: "Crushed Rock",         unit: "ton",   unitPrice: 85   },
  { category: "MULCH_ROCK", itemName: "Decorative Rock",      unit: "ton",   unitPrice: 220  },
  { category: "MULCH_ROCK", itemName: "Mulch Install Labor",  unit: "sqft",  unitPrice: 0.40 },
  // Lighting
  { category: "LIGHTING",   itemName: "Light Fixture",        unit: "each",  unitPrice: 120  },
  { category: "LIGHTING",   itemName: "Low Volt Wire",        unit: "lf",    unitPrice: 0.85 },
  { category: "LIGHTING",   itemName: "Transformer",          unit: "each",  unitPrice: 350  },
  { category: "LIGHTING",   itemName: "Lighting Labor",       unit: "hour",  unitPrice: 80   },
  // Cleanup
  { category: "CLEANUP",    itemName: "Final Cleanup Labor",  unit: "hour",  unitPrice: 55   },
  { category: "CLEANUP",    itemName: "Debris Removal",       unit: "ton",   unitPrice: 90   },
  // General Labor
  { category: "LABOR",      itemName: "General Labor",        unit: "hour",  unitPrice: 55   },
  { category: "LABOR",      itemName: "Foreman",              unit: "hour",  unitPrice: 85   },
  { category: "LABOR",      itemName: "Equipment Operator",   unit: "hour",  unitPrice: 95   },
];

export { DEFAULT_ITEMS };

/**
 * GET /api/pricing/sheet
 * Returns the user's full pricing sheet — custom values merged over defaults.
 */
r.get("/sheet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const saved = await prisma.userPricing.findMany({ where: { userId } });
    const savedMap = new Map(saved.map((p) => [`${p.category}__${p.itemName}`, p]));

    const sheet = DEFAULT_ITEMS.map((def) => {
      const key = `${def.category}__${def.itemName}`;
      const row = savedMap.get(key);
      return {
        id:        row?.id ?? null,
        category:  def.category,
        itemName:  def.itemName,
        unit:      row?.unit      ?? def.unit,
        unitPrice: row ? Number(row.unitPrice) : def.unitPrice,
        notes:     row?.notes ?? null,
        isCustom:  !!row,
      };
    });

    return res.json({ sheet });
  } catch (e) {
    console.error("[pricing.sheet.get]", e);
    return res.status(500).json({ error: "Failed to load price sheet" });
  }
});

/**
 * PUT /api/pricing/sheet
 * Bulk upsert the user's pricing sheet.
 * Body: { items: [{ category, itemName, unit, unitPrice, notes? }] }
 */
r.put("/sheet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const { items } = req.body as {
      items: Array<{ category: string; itemName: string; unit: string; unitPrice: number; notes?: string }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array required" });
    }

    await Promise.all(
      items.map((item) =>
        prisma.userPricing.upsert({
          where: {
            userId_category_itemName: { userId, category: item.category, itemName: item.itemName },
          },
          update: {
            unit:      item.unit,
            unitPrice: item.unitPrice,
            notes:     item.notes ?? null,
            updatedAt: new Date(),
          },
          create: {
            userId,
            category:  item.category,
            itemName:  item.itemName,
            unit:      item.unit,
            unitPrice: item.unitPrice,
            notes:     item.notes ?? null,
          },
        })
      )
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[pricing.sheet.put]", e);
    return res.status(500).json({ error: "Failed to save price sheet" });
  }
});

/**
 * POST /api/pricing/sheet/reset
 * Wipe all custom prices — revert to defaults.
 */
r.post("/sheet/reset", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });
    await prisma.userPricing.deleteMany({ where: { userId } });
    return res.json({ ok: true });
  } catch (e) {
    console.error("[pricing.sheet.reset]", e);
    return res.status(500).json({ error: "Failed to reset price sheet" });
  }
});

export default r;
