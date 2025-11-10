import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** Returns 1.0 if no factor found */
export async function getRegionalFactor(regionKey?: string) {
  if (!regionKey) return 1.0;
  const f = await prisma.regionalFactor.findUnique({ where: { regionKey } });
  return f ? f.factor : 1.0;
}

/** Compose a key from location (state + city or zip) */
export function makeRegionKey(loc?: { city?: string; state?: string; zip?: string }) {
  if (!loc) return undefined;
  if (loc.zip) return loc.zip;
  if (loc.state && loc.city) return `US-${loc.state}-${loc.city.replaceAll(" ", "")}`;
  if (loc.state) return `US-${loc.state}`;
  return undefined;
}
