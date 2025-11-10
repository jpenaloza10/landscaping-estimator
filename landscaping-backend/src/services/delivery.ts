import { haversineMiles } from "./distance";

const conf = {
  base: Number(process.env.DELIVERY_BASE ?? 25),
  perMile: Number(process.env.DELIVERY_PER_MILE ?? 2),
  perMin: Number(process.env.DELIVERY_PER_MIN ?? 0.4),
  fuelPct: Number(process.env.FUEL_SURCHARGE_PCT ?? 0.05),
};

export function estimateDelivery(origin:{lat:number,lng:number}, dest:{lat:number,lng:number}, avgSpeedMph = 28) {
  const miles = haversineMiles(origin, dest);
  const minutes = (miles / avgSpeedMph) * 60;
  const base = conf.base;
  const variable = (miles * conf.perMile) + (minutes * conf.perMin);
  const fuel = (base + variable) * conf.fuelPct;
  const total = base + variable + fuel;
  return { miles, minutes, base, variable, fuel, total };
}
