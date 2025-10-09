import fetch from "node-fetch";

export type GeocodeResult = {
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function geocode(query: string, timeoutMs = 4000): Promise<GeocodeResult | null> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: { "User-Agent": "landscaping-estimator/1.0 (+support@example.com)" }
    });

    if (!res.ok) return null;
    const arr: any[] = await res.json();
    if (!arr?.length) return null;

    const best = arr[0];
    const a = best.address ?? {};
    const city = a.city || a.town || a.village || a.hamlet || null;

    return {
      address: [a.house_number, a.road].filter(Boolean).join(" ") || null,
      city,
      state: a.state || a.region || null,
      postal_code: a.postcode || null,
      country: a.country || null,
      latitude: best.lat ? parseFloat(best.lat) : null,
      longitude: best.lon ? parseFloat(best.lon) : null
    };
  } catch {
    return null; 
  } finally {
    clearTimeout(to);
  }
}

