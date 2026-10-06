import { IMAGE_VARIANT_WIDTHS } from "../lib/image-loader";
import { STORE_POLICY } from "./store-policy";

export type Matcher = string | RegExp;

export type MatchScope = "leaf" | "name" | "description" | "brand";

export interface StorefrontSubcategory {
  slug: string;
  name: string;
  description?: string;
  categoryArt?: string | null;
}

export interface StorefrontCategory {
  slug: string;
  name: string;
  description?: string;
  subs: StorefrontSubcategory[];
  categoryArt?: string | null;
}

export interface TaxonomyRoute {
  path: string;
  to: string;
}

export interface TaxonomyExclusion {
  path: string;
  rule: string;
}

export interface NameReroute {
  startsWith: string[];
  to: string;
}

export interface ExcludeRule {
  id: string;
  label: string;
  scopes: MatchScope[];
  keywords: Matcher[];
  unless?: Matcher[];
  onlyIn?: string[];
}

export interface CatalogConfig {
  source: {
    isoCode: string;
    cacheTtlHours: number;
  };
  storefront: StorefrontCategory[];
  taxonomy: {
    root: string;
    watch: string[];
    routes: TaxonomyRoute[];
    exclude: TaxonomyExclusion[];
    reroute: NameReroute[];
  };
  exclude: {
    ignorePhrases: Matcher[];
    rules: ExcludeRule[];
  };
  price: {
    sourceCurrency: "EUR";
    sourceToBaseRate: number;
    vatPercent: number;
    multiplier: number;
    roundToNinetyNine: boolean;
    minRetail: number;
    maxRetail: number;
    minMarginOverWholesale: number;
    anomalyFactor: number;
    anomalyMinSample: number;
    anomalyBasis: "primary" | "subcategory";
  };
  quality: {
    allowedConditions: string[];
    minImages: number;
    maxImagesPerProduct: number;
    skipLogoImages: boolean;
    minNameLength: number;
    maxNameLength: number;
    minDescriptionChars: number;
    maxVariantsPerName: number;
    requireInStock: boolean;
    maxPackUnits: number;
    maxPackUnitsByPrimary: Record<string, number>;
  };
  limits: {
    maxProducts: number;
    maxPerPrimary: number;
    maxPerSub: number;
    minPerPrimary: number;
    minPerSub: number;
    maxTopLevel: number;
  };
  images: {
    hosting: "supplier" | "r2";
    keyPrefix: string;
    concurrency: number;
    timeoutMs: number;
    maxBytes: number;
    variants: {
      widths: readonly number[];
      quality: number;
      effort: number;
    };
  };
  brands: {
    showcaseLimit: number;
    minProducts: number;
  };
}

