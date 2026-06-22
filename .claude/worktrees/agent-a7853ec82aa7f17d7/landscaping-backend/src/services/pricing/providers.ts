export type PriceQuery = {
    materialSlug: string;
    uom?: string;
    qty?: number;
    zip?: string;
  };
  
  export type PriceResult = {
    unitCost: number;
    currency: "USD";
    source: "supplier" | "retail" | "marketplace" | "index";
    provider: string;        // e.g., "AcmeSupplyCSV", "RetailX", "CityIndex"
    fetchedAt: Date;
    meta?: Record<string, any>;
  };
  
  export interface PriceProvider {
    name: string;
    type: PriceResult["source"];
    canHandle(q: PriceQuery): Promise<boolean> | boolean;
    getPrice(q: PriceQuery): Promise<PriceResult | null>;
  }
  