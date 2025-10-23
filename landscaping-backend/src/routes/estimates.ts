import { Router } from "express";
import { prisma } from "../prisma";
import { evalFormula, applyWaste } from "../services/calc";
import { computeTax } from "../services/tax";
import type { AssemblyItem } from "@prisma/client";

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
    type ResolvedItem = {
      name: string;
      unit: string;
      unitCost: number;
      qty: number;
      extended: number;
    };
    
    const items: ResolvedItem[] = assembly.items.map((it: AssemblyItem): ResolvedItem => {
      const rawQty = evalFormula(it.qtyFormula, inputs);
      const qty = applyWaste(rawQty, assembly.wastePct);
      const unitCost = Number(it.unitCost);
      const extended = qty * unitCost;
      return { name: it.name, unit: it.unit, unitCost, qty, extended };
    });
    
    const lineTotal = items.reduce((acc: number, curr: ResolvedItem) => acc + curr.extended, 0);
    
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
