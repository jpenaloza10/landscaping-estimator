import { haversineMiles } from "./distance";

type LatLng = { lat: number; lng: number };

// Helper to safely read numeric env vars with sane fallbacks
function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw != null ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

const conf = {
  base: numEnv("DELIVERY_BASE", 25),              // flat fee per trip
  perMile: numEnv("DELIVERY_PER_MILE", 2),        // $ per mile
  perMin: numEnv("DELIVERY_PER_MIN", 0.4),        // $ per minute
  fuelPct: numEnv("FUEL_SURCHARGE_PCT", 0.05),    // fuel surcharge as fraction (5% default)
};

export interface DeliveryEstimate {
  miles: number;
  minutes: number;
  base: number;
  variable: number;
  fuel: number;
  total: number;
}

/**
 * Estimate delivery cost between two points.
 *
 * origin/dest: { lat, lng } in decimal degrees
 * avgSpeedMph: average truck speed (defaults to 28 mph)
 */
export function estimateDelivery(
  origin: LatLng,
  dest: LatLng,
  avgSpeedMph = 28
): DeliveryEstimate {
  // Guard against nonsense speeds
  const speed = avgSpeedMph > 0 ? avgSpeedMph : 1;

  const miles = haversineMiles(origin, dest);
  const minutes = (miles / speed) * 60;

  const base = conf.base;
  const variable = miles * conf.perMile + minutes * conf.perMin;
  const fuel = (base + variable) * conf.fuelPct;
  const total = base + variable + fuel;

  // Round to 2 decimals on money-like fields
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    miles: round2(miles),
    minutes: round2(minutes),
    base: round2(base),
    variable: round2(variable),
    fuel: round2(fuel),
    total: round2(total),
  };
}

export const deliveryConfig = conf;