const storefront: StorefrontCategory[] = [
  {
    slug: "cookware",
    name: "Cookware",
    description: "Frying pans, saucepans, casseroles and woks for every hob.",
    categoryArt: null,
    subs: [
      { slug: "frying-pans", name: "Frying pans & skillets", categoryArt: null },
      { slug: "saucepans-stockpots", name: "Saucepans, stockpots & pressure cookers", categoryArt: null },
      { slug: "casseroles", name: "Casseroles & Dutch ovens", categoryArt: null },
      { slug: "cookware-sets", name: "Pan & pot sets", categoryArt: null },
      { slug: "woks", name: "Woks", categoryArt: null },
      { slug: "griddles-grill-pans", name: "Griddles & grill pans", categoryArt: null },
      { slug: "lids-pan-accessories", name: "Lids & pan accessories", categoryArt: null },
    ],
  },
  {
    slug: "bakeware",
    name: "Bakeware",
    description: "Tins, trays, oven dishes and pastry tools.",
    categoryArt: null,
    subs: [
      { slug: "cake-tins-moulds", name: "Cake tins & moulds", categoryArt: null },
      { slug: "baking-trays", name: "Baking trays & sheets", categoryArt: null },
      { slug: "oven-dishes", name: "Oven dishes & roasters", categoryArt: null },
      { slug: "pastry-tools", name: "Pastry & decorating tools", categoryArt: null },
    ],
  },
  {
    slug: "utensils-gadgets",
    name: "Utensils & gadgets",
    description: "Spatulas, ladles, graters, boards and everyday prep tools.",
    categoryArt: null,
    subs: [
      { slug: "cooking-utensils", name: "Cooking utensils", categoryArt: null },
      { slug: "prep-tools", name: "Prep tools & gadgets", categoryArt: null },
      { slug: "chopping-boards", name: "Chopping boards", categoryArt: null },
      { slug: "colanders-sieves", name: "Colanders & sieves", categoryArt: null },
      { slug: "measuring-tools", name: "Measuring jugs, spoons & timers", categoryArt: null },
      { slug: "salt-pepper-mills", name: "Salt & pepper mills", categoryArt: null },
    ],
  },
  {
    slug: "tableware",
    name: "Tableware",
    description: "Plates, bowls, dinner sets and serveware.",
    categoryArt: null,
    subs: [
      { slug: "plates", name: "Plates", categoryArt: null },
      { slug: "bowls", name: "Bowls", categoryArt: null },
      { slug: "dinner-sets", name: "Dinner sets", categoryArt: null },
      { slug: "serveware", name: "Platters, trays & serveware", categoryArt: null },
      { slug: "tapas-snack-dishes", name: "Tapas & snack dishes", categoryArt: null },
    ],
  },
  {
    slug: "cutlery",
    name: "Cutlery",
    description: "Cutlery sets, forks, spoons and serving pieces.",
    categoryArt: null,
    subs: [
      { slug: "cutlery-sets", name: "Cutlery sets", categoryArt: null },
      { slug: "forks-spoons", name: "Forks & spoons", categoryArt: null },
      { slug: "serving-cutlery", name: "Serving cutlery & ladles", categoryArt: null },
    ],
  },
  {
    slug: "glassware-drinkware",
    name: "Glassware & drinkware",
    description: "Tumblers, wine glasses, carafes and bottles.",
    categoryArt: null,
    subs: [
      { slug: "drinking-glasses", name: "Tumblers & everyday glasses", categoryArt: null },
      { slug: "wine-champagne-glasses", name: "Wine, champagne & cocktail glasses", categoryArt: null },
      { slug: "beer-spirit-glasses", name: "Beer, shot & spirit glasses", categoryArt: null },
      { slug: "jugs-carafes", name: "Jugs & carafes", categoryArt: null },
      { slug: "bottles-tumblers", name: "Flasks & travel cups", categoryArt: null },
    ],
  },
  {
    slug: "coffee-tea",
    name: "Coffee & tea",
    description: "Cafetières, moka pots, teapots and mugs. No machines, no plugs.",
    categoryArt: null,
    subs: [
      { slug: "moka-pots", name: "Moka pots", categoryArt: null },
      { slug: "cafetieres-pour-over", name: "Cafetières & pour-over", categoryArt: null },
      { slug: "teapots-infusers", name: "Teapots, kettles & infusers", categoryArt: null },
      { slug: "mugs-cups", name: "Mugs", categoryArt: null },
      { slug: "cups-saucers", name: "Cups & saucers", categoryArt: null },
      { slug: "coffee-accessories", name: "Sugar, milk & caddies", categoryArt: null },
    ],
  },
  {
    slug: "storage-organisation",
    name: "Storage & organisation",
    description: "Containers, lunch boxes, jars and the racks that keep a kitchen in order.",
    categoryArt: null,
    subs: [
      { slug: "food-containers", name: "Food containers", categoryArt: null },
      { slug: "lunch-boxes", name: "Lunch boxes & cool bags", categoryArt: null },
      { slug: "jars-canisters", name: "Jars, canisters & bread bins", categoryArt: null },
      { slug: "oil-vinegar", name: "Oil & vinegar bottles", categoryArt: null },
      { slug: "kitchen-organisers", name: "Racks & organisers", categoryArt: null },
    ],
  },
  {
    slug: "kitchen-table-linen",
    name: "Kitchen & table linen",
    description: "Tea towels, aprons, tablecloths and napkins.",
    categoryArt: null,
    subs: [
      { slug: "tablecloths-runners", name: "Tablecloths & runners", categoryArt: null },
      { slug: "placemats-napkins", name: "Placemats, napkins & coasters", categoryArt: null },
      { slug: "tea-towels", name: "Tea towels & cloths", categoryArt: null },
      { slug: "aprons-oven-gloves", name: "Aprons & oven gloves", categoryArt: null },
    ],
  },
  {
    slug: "bar-wine",
    name: "Bar & wine",
    description: "Corkscrews, cocktail tools, ice buckets and wine accessories.",
    categoryArt: null,
    subs: [
      { slug: "wine-accessories", name: "Wine accessories", categoryArt: null },
      { slug: "cocktail-tools", name: "Cocktail tools", categoryArt: null },
      { slug: "ice-serving", name: "Ice buckets & coolers", categoryArt: null },
    ],
  },
];

const KITCHENWARE = "Kitchenware";
const PANS = "Kitchenware > Frying pans and saucepans";
const BAKING = "Baking";
const UTENSILS = "Utensils";
const BAR = "Utensils > Bar utensils";
const CUTLERY = "Cutlery, crockery and glassware > Cutlery";
const DINNERWARE = "Cutlery, crockery and glassware > Dinnerware";
const PLATES = "Cutlery, crockery and glassware > Dinnerware > Plates and dishes";
const BOWLS = "Cutlery, crockery and glassware > Dinnerware > Bowls and large cups";
const CUPS = "Cutlery, crockery and glassware > Dinnerware > Cups";
const GLASSWARE = "Cutlery, crockery and glassware > Glassware";
const COFFEE = "Coffee and tea";
const LARDER = "Storage and organisation > Kitchen and larder storage";
const FOOD_STORAGE = "Storage and organisation > Kitchen and larder storage > Food storage";
const TEXTILES = "Soft furnishings > Kitchen textiles";

const route = (to: string, ...paths: string[]): TaxonomyRoute[] => paths.map((path) => ({ path, to }));
const block = (rule: string, ...paths: string[]): TaxonomyExclusion[] => paths.map((path) => ({ path, rule }));

