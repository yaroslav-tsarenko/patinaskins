export interface GoogleTaxonomyRefinement {
  keywords: string[];
  id: number;
  name: string;
}

export interface GoogleTaxonomyEntry {
  id: number;
  name: string;
  refine?: GoogleTaxonomyRefinement[];
}

export const GOOGLE_TAXONOMY_VERSION = "2021-09-21";

export const GOOGLE_TAXONOMY_FALLBACK: GoogleTaxonomyEntry = { id: 638, name: "Home & Garden > Kitchen & Dining" };

export const GOOGLE_TAXONOMY: Record<string, GoogleTaxonomyEntry> = {
  cookware: { id: 654, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware" },
  "frying-pans": {
    id: 662,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Skillets & Frying Pans",
    refine: [
      { keywords: ["crepe", "crêpe", "blini"], id: 6838, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Crêpe & Blini Pans" },
      { keywords: ["saute", "sauté"], id: 4423, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Sauté Pans" },
      { keywords: ["paella"], id: 4459, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Paella Pans" },
    ],
  },
  "saucepans-stockpots": {
    id: 661,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Saucepans",
    refine: [
      { keywords: ["pressure cooker"], id: 660, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Pressure Cookers & Canners" },
      { keywords: ["stockpot", "stock pot", "pasta pot"], id: 663, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Stock Pots" },
      { keywords: ["saute", "sauté"], id: 4423, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Sauté Pans" },
      { keywords: ["cookware set", "pan set", "saucepan set"], id: 4721, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Cookware Sets" },
    ],
  },
  casseroles: {
    id: 655,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Casserole Dishes",
    refine: [
      { keywords: ["dutch oven"], id: 657, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Dutch Ovens" },
      { keywords: ["tagine"], id: 5340, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Tagines & Clay Cooking Pots" },
    ],
  },
  "cookware-sets": { id: 4721, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Cookware Sets" },
  woks: { id: 664, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Woks" },
  "griddles-grill-pans": { id: 658, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Griddles & Grill Pans" },
  "lids-pan-accessories": {
    id: 4424,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories",
    refine: [
      { keywords: ["lid"], id: 4660, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Pot & Pan Lids" },
      { keywords: ["steamer"], id: 4529, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Steamer Baskets" },
      { keywords: ["handle"], id: 4661, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Pot & Pan Handles" },
    ],
  },
  bakeware: { id: 640, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware" },
  "cake-tins-moulds": {
    id: 643,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Cake Pans & Molds",
    refine: [
      { keywords: ["muffin", "cupcake", "tart", "pastry"], id: 644, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Muffin & Pastry Pans" },
      { keywords: ["loaf", "bread"], id: 642, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Bread Pans & Molds" },
      { keywords: ["pie", "quiche", "flan"], id: 645, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Pie & Quiche Pans" },
    ],
  },
  "baking-trays": {
    id: 641,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Baking & Cookie Sheets",
    refine: [
      { keywords: ["pizza stone"], id: 646, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Pizza Stones" },
      { keywords: ["pizza"], id: 2843, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Pizza Pans" },
      { keywords: ["roasting", "roaster"], id: 648, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Roasting Pans" },
      { keywords: ["baking mat", "liner"], id: 4503, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware Accessories > Baking Mats & Liners" },
    ],
  },
  "oven-dishes": {
    id: 640,
    name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware",
    refine: [
      { keywords: ["ramekin", "souffle", "soufflé"], id: 647, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Ramekins & Souffle Dishes" },
      { keywords: ["roasting", "roaster"], id: 648, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Bakeware > Roasting Pans" },
      { keywords: ["casserole"], id: 655, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Casserole Dishes" },
    ],
  },
  "pastry-tools": {
    id: 668,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils",
    refine: [
      { keywords: ["rolling pin"], id: 3467, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Rolling Pins" },
      { keywords: ["cookie cutter", "biscuit cutter"], id: 3850, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cookie Cutters" },
      { keywords: ["piping", "icing", "decorating"], id: 4630, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cake Decorating Supplies" },
      { keywords: ["pastry brush", "basting brush"], id: 3430, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Basting Brushes" },
      { keywords: ["cooling rack"], id: 3835, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cooling Racks" },
      { keywords: ["sifter", "sieve"], id: 5370, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Flour Sifters" },
      { keywords: ["mixing bowl"], id: 4530, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Mixing Bowls" },
    ],
  },
  "utensils-gadgets": { id: 668, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils" },
  "cooking-utensils": {
    id: 668,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils",
    refine: [
      { keywords: ["utensil set"], id: 4765, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Utensil Sets" },
      { keywords: ["spatula", "turner", "fish slice"], id: 3196, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Spatulas" },
      { keywords: ["ladle"], id: 3620, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Ladles" },
      { keywords: ["tongs"], id: 4005, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Tongs" },
      { keywords: ["whisk"], id: 3597, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Whisks" },
      { keywords: ["slotted spoon"], id: 6388, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Slotted Spoons" },
      { keywords: ["masher"], id: 3294, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Mashers" },
      { keywords: ["utensil holder", "utensil pot"], id: 8012, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Kitchen Utensil Holders & Racks" },
    ],
  },
  "prep-tools": {
    id: 668,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils",
    refine: [
      { keywords: ["grater", "zester"], id: 3156, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Food Graters & Zesters" },
      { keywords: ["peeler", "corer"], id: 3521, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Food Peelers & Corers" },
      { keywords: ["garlic press"], id: 3385, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Garlic Presses" },
      { keywords: ["mandoline", "slicer", "spiralizer", "spiraliser"], id: 3206, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Slicers" },
      { keywords: ["salad spinner"], id: 3914, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Salad Spinners" },
      { keywords: ["mixing bowl"], id: 4530, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Mixing Bowls" },
      { keywords: ["mortar", "pestle"], id: 3999, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Mortars & Pestles" },
      { keywords: ["can opener", "tin opener"], id: 733, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Can Openers" },
      { keywords: ["thermometer"], id: 3091, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cooking Thermometers" },
      { keywords: ["timer"], id: 3713, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cooking Timers" },
      { keywords: ["funnel"], id: 503005, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Funnels" },
    ],
  },
  "chopping-boards": { id: 666, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cutting Boards" },
  "colanders-sieves": { id: 653, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Colanders & Strainers" },
  "measuring-tools": { id: 3475, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Measuring Cups & Spoons" },
  "salt-pepper-mills": {
    id: 4762,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Spice Grinders",
    refine: [{ keywords: ["shaker", "cruet"], id: 676, name: "Home & Garden > Kitchen & Dining > Tableware > Salt & Pepper Shakers" }],
  },
  tableware: { id: 672, name: "Home & Garden > Kitchen & Dining > Tableware" },
  plates: { id: 3553, name: "Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Plates" },
  bowls: { id: 3498, name: "Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Bowls" },
  "dinner-sets": { id: 5537, name: "Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Dinnerware Sets" },
  serveware: {
    id: 4026,
    name: "Home & Garden > Kitchen & Dining > Tableware > Serveware",
    refine: [
      { keywords: ["platter"], id: 3802, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Serving Platters" },
      { keywords: ["tray"], id: 4009, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Serving Trays" },
      { keywords: ["cake stand"], id: 4372, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Cake Stands" },
      { keywords: ["butter dish"], id: 6086, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Butter Dishes" },
      { keywords: ["gravy", "sauce boat"], id: 3703, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Gravy Boats" },
      { keywords: ["egg cup"], id: 7550, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Egg Cups" },
      { keywords: ["tureen"], id: 3941, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Tureens" },
      { keywords: ["trivet"], id: 677, name: "Home & Garden > Kitchen & Dining > Tableware > Trivets" },
    ],
  },
  "tapas-snack-dishes": {
    id: 4026,
    name: "Home & Garden > Kitchen & Dining > Tableware > Serveware",
    refine: [
      { keywords: ["bowl"], id: 3498, name: "Home & Garden > Kitchen & Dining > Tableware > Dinnerware > Bowls" },
      { keywords: ["tray", "platter"], id: 3802, name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Serving Platters" },
    ],
  },
  cutlery: { id: 675, name: "Home & Garden > Kitchen & Dining > Tableware > Flatware" },
  "cutlery-sets": { id: 5647, name: "Home & Garden > Kitchen & Dining > Tableware > Flatware > Flatware Sets" },
  "forks-spoons": {
    id: 675,
    name: "Home & Garden > Kitchen & Dining > Tableware > Flatware",
    refine: [
      { keywords: ["fork"], id: 4015, name: "Home & Garden > Kitchen & Dining > Tableware > Flatware > Forks" },
      { keywords: ["spoon"], id: 3939, name: "Home & Garden > Kitchen & Dining > Tableware > Flatware > Spoons" },
      { keywords: ["chopstick"], id: 3699, name: "Home & Garden > Kitchen & Dining > Tableware > Flatware > Chopsticks" },
    ],
  },
  "serving-cutlery": {
    id: 675,
    name: "Home & Garden > Kitchen & Dining > Tableware > Flatware",
    refine: [
      { keywords: ["cake server", "cake slice"], id: 6408, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Cake Servers" },
      { keywords: ["carving fork"], id: 5078, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Carving Forks" },
    ],
  },
  "glassware-drinkware": { id: 674, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware" },
  "drinking-glasses": {
    id: 674,
    name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware",
    refine: [
      { keywords: ["tumbler", "highball", "lowball", "old fashioned", "whisky glass", "whiskey glass"], id: 2951, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Tumblers" },
      { keywords: ["beer", "pint"], id: 7568, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Beer Glasses" },
      { keywords: ["shot glass"], id: 2694, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Shot Glasses" },
      { keywords: ["set of", "glass set"], id: 6958, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Drinkware Sets" },
    ],
  },
  "beer-spirit-glasses": {
    id: 674,
    name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware",
    refine: [
      { keywords: ["beer", "pint", "cider"], id: 7568, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Beer Glasses" },
      { keywords: ["shot glass", "shot glasses"], id: 2694, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Shot Glasses" },
    ],
  },
  "wine-champagne-glasses": { id: 2712, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Stemware" },
  "jugs-carafes": {
    id: 3330,
    name: "Home & Garden > Kitchen & Dining > Tableware > Serveware > Serving Pitchers & Carafes",
    refine: [{ keywords: ["decanter"], id: 650, name: "Home & Garden > Kitchen & Dining > Barware > Decanters" }],
  },
  "bottles-tumblers": {
    id: 3809,
    name: "Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Water Bottles",
    refine: [
      { keywords: ["flask", "thermos", "vacuum"], id: 3800, name: "Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Thermoses" },
      { keywords: ["travel mug", "tumbler"], id: 2951, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Tumblers" },
    ],
  },
  "coffee-tea": { id: 638, name: "Home & Garden > Kitchen & Dining" },
  "cafetieres-pour-over": {
    id: 1557,
    name: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > French Presses",
    refine: [{ keywords: ["pour over", "pour-over", "dripper", "v60", "chemex"], id: 736, name: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines" }],
  },
  "moka-pots": { id: 1647, name: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Electric & Stovetop Espresso Pots" },
  "teapots-infusers": {
    id: 652,
    name: "Home & Garden > Kitchen & Dining > Tableware > Coffee Servers & Tea Pots",
    refine: [
      { keywords: ["infuser", "strainer"], id: 4559, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Tea Strainers" },
      { keywords: ["kettle"], id: 659, name: "Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Stovetop Kettles" },
    ],
  },
  "mugs-cups": {
    id: 2169,
    name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
    refine: [
      { keywords: ["saucer"], id: 6051, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Coffee & Tea Saucers" },
      { keywords: ["cup"], id: 6049, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Coffee & Tea Cups" },
    ],
  },
  "cups-saucers": {
    id: 6049,
    name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Coffee & Tea Cups",
    refine: [
      { keywords: ["saucer", "plate"], id: 6051, name: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Coffee & Tea Saucers" },
    ],
  },
  "coffee-accessories": {
    id: 3988,
    name: "Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories",
    refine: [
      { keywords: ["grinder"], id: 734, name: "Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Grinders" },
      { keywords: ["filter"], id: 3450, name: "Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Filters" },
    ],
  },
  "storage-organisation": { id: 2626, name: "Home & Garden > Kitchen & Dining > Food Storage" },
  "food-containers": { id: 667, name: "Home & Garden > Kitchen & Dining > Food Storage > Food Storage Containers" },
  "lunch-boxes": { id: 669, name: "Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Lunch Boxes & Totes" },
  "jars-canisters": {
    id: 2626,
    name: "Home & Garden > Kitchen & Dining > Food Storage",
    refine: [
      { keywords: ["bread bin", "bread box"], id: 3337, name: "Home & Garden > Kitchen & Dining > Food Storage > Bread Boxes & Bags" },
      { keywords: ["cookie jar", "biscuit jar", "biscuit barrel"], id: 2644, name: "Home & Garden > Kitchen & Dining > Food Storage > Cookie Jars" },
      { keywords: ["canister", "storage jar", "kilner", "jar"], id: 667, name: "Home & Garden > Kitchen & Dining > Food Storage > Food Storage Containers" },
    ],
  },
  "oil-vinegar": { id: 2626, name: "Home & Garden > Kitchen & Dining > Food Storage" },
  "kitchen-organisers": {
    id: 2948,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers",
    refine: [
      { keywords: ["dish rack", "dish drainer", "drying rack", "drainer"], id: 3268, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Dish Racks & Drain Boards" },
      { keywords: ["spice rack", "spice organiser", "spice organizer"], id: 2344, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Spice Organizers" },
      { keywords: ["kitchen roll", "paper towel"], id: 3061, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Paper Towel Holders & Dispensers" },
      { keywords: ["cutlery tray", "drawer organiser", "drawer organizer"], id: 3831, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Utensil & Flatware Trays" },
      { keywords: ["pan rack", "pot rack", "lid rack"], id: 3845, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Pot Racks" },
    ],
  },
  "kitchen-table-linen": { id: 4171, name: "Home & Garden > Linens & Bedding" },
  "tea-towels": { id: 4257, name: "Home & Garden > Linens & Bedding > Towels > Kitchen Towels" },
  "aprons-oven-gloves": {
    id: 639,
    name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Aprons",
    refine: [{ keywords: ["oven glove", "oven mitt", "pot holder", "pot grab", "gauntlet"], id: 670, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Oven Mitts & Pot Holders" }],
  },
  "tablecloths-runners": {
    id: 4143,
    name: "Home & Garden > Linens & Bedding > Table Linens > Tablecloths",
    refine: [{ keywords: ["runner"], id: 6325, name: "Home & Garden > Linens & Bedding > Table Linens > Table Runners" }],
  },
  "placemats-napkins": {
    id: 2547,
    name: "Home & Garden > Linens & Bedding > Table Linens > Placemats",
    refine: [
      { keywords: ["napkin ring", "napkin holder"], id: 3072, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Kitchen Organizers > Napkin Holders & Dispensers" },
      { keywords: ["napkin"], id: 4203, name: "Home & Garden > Linens & Bedding > Table Linens > Cloth Napkins" },
      { keywords: ["coaster"], id: 2363, name: "Home & Garden > Kitchen & Dining > Barware > Coasters" },
    ],
  },
  "bar-wine": { id: 649, name: "Home & Garden > Kitchen & Dining > Barware" },
  "wine-accessories": {
    id: 649,
    name: "Home & Garden > Kitchen & Dining > Barware",
    refine: [
      { keywords: ["corkscrew", "waiter's friend", "wine opener"], id: 2976, name: "Home & Garden > Kitchen & Dining > Barware > Corkscrews" },
      { keywords: ["stopper", "saver", "vacuum pump"], id: 4562, name: "Home & Garden > Kitchen & Dining > Barware > Bottle Stoppers & Savers" },
      { keywords: ["decanter"], id: 650, name: "Home & Garden > Kitchen & Dining > Barware > Decanters" },
      { keywords: ["aerator"], id: 4563, name: "Home & Garden > Kitchen & Dining > Barware > Wine Aerators" },
      { keywords: ["foil cutter"], id: 7139, name: "Home & Garden > Kitchen & Dining > Barware > Foil Cutters" },
      { keywords: ["wine rack", "bottle holder"], id: 8493, name: "Home & Garden > Kitchen & Dining > Barware > Wine Bottle Holders" },
      { keywords: ["coaster"], id: 2363, name: "Home & Garden > Kitchen & Dining > Barware > Coasters" },
    ],
  },
  "cocktail-tools": {
    id: 651,
    name: "Home & Garden > Kitchen & Dining > Barware > Cocktail Shakers & Tools",
    refine: [
      { keywords: ["cocktail set", "bar set", "cocktail kit"], id: 6957, name: "Home & Garden > Kitchen & Dining > Barware > Cocktail & Barware Tool Sets" },
      { keywords: ["shaker"], id: 6956, name: "Home & Garden > Kitchen & Dining > Barware > Cocktail Shakers & Tools > Cocktail Shakers" },
      { keywords: ["strainer"], id: 505327, name: "Home & Garden > Kitchen & Dining > Barware > Cocktail Shakers & Tools > Cocktail Strainers" },
      { keywords: ["muddler"], id: 503757, name: "Home & Garden > Kitchen & Dining > Barware > Cocktail Shakers & Tools > Muddlers" },
      { keywords: ["bottle opener"], id: 3427, name: "Home & Garden > Kitchen & Dining > Barware > Cocktail Shakers & Tools > Bottle Openers" },
    ],
  },
  "ice-serving": {
    id: 505806,
    name: "Home & Garden > Kitchen & Dining > Barware > Beverage Tubs & Chillers",
    refine: [
      { keywords: ["ice cube tray", "ice tray", "ice mould", "ice mold"], id: 4746, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Ice Cube Trays" },
      { keywords: ["ice scoop"], id: 3708, name: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils > Scoops > Ice Scoops" },
      { keywords: ["whisky stones", "whiskey stones", "chilling"], id: 7569, name: "Home & Garden > Kitchen & Dining > Barware > Beverage Chilling Cubes & Sticks" },
    ],
  },
};

function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z])${escaped}(?:s|es)?(?![a-z])`, "i").test(text);
}

export function googleTaxonomyFor(categorySlugs: string[], productName: string, override?: string | null): { id: number; name: string } {
  const explicit = override?.trim();
  if (explicit && /^\d+$/.test(explicit)) return { id: Number(explicit), name: explicit };
  const name = productName.toLowerCase();
  for (const slug of [...categorySlugs].reverse()) {
    const entry = GOOGLE_TAXONOMY[slug];
    if (!entry) continue;
    const refined = entry.refine?.find((rule) => rule.keywords.some((keyword) => matchesKeyword(name, keyword)));
    return refined ? { id: refined.id, name: refined.name } : { id: entry.id, name: entry.name };
  }
  return GOOGLE_TAXONOMY_FALLBACK;
}
