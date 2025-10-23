import { Router } from "express";
import { prisma } from "../prisma";
import { evalFormula, applyWaste } from "../services/calc";
import { computeTax } from "../services/tax";
import type { AssemblyItem } from "@prisma/client";

const r = Router();

type CreateEstimateInput = {
  projectId: number | string; // allow string from client; we'll coerce to number
  location?: { zip?: string; state?: string; city?: string; country?: string };
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
};

function coerceProjectId(id: number | string): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) throw new Error("Invalid projectId: must be a number");
  return n;
}

// create & calculate
r.post("/", async (req, res) => {
  try {
    const { projectId, location, lines } = req.body as CreateEstimateInput;

    const projectIdNum = coerceProjectId(projectId);

    const calcLines: Array<{
      assemblyId: string;
      inputs: Record<string, number>;
      items: Array<{
        name: string;
        unit: string;
        unitCost: number;
        qty: number;
        extended: number;
      }>;
      lineTotal: number;
    }> = [];

    let subtotal = 0;

    for (const line of lines) {
      const assembly = await prisma.assembly.findUnique({
        where: { id: line.assemblyId },
        include: { items: true },
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

      const items: ResolvedItem[] = assembly.items.map(
        (it: AssemblyItem): ResolvedItem => {
          const rawQty = evalFormula(it.qtyFormula, inputs);
          const qty = applyWaste(rawQty, assembly.wastePct);
          const unitCost = Number(it.unitCost); // Decimal -> number
          const extended = qty * unitCost;
          return { name: it.name, unit: it.unit, unitCost, qty, extended };
        }
      );

      const lineTotal = items.reduce(
        (acc: number, curr: ResolvedItem) => acc + curr.extended,
        0
      );

      subtotal += lineTotal;

      calcLines.push({
        assemblyId: assembly.id,
        inputs,
        items,
        lineTotal,
      });
    }

    // Sales tax via Avalara ZIP (free) with state fallback
    const { tax, rate } = await computeTax(subtotal, {
      zip: location?.zip,
      state: location?.state,
    });
    const total = subtotal + tax;

    const estimate = await prisma.estimate.create({
      data: {
        projectId: projectIdNum, // <-- number
        location,
        subtotal,
        tax,
        total,
        lines: {
          create: calcLines.map((l) => ({
            ...l,
            items: l.items as any, // JSON column
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { lines: true },
    });

    res.json({ ...estimate, taxRate: rate });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err?.message ?? "Bad request" });
  }
});

export default r;