const taxonomyRoutes: TaxonomyRoute[] = [
  ...route("cookware/frying-pans", `${PANS} > Frying Pans`, `${PANS} > Chef's Pans`, `${PANS} > Saute Pans`, `${PANS} > Omelette Pans`, `${PANS} > Crepe & Pancake Pans`, `${PANS} > Paella Pans`),
  ...route("cookware/saucepans-stockpots", `${PANS} > Saucepans`, `${PANS} > Pressure Cookers`, `${PANS} > Stockpots`, `${PANS} > Pasta Pots`, `${PANS} > Double Boilers`, `${PANS} > Asparagus & Vegetable Pots`, `${PANS} > Jam Pans`, `${KITCHENWARE} > Steamers`, `${KITCHENWARE} > CousCous Cookers`, `${KITCHENWARE} > Accessories > Steamer Inserts`),
  ...route("cookware/casseroles", `${PANS} > Casserole pans`, `${PANS} > Braising Pans`, `${PANS} > Dutch Ovens`, `${KITCHENWARE} > Terrines`, `${KITCHENWARE} > Tagines`, `${KITCHENWARE} > Containers for use in the oven > Casserole Dishes`),
  ...route("cookware/cookware-sets", `${PANS} > Frying pan and saucepan sets`),
  ...route("cookware/woks", `${PANS} > Woks & Stir-Fry Pans`),
  ...route("cookware/griddles-grill-pans", `${PANS} > Griddle Pans`),
  ...route("cookware/lids-pan-accessories", `${KITCHENWARE} > Lids`, `${KITCHENWARE} > Accessories > Pressure Cooker Accessories`, `${KITCHENWARE} > Accessories > Knobs & Handles`, `${KITCHENWARE} > Accessories > Egg Poachers`, `${UTENSILS} > Splatter Screens`),
  ...route("cookware", `${KITCHENWARE} > Fondues`),

  ...route("bakeware/cake-tins-moulds", `${BAKING} > Moulds`, `${KITCHENWARE} > Containers for use in the oven > Pie, Tart & Quiche Pans`),
  ...route("bakeware/baking-trays", `${BAKING} > Trays and cooling trays`, `${BAKING} > Baking utensils > Baking Mats`, `${BAKING} > Baking utensils > Cooling Racks`),
  ...route("bakeware/oven-dishes", `${PANS} > Roasting Pans`, `${BAKING} > Moulds > Ramekins & Soufflé Dishes`, `${KITCHENWARE} > Containers for use in the oven > Lasagna Dishes`),
  ...route("bakeware/pastry-tools", `${BAKING} > Baking utensils`, `${UTENSILS} > Baking utensils`),

  ...route("utensils-gadgets/cooking-utensils", `${UTENSILS} > Spatulas, palettes and kitchen spoons`, `${UTENSILS} > Whisks`, `${UTENSILS} > Mashers`, `${UTENSILS} > Ricers`, `${UTENSILS} > Meat Forks`, `${CUTLERY} > Spoons > Spoon Rests`),
  ...route(
    "utensils-gadgets/prep-tools",
    `${UTENSILS} > Garlic Presses`, `${UTENSILS} > Peelers`, `${UTENSILS} > Spiralizers, Manual Graters & Slicers`, `${UTENSILS} > Manual Can Openers`,
    `${UTENSILS} > Manual Juicers`, `${UTENSILS} > Mortar & Pestle Sets`, `${UTENSILS} > Salad Spinners`, `${UTENSILS} > Egg Cutters`, `${UTENSILS} > Funnels`,
    `${UTENSILS} > Fruit peelers and cutters`, `${UTENSILS} > Meat Tenderisers`, `${UTENSILS} > Skewers`, `${UTENSILS} > Ice Cream Scoops`,
    `${UTENSILS} > Seafood Preparation Tools`, `${UTENSILS} > Vegetable Mills`, `${UTENSILS} > Utensils for pasta`, `${UTENSILS} > Thawing trays`,
    `${UTENSILS} > Ham Holders`, `${UTENSILS} > Ice Lolly & Ice Cream Moulds`, `${BOWLS} > Mixing Bowls`, `${CUTLERY} > Cutlery sets > Cutlery Serving Sets`,
  ),
  ...route("utensils-gadgets/chopping-boards", `${UTENSILS} > Chopping boards`),
  ...route("utensils-gadgets/colanders-sieves", `${UTENSILS} > Sieves`, `${UTENSILS} > Colanders & Food Strainers`, `${BAKING} > Baking utensils > Sifters`),
  ...route("utensils-gadgets/measuring-tools", `${UTENSILS} > Measuring Cups & Jugs`, `${UTENSILS} > Measuring Spoon Sets`, `${UTENSILS} > Kitchen Timers`, `${UTENSILS} > Kitchen thermometers > Meat Thermometers`),
  ...route("utensils-gadgets/salt-pepper-mills", `${LARDER} > Dispensers for dressings and spices > Pepper Mills`, `${LARDER} > Dispensers for dressings and spices > Spice Mills`, `${LARDER} > Dispensers for dressings and spices > Salt & Pepper Shakers`, `${LARDER} > Dispensers for dressings and spices > Spice Shakers`),

  ...route("tableware/plates", `${PLATES} > Plates`),
  ...route("tableware/bowls", BOWLS),
  ...route("tableware/dinner-sets", "Cutlery, crockery and glassware > Dinnerware sets"),
  ...route(
    "tableware/serveware",
    `${PLATES} > Trays`, `${PLATES} > Cake Stands`, `${PLATES} > Etageres`, `${PLATES} > Butter Dishes`, `${PLATES} > Gravy Boats & Stands`,
    `${PLATES} > Honey Jars`, `${PLATES} > Cheese Plate Covers`, `${PLATES} > Plates > Cheese Plates`, `${PLATES} > Plates > Sushi Plates`,
    `${BOWLS} > Fruit Bowls`, `${DINNERWARE} > Egg Cups`, `${UTENSILS} > Food Domes`, `${UTENSILS} > Trivets`, `${COFFEE} > Accessories for tea > Teapot Trivets`,
  ),
  ...route("tableware/tapas-snack-dishes", `${PLATES} > Appetiser Dishes`, `${PLATES} > Trays > Tapas Trays`, `${BOWLS} > Snack & Dip Bowls`),

  ...route("cutlery/cutlery-sets", `${CUTLERY} > Cutlery sets > Mixed Cutlery Sets`, `${CUTLERY} > Cutlery sets > Steak Cutlery Sets`),
  ...route("cutlery/forks-spoons", `${CUTLERY} > Forks`, `${CUTLERY} > Spoons`, `${CUTLERY} > Children's Cutlery`),
  ...route("cutlery/serving-cutlery", `${CUTLERY} > Serving cutlery`, `${CUTLERY} > Serving spoons`, `${CUTLERY} > Serving tongs and spoons`, `${CUTLERY} > Seafood cutlery`, `${CUTLERY} > Cutlery sets > Seafood Tool Sets`, `${CUTLERY} > Chopstick Rests & Holders`),

  ...route("glassware-drinkware/drinking-glasses", `${GLASSWARE} > Tumblers`, `${GLASSWARE} > Highball Glasses`, `${GLASSWARE} > Water Glasses`, `${GLASSWARE} > Drinkware Sets`, `${GLASSWARE} > Tea and Coffee Glasses`),
  ...route("glassware-drinkware/wine-champagne-glasses", `${GLASSWARE} > Wine glasses`, `${GLASSWARE} > Champagne flute`, `${GLASSWARE} > Cocktail Glasses`, `${GLASSWARE} > Martini Glasses`),
  ...route("glassware-drinkware/beer-spirit-glasses", `${GLASSWARE} > Beer Glasses`, `${GLASSWARE} > Beer Mugs`, `${GLASSWARE} > Cider Glasses`, `${GLASSWARE} > Shot Glasses`, `${GLASSWARE} > Cognac Glasses`, `${GLASSWARE} > Cordial & Liqueur Glasses`, `${GLASSWARE} > Irish Coffee Glasses`),
  ...route("glassware-drinkware/jugs-carafes", `${GLASSWARE} > Jugs and decanters`, `${DINNERWARE} > Sake Pots & Sets`, `${DINNERWARE} > Tea and coffee sets > Coffee and Tea Carafes`),
  ...route("glassware-drinkware/bottles-tumblers", `${LARDER} > Thermos flasks > Drink Flasks`, `${CUPS} > Travel Mugs`, `${BAR} > Flasks`),

  ...route("coffee-tea/moka-pots", `${COFFEE} > Stovetop Coffee Makers`),
  ...route("coffee-tea/cafetieres-pour-over", `${COFFEE} > Cafetières`, `${COFFEE} > Coffee makers`, `${COFFEE} > Coffee maker filters and replacements > Coffee filters > Permanent Filters`),
  ...route("coffee-tea/teapots-infusers", `${DINNERWARE} > Tea and coffee sets > Teapots`, `${COFFEE} > Tea Presses`, `${COFFEE} > Kettles and electric teapots > Stovetop Kettles`, `${COFFEE} > Accessories for tea > Strainers and filters`),
  ...route("coffee-tea/mugs-cups", `${CUPS} > Mugs`, `${CUPS} > Mug Sets`, `${CUPS} > Infusion Mugs`),
  ...route("coffee-tea/cups-saucers", `${CUPS} > Coffee Cups`, `${CUPS} > Coffee Sets`, `${CUPS} > Cup & Saucer Sets`, `${CUPS} > Espresso Cups`, `${CUPS} > Cappuccino Cups`, `${CUPS} > Tea Cups`, `${CUPS} > Tea Sets`, `${CUPS} > Saucers`),
  ...route(
    "coffee-tea/coffee-accessories",
    `${COFFEE} > Tea and coffee storage`, `${DINNERWARE} > Sugar and milk`, `${COFFEE} > Coffee mills > Manual Grinders`,
    `${COFFEE} > Milk whisks and frothers > Manual Milk Frothers`, `${COFFEE} > Accessories for coffee makers > Tampers`,
    `${COFFEE} > Coffee maker filters and replacements > Milk Frothing Pitchers`,
  ),

  ...route(
    "storage-organisation/food-containers",
    `${FOOD_STORAGE} > Food containers`, `${FOOD_STORAGE} > Food holders > Cake Carriers`, `${FOOD_STORAGE} > Cooking Dishes`, `${FOOD_STORAGE} > Can Lids`,
    `${LARDER} > Airtight jars and accessories > Lids`, `${LARDER} > Airtight jars and accessories > Jar Sealers`, `${LARDER} > Airtight jars and accessories > Kits`,
  ),
  ...route("storage-organisation/lunch-boxes", `${FOOD_STORAGE} > Food holders > Lunch Boxes`, `${FOOD_STORAGE} > Food holders > Lunch Bags`, `${FOOD_STORAGE} > Food holders > Cooler Bags`, `${LARDER} > Thermos flasks > Food Flasks`),
  ...route("storage-organisation/jars-canisters", `${FOOD_STORAGE} > Storage Jars & Canisters`, `${FOOD_STORAGE} > Bread Bins`, `${FOOD_STORAGE} > Biscuit Tins & Jars`, `${LARDER} > Airtight jars and accessories > Jars`, `${LARDER} > Dispensers for dressings and spices > Spice Jars`),
  ...route("storage-organisation/oil-vinegar", `${LARDER} > Dispensers for dressings and spices > Drizzlers & Dressing Shakers`, `${DINNERWARE} > Oil & Vinegar Pots`, `${UTENSILS} > Oil Stoppers, Pourers & Sprayers`),
  ...route("storage-organisation/kitchen-organisers", `${LARDER} > Shelves and supports`, "Storage and organisation > Structures, Shelves and drawers > Draining Boards"),

  ...route("kitchen-table-linen/tablecloths-runners", `${TEXTILES} > Tablecloths`, `${TEXTILES} > Table Runners`),
  ...route("kitchen-table-linen/placemats-napkins", `${TEXTILES} > Place Mats`, `${TEXTILES} > Cloth Napkins`, "Cutlery, crockery and glassware > Napkin Rings", `${BAR} > Coasters`),
  ...route("kitchen-table-linen/tea-towels", `${TEXTILES} > Dish Cloth & Towels`, `${TEXTILES} > Linen Sets`),
  ...route("kitchen-table-linen/aprons-oven-gloves", `${TEXTILES} > Aprons`, `${TEXTILES} > Potholders & Oven Gloves`),

  ...route(
    "bar-wine/wine-accessories",
    `${BAR} > Corkscrews`, `${BAR} > Wine Stoppers & Pourers`, `${BAR} > Wine Accessory Sets`, `${BAR} > Foil Cutters`, `${BAR} > Wine Pumps`,
    `${BAR} > Wine Thermometers`, `${BAR} > Wine Drip Rings`, `${BAR} > Waiter Knives`, `${BAR} > Bottle Openers`, `${BAR} > Glass Markers & Charms`,
    `${LARDER} > Shelves and supports > Wine racks and cabinets`,
  ),
  ...route(
    "bar-wine/cocktail-tools",
    `${BAR} > Cocktail Shakers`, `${BAR} > Barware Sets`, `${BAR} > Cocktail Strainers`, `${BAR} > Cocktail Stirrers & Swizzle Sticks`,
    `${BAR} > Cocktail Flair Bottles`, `${BAR} > Cocktail Decorating Supplies`, `${BAR} > Straws`, `${CUTLERY} > Spoons > Cocktail Mixing Spoons`,
  ),
  ...route("bar-wine/ice-serving", `${BAR} > Ice buckets and tongs`, `${BAR} > Wine Bottle Coolers`, `${BAR} > Ice Cube Moulds & Trays`),
];

