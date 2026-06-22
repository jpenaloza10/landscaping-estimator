import { Router } from "express";
import { estimateDelivery } from "../services/delivery";
const r = Router();

/**
 * POST /api/delivery/estimate
 * { origin:{lat,lng}, dest:{lat,lng} }
 */
r.post("/estimate", (req, res) => {
  const { origin, dest } = req.body;
  if (!origin || !dest) return res.status(400).json({ error: "origin/dest required" });
  const result = estimateDelivery(origin, dest);
  res.json(result);
});

export default r;
