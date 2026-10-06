export type CareType = "cookware" | "bakeware" | "utensils" | "tableware" | "cutlery" | "glassware" | "coffee-tea" | "bar" | "storage" | "linen";

export interface CareGuide {
  title: string;
  steps: string[];
}

export const CARE_BY_CATEGORY: Record<string, CareType> = {
  cookware: "cookware",
  bakeware: "bakeware",
  "utensils-gadgets": "utensils",
  tableware: "tableware",
  cutlery: "cutlery",
  "glassware-drinkware": "glassware",
  "coffee-tea": "coffee-tea",
  "bar-wine": "bar",
  "storage-organisation": "storage",
  "kitchen-table-linen": "linen",
};

export const CARE_GUIDES: Record<CareType, CareGuide> = {
  cookware: {
    title: "Pans and pots",
    steps: [
      "Let a hot pan cool before washing it. Plunging hot metal into cold water can warp the base.",
      "Heat gradually on a burner that matches the size of the base, and never leave an empty pan on a high heat.",
      "Use wooden, silicone or nylon tools on coated surfaces.",
      "Check the product details for dishwasher and oven limits, and follow the lower figure if the pan and its lid differ.",
    ],
  },
  bakeware: {
    title: "Tins, trays and oven dishes",
    steps: [
      "Let bakeware cool before washing. A sudden change of temperature can crack ceramic and glass or warp thin metal.",
      "Soak baked-on food in warm soapy water rather than scraping with metal.",
      "Grease or line tins as the recipe asks, even on non-stick surfaces.",
      "Dry metal tins completely before storing to prevent rust spots.",
    ],
  },
  utensils: {
    title: "Utensils and prep tools",
    steps: [
      "Wash tools soon after use so food does not dry on.",
      "Dry metal tools fully before putting them away.",
      "Keep wooden and silicone tools away from direct heat sources such as hob rings and grill elements.",
    ],
  },
  tableware: {
    title: "Plates, bowls and serveware",
    steps: [
      "Avoid sudden temperature changes, such as moving a dish from the fridge straight into a hot oven.",
      "Stack plates with care and avoid sliding them against each other, which can mark the glaze.",
      "Pieces with metallic rims or hand-painted decoration should be hand washed and kept out of the microwave.",
      "Check the product details for dishwasher, microwave and oven suitability.",
    ],
  },
  cutlery: {
    title: "Cutlery",
    steps: [
      "Rinse cutlery soon after use, especially after salty, acidic or egg-based food.",
      "Dry by hand straight after washing to avoid water marks.",
      "In a dishwasher, keep stainless steel apart from silver-plated pieces and use a mild detergent.",
    ],
  },
  glassware: {
    title: "Glasses and drinkware",
    steps: [
      "Avoid sudden temperature changes, such as pouring boiling water into a cold glass.",
      "Hold stemmed glasses by the bowl when washing and drying, not by the stem or foot.",
      "Dry with a lint-free cloth to prevent water marks.",
      "Check the product details for dishwasher suitability. Hand wash anything with a printed or metallic finish.",
    ],
  },
  "coffee-tea": {
    title: "Coffee and tea equipment",
    steps: [
      "Rinse after each use so coffee oils and tea tannins do not build up.",
      "Take apart filters, plungers and infusers to clean them, and let every part dry before reassembling.",
      "Descale regularly if you live in a hard-water area.",
      "Let glass and ceramic cool before washing to avoid cracking.",
    ],
  },
  bar: {
    title: "Bar and wine tools",
    steps: [
      "Rinse tools straight after use, especially after citrus, sugar syrups or salt.",
      "Dry metal tools fully before storing them.",
      "Clean ice buckets and wine coolers with mild soap and leave them open to dry.",
    ],
  },
  storage: {
    title: "Storage and organisation",
    steps: [
      "Wash new containers before first use.",
      "Let containers and lids dry fully before closing them, so no moisture is sealed in.",
      "Check the product details before using a container in the microwave, freezer or dishwasher. Remove lids before microwaving.",
      "Keep plastic and silicone away from direct heat sources.",
    ],
  },
  linen: {
    title: "Kitchen and table linen",
    steps: [
      "Wash before first use. Natural fibres can shrink slightly on the first wash.",
      "Wash dark and bright colours separately for the first few washes.",
      "Avoid fabric softener on tea towels, as it reduces how well they absorb.",
      "Follow the temperature on the care label, and treat stains while they are fresh.",
    ],
  },
};

export interface MaterialCare {
  id: string;
  match: RegExp;
  nameOnly?: boolean;
  title: string;
  steps: string[];
}

export const MATERIAL_CARE: MaterialCare[] = [
  {
    id: "cast-iron",
    match: /\bcast[\s-]iron\b/i,
    title: "Cast iron",
    steps: [
      "Wash by hand with hot water and a brush. Do not soak.",
      "Dry straight away, then rub a thin layer of cooking oil over the surface while it is still warm.",
    ],
  },
  {
    id: "carbon-steel",
    match: /\bcarbon[\s-]steel\b/i,
    title: "Carbon steel",
    steps: [
      "Wash by hand and dry straight away. Carbon steel rusts if left wet.",
      "Wipe with a thin layer of oil after drying. The surface darkens with use, which is normal.",
    ],
  },
  {
    id: "enamel",
    match: /\benamel(?:led|ed)?\b/i,
    title: "Enamel",
    steps: ["Avoid metal scourers and harsh abrasives, which scratch the enamel.", "Heat on low to medium. Do not heat an empty enamelled pan."],
  },
  {
    id: "non-stick",
    match: /\bnon[\s-]stick\b|\bceramic[\s-]coated\b/i,
    title: "Non-stick coatings",
    steps: ["Cook on a low to medium heat.", "Use wooden or silicone tools and a soft sponge. Metal tools and scourers wear the coating."],
  },
  {
    id: "wood",
    match: /\b(?:wood|wooden|acacia|oak|beech|olive[\s-]wood|walnut|bamboo|teak)\b/i,
    nameOnly: true,
    title: "Wood",
    steps: ["Hand wash and dry upright. Do not soak or put wood in the dishwasher.", "Rub with food-safe mineral oil now and then to stop the wood drying out."],
  },
  {
    id: "copper",
    match: /\bcopper\b/i,
    title: "Copper",
    steps: ["Hand wash and dry straight away.", "Polish with a copper cleaner when the colour dulls."],
  },
];

const MATERIAL_TYPES: CareType[] = ["cookware", "bakeware", "utensils", "tableware", "coffee-tea", "bar", "storage"];

export function careFor(rootCategorySlug: string | null | undefined, name: string, details: string): { guide: CareGuide | null; materials: MaterialCare[] } {
  const type = rootCategorySlug ? CARE_BY_CATEGORY[rootCategorySlug] : undefined;
  if (!type) return { guide: null, materials: [] };
  const found = MATERIAL_TYPES.includes(type) ? MATERIAL_CARE.filter((m) => m.match.test(m.nameOnly ? name : `${name} ${details}`)) : [];
  const enamelled = found.some((m) => m.id === "enamel");
  return { guide: CARE_GUIDES[type], materials: enamelled ? found.filter((m) => m.id !== "cast-iron") : found };
}