const taxonomyExclusions: TaxonomyExclusion[] = [
  ...block(
    "knives",
    `${UTENSILS} > Kitchen knives`, `${UTENSILS} > Knife sharpeners`, `${UTENSILS} > Kitchen Scissors`, `${UTENSILS} > Poultry Shears`,
    `${UTENSILS} > Pizza Cutters`, `${UTENSILS} > Potato Chippers`, `${UTENSILS} > Mandolines`, `${CUTLERY} > Knives`,
  ),
  ...block(
    "electric",
    `${COFFEE} > Coffee mills > Electric Blade Grinders`, `${COFFEE} > Coffee mills > Electric Burr Grinders`, `${COFFEE} > Coffee mills > Electric Cone Grinders`,
    `${COFFEE} > Kettles and electric teapots > Hot Tea Machines`, `${COFFEE} > Electric Italian coffee makers`, `${COFFEE} > Single Serve Machines`,
    `${COFFEE} > Coffee maker filters and replacements > Coffeemaker Carafes`, `${COFFEE} > Coffee maker filters and replacements > Drip Trays`,
    `${COFFEE} > Coffee maker filters and replacements > Coffee filters > Reusable Filters`, `${COFFEE} > Accessories for coffee makers > Disposable Coffee Trays`,
    `${KITCHENWARE} > Fondues > Electric Fondues`, `${PLATES} > Food Warmers`, `${LARDER} > Shelves and supports > Wine racks and cabinets > Wine Cabinets`,
    `${UTENSILS} > Kitchen thermometers > Thermometers for the refrigerator`,
  ),
  ...block("hazardous", `${UTENSILS} > Kitchen Blow Torches`),
  ...block(
    "consumables",
    `${COFFEE} > Accessories for coffee makers > Cleaning products for coffee makers`, `${COFFEE} > Coffee maker filters and replacements > Water filters`,
  ),
  ...block(
    "disposable",
    "Cutlery, crockery and glassware > Disposable tableware", `${BAKING} > Moulds > Disposable moulds`, `${BAKING} > Baking utensils > Parchments`,
    `${COFFEE} > Coffee maker filters and replacements > Coffee filters > Disposable Coffee Filters`, `${CUTLERY} > Chopsticks`,
  ),
  ...block(
    "off-niche",
    `${COFFEE} > Accessories for coffee makers > Coffee Capsule Holders`, `${LARDER} > Waste and recycling`, `${LARDER} > Shopping bags and baskets`,
    `${LARDER} > Drink Coolies`, `${FOOD_STORAGE} > Food holders > Wine & Bottle Bags`,
  ),
];

