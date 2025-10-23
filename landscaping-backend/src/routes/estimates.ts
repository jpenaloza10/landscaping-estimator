import { Router } from "express";
import { prisma } from "../prisma";
import { evalFormula, applyWaste } from "../services/calc";
import { computeTax } from "../services/tax";

const r = Router();

// create & calculate
r.post("/", async (req, res) => {
  const { projectId, location, lines }:{ projectId:string, location?: { zip?: string; state?: string }, lines:Array<{assemblyId:string, inputs:any}> } = req.body;

  const calcLines = [];
  let subtotal = 0;

  for (const line of lines) {
    const assembly = await prisma.assembly.findUnique({
      where: { id: line.assemblyId },
      include: { items: true }
    });
    if (!assembly) continue;

    const inputs = line.inputs || {};
    const items = assembly.items.map(it => {
      const rawQty = evalFormula(it.qtyFormula, inputs);
      const qty = applyWaste(rawQty, assembly.wastePct);
      const extended = qty * Number(it.unitCost);
      return { name: it.name, unit: it.unit, unitCost: Number(it.unitCost), qty, extended };
    });

    const lineTotal = items.reduce((a, b) => a + b.extended, 0);
    subtotal += lineTotal;

    calcLines.push({
      assemblyId: assembly.id,
      inputs,
      items,
      lineTotal
    });
  }

  // NEW: sales tax via Avalara ZIP (free) with state fallback
  const { tax, rate } = await computeTax(subtotal, { zip: location?.zip, state: location?.state });
  const total = subtotal + tax;

  const estimate = await prisma.estimate.create({
    data: {
      projectId, location,
      subtotal,
      tax, 
      total,
      lines: { create: calcLines.map(l => ({ ...l, items: l.items as any, lineTotal: l.lineTotal })) }
    },
    include: { lines: true }
  });

  res.json({ ...estimate, taxRate: rate });
});

export default r;
