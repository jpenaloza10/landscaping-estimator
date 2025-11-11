import { Router } from "express";
import { prisma } from "../prisma";
import { evalFormula, applyWaste } from "../services/calc";
import { computeTax } from "../services/tax";
import type { AssemblyItem } from "@prisma/client";
import { resolveUnitPrice } from "../services/pricing/resolvePrice";
import { getRegionalFactor, makeRegionKey } from "../services/region";
import { estimateDelivery } from "../services/delivery";
import { createBudgetSnapshot } from "../services/budget";

const r = Router();

type LocationInput = {
  zip?: string;
  state?: string;
  city?: string;
  country?: string;
  // Optional for delivery; if not provided, delivery is skipped
  lat?: number;
  lng?: number;
  vendorLat?: number;
  vendorLng?: number;
};

type CreateEstimateInput = {
  projectId: number | string; // allow string from client; we'll coerce to number
  location?: LocationInput;
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
};

function coerceProjectId(id: number | string): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) throw new Error("Invalid projectId: must be a number");
  return n;
}

// helper: kebab-case for fallback material slugs
function kebab(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// === Create & calculate estimate ===
r.post("/", async (req, res) => {
  try {
    const { projectId, location, lines } = req.body as CreateEstimateInput;
    const projectIdNum = coerceProjectId(projectId);

    // Regional factor (applies when we use index/baseline pricing or for labor)
    const regionKey = makeRegionKey(location);
    const regionFactor = await getRegionalFactor(regionKey);

    type ResolvedItem = {
      name: string;
      unit: string;
      unitCost: number;
      qty: number;
      extended: number;
      // provenance/debug
      provider?: string;      // SupplierCSV, RetailX, CityIndex, LaborRegional, RegionalizedIndex, DeliveryEstimator
      source?: string;        // supplier | retail | marketplace | index | baseline | delivery
      fetchedAt?: string;     // ISO timestamp for live prices
      deliveryShare?: number; // proportional delivery allocated to this item
    };

    const calcLines: Array<{
      assemblyId: string;
      inputs: Record<string, number>;
      items: ResolvedItem[];
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
      const items: ResolvedItem[] = [];

      for (const it of assembly.items as AssemblyItem[]) {
        const rawQty = evalFormula(it.qtyFormula, inputs);
        const qty = applyWaste(rawQty, assembly.wastePct);

        let unitCost = Number(it.unitCost);
        let provider = "baseline";
        let source = "index";
        let fetchedAt: string | undefined;

        const isLabor = it.unit.toLowerCase() === "hr";

        if (!isLabor) {
          // Fallback material slug (ideally replace with materialId on AssemblyItem)
          const materialSlug = kebab(`${assembly.slug}-${it.name}`);
          const live = await resolveUnitPrice({
            materialSlug,
            uom: it.unit,
            zip: location?.zip,
            qty,
          });

          if (live) {
            unitCost = live.unitCost;
            provider = live.provider;
            source = live.source;
            fetchedAt =
              (live as any).fetchedAt?.toISOString?.() ??
              new Date((live as any).fetchedAt).toISOString?.() ??
              undefined;
          } else {
            // No live price: apply regional factor to your baseline/index
            unitCost = unitCost * (regionFactor || 1);
            provider = "RegionalizedIndex";
            source = "index";
          }
        } else {
          // Labor: scale by regional factor
          unitCost = unitCost * (regionFactor || 1);
          provider = "LaborRegional";
          source = "index";
        }

        const extended = qty * unitCost;
        items.push({
          name: it.name,
          unit: it.unit,
          unitCost,
          qty,
          extended,
          provider,
          source,
          fetchedAt,
        });
      }

      const lineTotal = items.reduce((acc, curr) => acc + curr.extended, 0);
      subtotal += lineTotal;

      calcLines.push({
        assemblyId: assembly.id,
        inputs,
        items,
        lineTotal,
      });
    }

    // === Delivery Cost Estimator & allocation (optional) ===
    let deliveryTotal = 0;
    const haveCoords =
      location?.vendorLat != null &&
      location?.vendorLng != null &&
      location?.lat != null &&
      location?.lng != null;

    if (haveCoords) {
      const d = estimateDelivery(
        { lat: Number(location!.vendorLat), lng: Number(location!.vendorLng) },
        { lat: Number(location!.lat), lng: Number(location!.lng) }
      );
      deliveryTotal = d.total;

      const linesSum = calcLines.reduce((a, l) => a + l.lineTotal, 0);
      if (linesSum > 0 && deliveryTotal > 0) {
        for (const l of calcLines) {
          const share = (l.lineTotal / linesSum) * deliveryTotal;

          // annotate each existing item with its per-item share
          l.items = l.items.map((it) => ({
            ...it,
            deliveryShare: Number(
              ((it.extended / l.lineTotal) * share).toFixed(2)
            ),
          }));

          // add explicit delivery item
          l.items.push({
            name: "Delivery (allocated)",
            unit: "each",
            unitCost: share,
            qty: 1,
            extended: share,
            provider: "DeliveryEstimator",
            source: "delivery",
          });

          l.lineTotal += share;
        }

        // delivery is included in subtotal (adjust if your tax rules differ)
        subtotal += deliveryTotal;
      }
    }

    // === Sales tax ===
    const { tax, rate } = await computeTax(subtotal, {
      zip: location?.zip,
      state: location?.state,
    });
    const total = subtotal + tax;

    const estimate = await prisma.estimate.create({
      data: {
        projectId: projectIdNum,
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

    res.json({
      ...estimate,
      taxRate: rate,
      delivery: haveCoords
        ? { total: deliveryTotal, includedInSubtotal: true }
        : { total: 0, includedInSubtotal: false },
      region: { key: regionKey, factor: regionFactor },
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(400)
      .json({ error: err?.message ?? "Bad request while creating estimate" });
  }
});

// === Finalize estimate & create Budget Snapshot ===
// Call this when the user approves/selects this estimate as the project baseline.
r.post("/:id/finalize", async (req, res) => {
  try {
    const { id } = req.params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      return res.status(404).json({ error: "Estimate not found" });
    }

    // Create a budget snapshot tied to this estimate + project
    // Adjust createBudgetSnapshot signature if your implementation differs.
    const snapshot = await createBudgetSnapshot(estimate.projectId as any, estimate.id);

    // Optional: if you add a `status` column on Estimate, update it here:
    // await prisma.estimate.update({
    //   where: { id },
    //   data: { status: "FINALIZED" },
    // });

    res.json({ ok: true, snapshot });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      error: err?.message ?? "Failed to finalize estimate and create snapshot",
    });
  }
});

export default r;