const nameReroutes: NameReroute[] = [
  { startsWith: ["corkscrew"], to: "bar-wine/wine-accessories" },
  { startsWith: ["italian coffee pot", "coffee-maker bialetti moka"], to: "coffee-tea/moka-pots" },
  { startsWith: ["baking tray", "baking sheet", "oven tray", "pizza mould", "pizza tray", "pizza pan", "pizza stone", "stone for pizza", "cooling mesh", "cooling rack", "baking mat"], to: "bakeware/baking-trays" },
  { startsWith: ["oven dish", "oven mould"], to: "bakeware/oven-dishes" },
  { startsWith: ["lunch box", "lunchbox"], to: "storage-organisation/lunch-boxes" },
];

const electricKeywords: Matcher[] = [
  "electric", "electrical", "electronic", "electrically", "appliance", "kitchen appliance",
  "toaster", "blender", "hand mixer", "stand mixer", "fryer", "air fryer", "deep fryer",
  "coffee machine", "espresso machine", "capsule machine", "coffee grinder electric",
  "induction hob", "cooktop", "microwave oven", "mini oven", "toaster oven", "steam oven",
  "food processor", "kitchen robot", "multicooker", "multi cooker", "slow cooker", "rice cooker", "bread maker", "breadmaker",
  "yogurt maker", "yoghurt maker", "waffle maker", "sandwich maker", "sandwich toaster", "crepe maker", "popcorn maker",
  "ice cream maker", "food dehydrator", "vacuum sealer", "heating module",
  "battery", "batteries", "rechargeable", "cordless", "usb", "plug-in", "mains", "volt", "volts", "watt", "watts",
  "led", "lcd", "digital", "wireless", "bluetooth", "motor", "motorised", "motorized", "heating element", "self heating", "heated", "thermostat",
  "power supply", "power adapter", "charger", "charging",
  /\b\d+(?:[.,]\d+)?\s?w\b/i,
  /\b\d+(?:[.,]\d+)?\s?v\b/i,
  /\b\d+(?:[.,]\d+)?\s?kw\b/i,
  /\b\d+\s?mah\b/i,
];

