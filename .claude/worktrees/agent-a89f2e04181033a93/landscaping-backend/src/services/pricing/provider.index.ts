import { PrismaClient } from "@prisma/client";
import { PriceProvider, PriceQuery, PriceResult } from "./providers";
const prisma = new PrismaClient();

export const IndexProvider: PriceProvider = {
  name: "CityIndex",
  type: "index",
  async canHandle(q) { return !!q.materialSlug; },
  async getPrice(q: PriceQuery): Promise<PriceResult | null> {
    // Look for a “baseline” VendorPrice with vendor.type="index"
    const mat = await prisma.material.findUnique({ where: { slug: q.materialSlug } });
    if (!mat) return null;

    const vp = await prisma.vendorPrice.findFirst({
      where: { materialId: mat.id, vendor: { type: "index" } },
      orderBy: { fetchedAt: "desc" }
    });
    if (!vp) return null;

    return {
      unitCost: Number(vp.unitCost),
      currency: "USD",
      source: "index",
      provider: "CityIndex",
      fetchedAt: vp.fetchedAt,
      meta: { vendorId: vp.vendorId }
    };
  }
};
