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

type NominatimItem = {
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
  lat?: string;
  lon?: string;
  display_name?: string;
};

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!query || !query.trim()) {
    return null;
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a descriptive User-Agent
        "User-Agent": "landscaping-estimator/1.0 (+support@example.com)",
      },
    });

    if (!res.ok) {
      // Log but don't throw; caller should treat this as "no result"
      const body = await res.text().catch(() => "");
      console.warn(
        "[geocode] Nominatim HTTP error",
        res.status,
        res.statusText,
        body
      );
      return null;
    }

    const raw = (await res.json().catch(() => null)) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const data = raw as NominatimItem[];
    const best = data[0];
    if (!best) return null;

    const a = best.address || {};

    const addrLine = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village || a.hamlet || null;

    return {
      address: addrLine || null,
      city,
      state: a.state || a.region || null,
      postal_code: a.postcode || null,
      country: a.country || null,
      latitude: best.lat ? parseFloat(best.lat) : null,
      longitude: best.lon ? parseFloat(best.lon) : null,
    };
  } catch (err) {
    console.error("[geocode] fetch failed", err);
    return null;
  }
}