const electricDescriptionKeywords: Matcher[] = [
  /\belectric (?:moka|coffee (?:maker|pot)|espresso|kettle|teapot|pressure cooker|grinder|mill|spice grinder|salt mill|pepper mill|corkscrew|wine opener|milk frother|frother|fondue|can opener|whisk|knife)\b/i,
  /\bprogrammable\b/i,
  /\b(?:digital|lcd|led) (?:display|screen|panel)\b/i,
  /\bbattery[- ]operated\b(?!\s*:\s*no\b)/i,
  /\b(?:rechargeable|usb)\b/i,
  /\b\d{2}(?:\s?[-/]\s?\d{2})?\s?hz\b/i,
];

const electricSpecKeywords: Matcher[] = [
  /\bpower\s*(?:\(w\))?\s*:\s*\d+(?:[.,]\d+)?\s*w\b/i,
  /\bvoltage\s*:\s*\d/i,
  /\b\d+(?:[.,]\d+)?\s?w (?:of )?power\b/i,
  /\bpower supply\s*:\s*(?:battery|batteries|electric|ca |cc|ac |dc |usb)/i,
  /\b(?:battery type|number of batteries)\s*:/i,
];

const APPLIANCE_PRONE = [
  "utensils-gadgets/salt-pepper-mills", "utensils-gadgets/measuring-tools", "utensils-gadgets/prep-tools", "coffee-tea/coffee-accessories",
  "coffee-tea/cafetieres-pour-over", "bar-wine/wine-accessories",
];

const electricLeafKeywords: Matcher[] = ["electric", "electrical", "appliances"];

const knifeKeywords: Matcher[] = [
  "knife", "knives", "cleaver", "blade", "blades", "machete", "sharpener", "knife sharpener", "knife block",
  "whetstone", "sharpening stone", "honing steel", "dagger", "razor", "mandoline", "mandolin", "slicer",
  "axe", "hatchet", "box cutter", "cutter blade", "scissors", "shears",
];

const cutlerySetNames: Matcher[] = [
  /^(?:\d+[- ]piece\s+)?cutlery(?:\s+set)?\b/i,
  /^(?:set of |mixed )?cutlery\b/i,
  /^flatware\b/i,
];

const licensedKeywords: Matcher[] = [
  "disney", "pixar", "marvel", "avengers", "spider man", "spiderman", "spider-man", "iron man", "captain america",
  "dc comics", "batman", "superman", "wonder woman", "justice league", "harry potter", "hogwarts", "fantastic beasts",
  "star wars", "mandalorian", "baby yoda", "grogu", "pokemon", "pokémon", "pikachu", "mickey", "minnie",
  "mickey mouse", "minnie mouse", "winnie the pooh", "toy story", "lilo and stitch", "the lion king",
  "disney princess", "disney frozen", "frozen ii", "elsa and anna", "anna and elsa", "hello kitty", "sanrio", "peppa pig", "paw patrol", "bluey", "barbie", "lego", "minecraft",
  "fortnite", "sonic the hedgehog", "super mario", "nintendo", "playstation", "xbox", "looney tunes", "bugs bunny", "snoopy",
  "peanuts", "smurfs", "simpsons", "the simpsons", "garfield", "sesame street", "minions", "despicable me",
  "shrek", "dragon ball", "naruto", "one piece", "my little pony", "transformers", "hot wheels", "jurassic",
  "game of thrones", "lord of the rings", "stranger things", "squid game", "coca cola", "coca-cola",
  "pepsi", "nutella", "ferrari", "porsche", "lamborghini", "mercedes", "bmw", "real madrid", "fc barcelona",
  "barça", "barca", "atletico de madrid", "atlético de madrid", "juventus", "manchester united", "manchester city",
  "liverpool fc", "chelsea fc", "arsenal", "paris saint germain", "psg", "bayern", "ac milan", "inter milan",
  "nba", "nfl", "uefa", "fifa", "licensed product", "official licence", "official license", "officially licensed",
  "gabby's dollhouse", "spidey", "pj masks", "lol surprise", "rainbow high", "stitch", "miffy", "bandai", "chillfactor",
  "f.c. barcelona", "fcb", "real madrid c.f.", "atletico madrid", "kuromi", "my melody", "cinnamoroll", "pochacco", "paddington",
  "beverly hills polo club", "polo club", "us polo", "u.s. polo", "cyberpunk", "good loot", "sophie la girafe",
];

const licensedBrandKeywords: Matcher[] = [
  "frozen", "cerdá", "cerda", "stor", "kids licensing", "warner bros", "sonic",
];

const licensedDescriptionKeywords: Matcher[] = [
  "disney", "pixar", "marvel", "harry potter", "hogwarts", "star wars", "pokemon", "pikachu", "hello kitty",
  "peppa pig", "paw patrol", "minecraft", "fortnite", "nintendo", "looney tunes", "warner bros", "dc comics",
  "official licence", "official license", "officially licensed", "licensed product", "under licence", "under license",
];

const regionKeywords: Matcher[] = [
  "russian", "russia", "ru language", "ru only", "cyrillic", "cis", "region locked", "region lock", "region free",
  "vpn", "belarus", "spanish text", "text in spanish", "message in spanish", "spanish language", "spanish only",
  "portuguese text", "text in portuguese", "portuguese language", "french text", "text in french", "french language",
  "italian text", "text in italian", "german text", "text in german", "us plug", "uk plug", "not for sale in",
  /\bregion\s*:\s*\w+/i,
  /\b(?:only|exclusively)\s+(?:for|in)\s+(?:spain|portugal|france|italy|germany|uk|usa)\b/i,
];

const regionDescriptionKeywords: Matcher[] = [
  "region locked", "region lock", "cyrillic", "text in spanish", "message in spanish", "text in portuguese", "text in french",
  "text in italian", "text in german", "us plug", "uk plug", "not for sale in", "russian only", "russian language only",
  /\bregion\s*:\s*(?!all\b)\w+/i,
  /\b(?:only|exclusively)\s+(?:for sale\s+)?(?:for|in)\s+(?:spain|portugal|france|italy|germany|the uk|uk|the usa|usa)\b/i,
];

