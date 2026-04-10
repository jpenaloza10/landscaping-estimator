import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";
import { evalFormula, applyWaste } from "../services/calc";
import { computeTax } from "../services/tax";
import type { AssemblyItem } from "@prisma/client";
import { resolveUnitPrice } from "../services/pricing/resolvePrice";
import { getRegionalFactor, makeRegionKey } from "../services/region";
import { estimateDelivery } from "../services/delivery";
import { createBudgetSnapshot } from "../services/budget";

const r = Router();

const VALID_STATUSES = ["DRAFT", "SENT", "APPROVED", "REJECTED"] as const;
type EstimateStatus = (typeof VALID_STATUSES)[number];

/**
 * Helper: get numeric user id from req.user.id
 */
function getUserId(req: Request): number | null {
  const raw = req.user?.id;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type LocationInput = {
  zip?: string;
  state?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  vendorLat?: number;
  vendorLng?: number;
};

type CreateEstimateInput = {
  projectId: number | string;
  title?: string;
  location?: LocationInput;
  lines: Array<{ assemblyId: string; inputs: Record<string, number> }>;
};

function coerceProjectId(id: number | string): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) throw new Error("Invalid projectId: must be a number");
  return n;
}

// All estimate routes require auth
r.use(authMiddleware);

// === List ALL estimates for the authenticated user (across all projects) ===
r.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const estimates = await prisma.estimate.findMany({
      where: {
        project: { user_id: userId },
      },
      select: {
        id: true,
        title: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        lines: {
          select: { id: true, assemblyId: true, lineTotal: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ estimates });
  } catch (err: unknown) {
    console.error("[estimates.get /]", err);
    return res.status(500).json({ error: "Failed to load estimates" });
  }
});

// === Create & calculate estimate ===
r.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, title, location, lines } = req.body as CreateEstimateInput;

    if (!projectId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const projectIdNum = coerceProjectId(projectId);

    // Ensure project belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: projectIdNum, user_id: userId },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Regional factor
    const regionKey = makeRegionKey(location);
    const regionFactor = await getRegionalFactor(regionKey);

    type ResolvedItem = {
      name: string;
      unit: string;
      unitCost: number;
      qty: number;
      extended: number;
      provider?: string;
      source?: string;
      fetchedAt?: string;
      deliveryShare?: number;
    };

    const calcLines: Array<{
      assemblyId: string;
      inputs: Record<string, number>;
      items: ResolvedItem[];
      lineTotal: number;
    }> = [];

    let subtotal = 0;

    const assemblyIds = lines.map((l) => l.assemblyId);
    const assembliesById = new Map(
      (
        await prisma.assembly.findMany({
          where: { id: { in: assemblyIds } },
          include: { items: true },
        })
      ).map((a) => [a.id, a])
    );

    for (const line of lines) {
      const assembly = assembliesById.get(line.assemblyId);
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
            unitCost = unitCost * (regionFactor || 1);
            provider = "RegionalizedIndex";
            source = "index";
          }
        } else {
          unitCost = unitCost * (regionFactor || 1);
          provider = "LaborRegional";
          source = "index";
        }

        const extended = qty * unitCost;
        items.push({ name: it.name, unit: it.unit, unitCost, qty, extended, provider, source, fetchedAt });
      }

      const lineTotal = items.reduce((acc, curr) => acc + curr.extended, 0);
      subtotal += lineTotal;
      calcLines.push({ assemblyId: assembly.id, inputs, items, lineTotal });
    }

    // === Delivery Cost ===
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
          l.items = l.items.map((it) => ({
            ...it,
            deliveryShare: Number(((it.extended / l.lineTotal) * share).toFixed(2)),
          }));
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
        title: title?.trim() || null,
        status: "DRAFT",
        location,
        subtotal,
        tax,
        total,
        lines: {
          create: calcLines.map((l) => ({
            ...l,
            items: l.items as any,
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
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to create estimate";
    const isClientError =
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("required");
    res.status(isClientError ? 400 : 500).json({ error: message });
  }
});

// === Update estimate status ===
r.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { status } = req.body as { status: string };

    if (!status || !VALID_STATUSES.includes(status as EstimateStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    // Verify the estimate belongs to this user
    const existing = await prisma.estimate.findFirst({
      where: { id, project: { user_id: userId } },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Estimate not found" });

    const updated = await prisma.estimate.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
        total: true,
        updatedAt: true,
      },
    });

    return res.json({ estimate: updated });
  } catch (err: unknown) {
    console.error("[estimates.patch/:id/status]", err);
    return res.status(500).json({ error: "Failed to update estimate status" });
  }
});

// === Update estimate title ===
r.patch("/:id/title", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { title } = req.body as { title?: string };

    const existing = await prisma.estimate.findFirst({
      where: { id, project: { user_id: userId } },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Estimate not found" });

    const updated = await prisma.estimate.update({
      where: { id },
      data: { title: title?.trim() || null },
      select: { id: true, title: true, updatedAt: true },
    });

    return res.json({ estimate: updated });
  } catch (err: unknown) {
    console.error("[estimates.patch/:id/title]", err);
    return res.status(500).json({ error: "Failed to update estimate title" });
  }
});

// === Finalize estimate & create Budget Snapshot ===
r.post("/:id/finalize", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const estimate = await prisma.estimate.findFirst({
      where: { id, project: { user_id: userId } },
    });

    if (!estimate) return res.status(404).json({ error: "Estimate not found" });

    const snapshot = await createBudgetSnapshot(estimate.projectId as any, estimate.id);

    // Mark as APPROVED when finalized
    await prisma.estimate.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    res.json({ ok: true, snapshot });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to finalize estimate",
    });
  }
});

// helper: kebab-case for fallback material slugs
function kebab(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default r;
