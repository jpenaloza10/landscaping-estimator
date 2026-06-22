import { Router } from "express";
import { resolveUnitPrice } from "../services/pricing/resolvePrice";

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

export default r;