const rules: ExcludeRule[] = [
  { id: "electric", label: "Electric, battery or appliance", scopes: ["name"], keywords: electricKeywords },
  { id: "electric", label: "Electric, battery or appliance", scopes: ["leaf"], keywords: electricLeafKeywords },
  { id: "electric", label: "Electric, battery or appliance", scopes: ["description"], keywords: electricDescriptionKeywords },
  { id: "electric", label: "Electric, battery or appliance", scopes: ["description"], keywords: electricSpecKeywords, onlyIn: APPLIANCE_PRONE },
  { id: "knives", label: "Knives and blades", scopes: ["name"], keywords: knifeKeywords, unless: cutlerySetNames },
  { id: "hazardous", label: "Flame, gas or pressurised tools", scopes: ["name"], keywords: ["blow torch", "blowtorch", "gas torch", "butane", "lighter", "gas refill"] },
  {
    id: "alcohol",
    label: "Alcoholic drinks",
    scopes: ["name"],
    keywords: [
      "alcoholic drink", "alcoholic beverage", "bottle of wine", "bottle of cava", "bottle of champagne", "beer pack", "wine pack",
      /\b\d+(?:[.,]\d+)?\s?%\s?(?:vol|abv|alc)\b/i,
    ],
  },
  {
    id: "consumables",
    label: "Food, drink and cleaning consumables",
    scopes: ["name"],
    keywords: [
      "groceries", "grocery", "delicatessen", "coffee beans", "ground coffee", "coffee pods", "coffee capsules", "tea bags",
      "herbal tea", "supplement", "supplements", "cleaning product", "detergent", "dishwasher tablets", "washing up liquid",
      "descaler", "decalcifier", "limescale remover", "cleaning tablets", "cleaning liquid", "cling film", "aluminium foil roll",
      "greaseproof paper", "tracing paper", "baking paper", "water filter",
    ],
  },
  {
    id: "disposable",
    label: "Disposable or single-use",
    scopes: ["leaf", "name"],
    keywords: ["disposable", "single use", "single-use", "paper plates", "paper plate", "paper cups", "paper cup", "cardboard", "toothpick", "toothpicks", "party plates"],
  },
  {
    id: "adult",
    label: "Adult content",
    scopes: ["name"],
    keywords: [/\badult (?:toys?|products?|games?|content|gifts?|humou?r)\b/i, "adults only", "for adults only", "erotic", "erotica", "sex", "sexy", "sexual", "lingerie", "fetish", "bdsm", "xxx", "18+", "penis", "pecker", "boobs", "naughty", "kinky", "bachelorette", "hen party", "stag party"],
  },
  {
    id: "weapons",
    label: "Weapons and self-defence",
    scopes: ["name"],
    keywords: ["weapon", "weapons", "pistol", "rifle", "airsoft", "crossbow", "ammunition", "ammo", "pepper spray", "self defence", "self defense", "knuckle duster", "brass knuckles", "sword", "katana", "taser", "stun gun", "grenade", "slingshot"],
  },
  {
    id: "vapes",
    label: "Vapes and smoking",
    scopes: ["name"],
    keywords: ["vape", "vaping", "e cigarette", "e-cigarette", "ecig", "shisha", "hookah", "cbd", "cannabis", "weed", "tobacco", "smoking", "cigarette", "cigar", "herb grinder", "rolling papers", "ashtray", "bong"],
  },
  {
    id: "medical",
    label: "Medical and health products",
    scopes: ["name"],
    keywords: ["medical", "medicine", "medicines", "pharmacy", "pharmaceutical", "first aid", "pill", "pills", "pill box", "pill organiser", "clinical", "orthopaedic", "orthopedic", "surgical", "face mask", "masks", "covid", "ppe", "hygiene", "blood pressure", "glucose", "insulin", "inhaler", "baby bottle", "feeding bottle", "breast pump", "teether", "pacifier", "dummy", "baby food", "steriliser", "sterilizer"],
  },
  { id: "licensed", label: "Licensed characters and famous trademarks", scopes: ["name", "brand"], keywords: licensedKeywords },
  { id: "licensed", label: "Licensed characters and famous trademarks", scopes: ["brand"], keywords: licensedBrandKeywords },
  { id: "licensed", label: "Licensed characters and famous trademarks", scopes: ["description"], keywords: licensedDescriptionKeywords },
  { id: "region", label: "Region or language restricted", scopes: ["name"], keywords: regionKeywords },
  { id: "region", label: "Region or language restricted", scopes: ["description"], keywords: regionDescriptionKeywords },
  {
    id: "condition",
    label: "Refurbished, used or outlet stock",
    scopes: ["name"],
    keywords: ["refurbished", "reconditioned", "second hand", "second-hand", "pre owned", "pre-owned", "used", "open box", "outlet stock", "damaged packaging", "grade a", "grade b"],
  },
  {
    id: "off-niche",
    label: "Outside the kitchen niche",
    scopes: ["name"],
    keywords: [
      "toy", "toys", "kids toy", "play kitchen", "toy kitchen", "pets", "for pets", "pet bowl", "pet food", "pet supplies", "dog", "dogs", "puppy",
      "cat bowl", "cat food", "for cats", "bird feeder", "feeder", "gardening", "garden tools", "flower pot", "plant pot", "planter",
      "camping stove", "costume", "fancy dress", "halloween", "automotive", "car", "toilet", "bathroom", "shower",
      "cosmetic", "cosmetics", "make up", "makeup", "sunglasses", "eyewear", "reading glasses", "spectacles", "fashion", "clothing", "jewellery",
      "jewelry", "watch", "watches", "footwear", "shoes", "luggage", "furniture", "coffee table", "side table", "dining table", "chair",
      "stool", "sofa", "sideboard", "lamp", "lighting", "candle", "candles", "wall decor", "wall decoration",
      "christmas decoration", "ornament", "vase", "artificial flowers", "figurine", "picture frame", "wall mirror", "clock", "money box",
      "piggy bank", "photo frame", "hamster", "aquarium", "laundry", "shopping trolley", "shopping cart",
    ],
  },
];

