import type { WeaponTypeKey } from "@/lib/skins/cs2";

export interface WeaponTypeQuota {
  type: WeaponTypeKey;
  cap: number;
}

export interface CatalogConfig {
  appId: number;
  target: { min: number; max: number };
  quotas: WeaponTypeQuota[];
  pricing: {
    margin: number;
    minMarginAbs: number;
    priceTolerance: number;
    minPrice: number;
    maxPrice: number;
    maxCostOverReference: number;
    bands: number[];
  };
  include: {
    statTrak: boolean;
    souvenir: boolean;
    vanillaStar: boolean;
    minStock: number;
  };
  selection: {
    keepExisting: boolean;
    maxVariantsPerSkin: number;
  };
  images: {
    hosting: "steam";
    size: string;
  };
  sync: {
    chunkSize: number;
  };
}

export const catalogConfig: CatalogConfig = {
  appId: 730,
  target: { min: 3000, max: 5000 },
  quotas: [
    { type: "rifles", cap: 900 },
    { type: "pistols", cap: 820 },
    { type: "smgs", cap: 560 },
    { type: "sniper-rifles", cap: 420 },
    { type: "shotguns", cap: 320 },
    { type: "machine-guns", cap: 120 },
    { type: "knives", cap: 640 },
    { type: "gloves", cap: 260 },
  ],
  pricing: {
    margin: 0.07,
    minMarginAbs: 0.1,
    priceTolerance: 0.03,
    minPrice: 0.5,
    maxPrice: 3000,
    maxCostOverReference: 2.5,
    bands: [2, 10, 50, 200, 800],
  },
  include: {
    statTrak: true,
    souvenir: true,
    vanillaStar: true,
    minStock: 1,
  },
  selection: {
    keepExisting: true,
    maxVariantsPerSkin: 10,
  },
  images: {
    hosting: "steam",
    size: "360fx360f",
  },
  sync: {
    chunkSize: 400,
  },
};

export function quotaTotal(): number {
  return catalogConfig.quotas.reduce((sum, q) => sum + q.cap, 0);
}
