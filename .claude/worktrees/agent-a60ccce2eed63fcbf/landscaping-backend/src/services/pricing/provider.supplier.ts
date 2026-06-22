import { PrismaClient } from "@prisma/client";
import { PriceProvider, PriceQuery, PriceResult } from "./providers";
const prisma = new PrismaClient();

export const SupplierProvider: PriceProvider = {
  name: "SupplierCSV",
  type: "supplier",
  async canHandle(q) { return !!q.materialSlug; },
  async getPrice(q: PriceQuery): Promise<PriceResult | null> {
    const mat = await prisma.material.findUnique({ where: { slug: q.materialSlug } });
    if (!mat) return null;

    const vp = await prisma.vendorPrice.findFirst({
      where: {
        materialId: mat.id,
        vendor: { type: "supplier" },
        OR: [
          { locationKey: q.zip ?? undefined },
          { locationKey: null }
        ],
      },
      orderBy: { fetchedAt: "desc" }
    });
    if (!vp) return null;

    return {
      unitCost: Number(vp.unitCost),
      currency: "USD",
      source: "supplier",
      provider: "SupplierCSV",
      fetchedAt: vp.fetchedAt,
      meta: { vendorId: vp.vendorId, sku: vp.sku, locationKey: vp.locationKey }
    };
  }
};