const ignorePhrases: Matcher[] = [
  /\bsuitable for (?:all )?(?:types of )?(?:hobs?|cookers?|stoves?|cooktops?)(?:[^.;()]*?(?:induction|electric|gas|ceramic|vitroceramic|halogen))*/gi,
  /\b(?:all|any) (?:types? of )?(?:hobs?|cookers?|heat sources?)(?: including (?:induction|electric|gas|ceramic))*/gi,
  /\b(?:induction|electric|gas|ceramic|vitroceramic|halogen)(?:\s*(?:,|and|&|\/|or)\s*(?:induction|electric|gas|ceramic|vitroceramic|halogen))*\s*(?:hobs?|cookers?|stoves?|cooktops?|compatible|ready|suitable|base|bottom|plates?|cookings?|kitchens?)\b/gi,
  /\b(?:induction|electric|gas)\s*(?:compatible|suitable|friendly|safe)\b/gi,
  /\bfor induction\b/gi,
  /\b(?:all|any) (?:hobs?|cookers?|stoves?|heat sources?) types?\b/gi,
  /\b(?:for |on )?(?:the )?(?:hobs?|stoves?|cookers?)\s*(?:and|\/|or)\s*(?:the )?ovens?\b/gi,
  /\b(?:for |in )?(?:the )?ovens?\s*(?:and|\/|or)\s*(?:the )?(?:hobs?|stoves?|grills?|dishwashers?|microwaves?)\b/gi,
  /\b(?:dishwasher|microwave|oven|freezer|fridge)(?:\s*(?:,|and|&|\/)\s*(?:dishwasher|microwave|oven|freezer|fridge))*\s*[- ]?\s*(?:safe|proof|suitable|friendly|resistant)\b/gi,
  /\bsuitable for (?:the )?(?:dishwasher|microwave|oven|freezer)(?:\s*(?:,|and|&|\/)\s*(?:dishwasher|microwave|oven|freezer))*/gi,
  /\b(?:ovenproof|oven-proof|ovenware|microwavable|microwaveable)\b/gi,
  /\b(?:dutch )?ovens?\s*(?:to\s*table|dish(?:es)?|tray(?:s)?|gloves?|mitts?|tins?|moulds?|molds?|roasting|bag)\b/gi,
  /\b(?:home|house) (?:and|&) garden\b/gi,
  /\b(?:from|to|for|in|into|inside) (?:the |an |your )?oven\b/gi,
  /\bheat[- ]resistant\b/gi,
  /\b(?:led|lead)[- ]free\b/gi,
  /\bpan(?:s)? with (?:induction )?base\b/gi,
  /\b(?:with|without) (?:an? )?electric(?:al)? (?:appliances?|hobs?|cookers?)\b/gi,
  /\bnon[- ]electric\b/gi,
  /\bmanual(?:ly)? (?:operated|powered)\b/gi,
  /\bno (?:batteries|battery|electricity|power) (?:needed|required)\b/gi,
];

const PRICE_VAT_PERCENT = STORE_POLICY.tax.pricesIncludeVat ? STORE_POLICY.tax.vatRatePercent : 0;

export const catalogConfig: CatalogConfig = {
  source: {
    isoCode: "en",
    cacheTtlHours: 6,
  },
  storefront,
  taxonomy: {
    root: "Home and cooking",
    watch: [
      "Kitchenware", "Baking", "Utensils", "Cutlery, crockery and glassware", "Coffee and tea",
      "Storage and organisation > Kitchen and larder storage", "Storage and organisation > Structures, Shelves and drawers > Draining Boards",
      "Soft furnishings > Kitchen textiles",
    ],
    routes: taxonomyRoutes,
    exclude: taxonomyExclusions,
    reroute: nameReroutes,
  },
  exclude: {
    ignorePhrases,
    rules,
  },
  price: {
    sourceCurrency: "EUR",
    sourceToBaseRate: 0.855,
    vatPercent: PRICE_VAT_PERCENT,
    multiplier: 1,
    roundToNinetyNine: false,
    minRetail: 4,
    maxRetail: 350,
    minMarginOverWholesale: 1.15,
    anomalyFactor: 5,
    anomalyMinSample: 8,
    anomalyBasis: "subcategory",
  },
  quality: {
    allowedConditions: ["NEW"],
    minImages: 1,
    maxImagesPerProduct: 6,
    skipLogoImages: true,
    minNameLength: 6,
    maxNameLength: 140,
    minDescriptionChars: 60,
    maxVariantsPerName: 3,
    requireInStock: true,
    maxPackUnits: 6,
    maxPackUnitsByPrimary: {
      tableware: 12,
      cutlery: 12,
      "glassware-drinkware": 12,
      "coffee-tea": 12,
    },
  },
  limits: {
    maxProducts: 6000,
    maxPerPrimary: 900,
    maxPerSub: 250,
    minPerPrimary: 30,
    minPerSub: 12,
    maxTopLevel: 10,
  },
  images: {
    hosting: "supplier",
    keyPrefix: "brasmora/products",
    concurrency: 6,
    timeoutMs: 30000,
    maxBytes: 15 * 1024 * 1024,
    variants: {
      widths: IMAGE_VARIANT_WIDTHS,
      quality: 78,
      effort: 4,
    },
  },
  brands: {
    showcaseLimit: 24,
    minProducts: 3,
  },
};
