// ============================================================
// DS NexusFlow — SKU Metadata Registry
// Automatically enriches SKUs during Excel ingestion based on skuName
// ============================================================

export interface SkuMetadata {
  unitVolume: number;
  category: string;
  bulkyFlag: boolean;
}

export const SKU_REGISTRY: Record<string, SkuMetadata> = {
  "Rajnigandha": {
    unitVolume: 0.0008,
    category: "Pan Masala",
    bulkyFlag: false
  },
  "Pass Pass": {
    unitVolume: 0.001,
    category: "Confectionery",
    bulkyFlag: false
  },
  "Pulse Candy": {
    unitVolume: 0.0012,
    category: "Confectionery",
    bulkyFlag: false
  },
  "Catch Club Soda": {
    unitVolume: 0.0028,
    category: "Beverages",
    bulkyFlag: false
  },
  "Catch": {
    unitVolume: 0.0015,
    category: "Spices",
    bulkyFlag: false
  },
  "Kurkure": {
    unitVolume: 0.0035,
    category: "Snacks",
    bulkyFlag: true
  },
  "Too Yumm": {
    unitVolume: 0.0042,
    category: "Snacks",
    bulkyFlag: true
  }
};

export function enrichSku(skuName: string): SkuMetadata {
  for (const [key, meta] of Object.entries(SKU_REGISTRY)) {
    if (skuName.toLowerCase().includes(key.toLowerCase())) {
      return meta;
    }
  }
  
  return {
    unitVolume: 0.001,
    category: "General",
    bulkyFlag: false
  };
}
