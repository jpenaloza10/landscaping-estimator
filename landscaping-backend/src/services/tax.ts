import fetch from "node-fetch";

type TaxApiResponse = {
  totalRate?: number;
  rates?: { state?: number; county?: number; city?: number; special?: number };
};

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const cache = new Map<string, { rate: number; expiresAt: number }>();

function now() {
  return Date.now();
}

function getFromCache(zip: string) {
  const hit = cache.get(zip);
  if (!hit) return null;
  if (hit.expiresAt < now()) {
    cache.delete(zip);
    return null;
  }
  return hit.rate;
}

function setCache(zip: string, rate: number) {
  cache.set(zip, { rate, expiresAt: now() + CACHE_TTL_MS });
}

// Simple fallback if the API has issues (adjust as needed)
const STATE_FALLBACK: Record<string, number> = {
  CA: 0.0725, TX: 0.0625, AZ: 0.056, NV: 0.0685, WA: 0.065, OR: 0.0,
};

export async function getTaxRateByZip(zip: string, state?: string): Promise<number> {
  if (!zip) return 0;

  const cached = getFromCache(zip);
  if (typeof cached === "number") return cached;

  const url = `https://taxrates.api.avalara.com:443/postal?country=usa&postal=${encodeURIComponent(zip)}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);


    if (!res.ok) throw new Error(`Avalara postal API error: ${res.status}`);
    const data = (await res.json()) as TaxApiResponse;
    const rate = typeof data.totalRate === "number" ? data.totalRate : 0;

    // Cache and return
    setCache(zip, rate);
    return rate;
  } catch (err) {
    // Fallback to state base rate if provided
    if (state && STATE_FALLBACK[state]) return STATE_FALLBACK[state];
    return 0;
  }
}

export async function computeTax(subtotal: number, params?: { zip?: string; state?: string }) {
  const rate = await getTaxRateByZip(params?.zip ?? "", params?.state);
  const tax = Math.max(0, subtotal) * rate;
  return { rate, tax };
}
