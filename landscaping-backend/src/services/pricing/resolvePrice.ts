import { PrismaClient } from "@prisma/client";
import { PriceProvider, PriceQuery, PriceResult } from "./providers";
import { SupplierProvider } from "./provider.supplier";
import { RetailProvider } from "./provider.retail";
import { IndexProvider } from "./provider.index";
const prisma = new PrismaClient();

const PROVIDERS: PriceProvider[] = [SupplierProvider, RetailProvider, IndexProvider];

const TTL: Record<string, number> = {
  SupplierCSV: 10080, // 7 days
  RetailX: 1440,      // 24h
  CityIndex: 43200    // 30 days
};

export async function resolveUnitPrice(q: PriceQuery): Promise<PriceResult | null> {
  // 1) snapshot cache
  if (q.zip) {
    const snap = await prisma.priceSnapshot.findFirst({
      where: { zip: q.zip, material: { slug: q.materialSlug } },
      orderBy: { fetchedAt: "desc" }
    });
    if (snap) {
      const ageMin = (Date.now() - new Date(snap.fetchedAt).getTime()) / 60000;
      const ttl = snap.ttlMinutes ?? 1440;
      if (ageMin <= ttl) {
        return {
          unitCost: Number(snap.unitCost),
          currency: snap.currency as "USD",
          source: snap.source as any,
          provider: snap.provider,
          fetchedAt: snap.fetchedAt,
          meta: snap.meta as any
        };
      }
    }
  }

  // 2) provider chain
  for (const p of PROVIDERS) {
    if (await p.canHandle(q)) {
      const res = await p.getPrice(q);
      if (res) {
        // write snapshot
        const mat = await prisma.material.findUnique({ where: { slug: q.materialSlug } });
        if (mat && q.zip) {
          await prisma.priceSnapshot.create({
            data: {
              materialId: mat.id,
              zip: q.zip,
              unitCost: res.unitCost,
              currency: res.currency,
              source: res.source,
              provider: res.provider,
              fetchedAt: res.fetchedAt,
              ttlMinutes: TTL[res.provider] ?? 1440,
              meta: res.meta ?? {}
            }
          });
        }
        return res;
      }
    }
  }
  return null;
}
