export interface NavCategory {
  slug: string;
  name: string;
  short: string;
}

export const NAV_CATEGORIES: NavCategory[] = [
  { slug: "cookware", name: "Cookware", short: "Cookware" },
  { slug: "bakeware", name: "Bakeware", short: "Bakeware" },
  { slug: "utensils-gadgets", name: "Utensils & gadgets", short: "Utensils" },
  { slug: "tableware", name: "Tableware", short: "Tableware" },
  { slug: "cutlery", name: "Cutlery", short: "Cutlery" },
  { slug: "glassware-drinkware", name: "Glassware & drinkware", short: "Glassware" },
  { slug: "coffee-tea", name: "Coffee & tea", short: "Coffee & tea" },
  { slug: "bar-wine", name: "Bar & wine", short: "Bar & wine" },
  { slug: "storage-organisation", name: "Storage & organisation", short: "Storage" },
  { slug: "kitchen-table-linen", name: "Kitchen & table linen", short: "Linen" },
];

export const CORNICE_LINKS = ["cookware", "bakeware", "tableware", "glassware-drinkware", "coffee-tea", "bar-wine"];

export const MEGA_ZONES: { title: string; slugs: string[] }[] = [
  { title: "Cook & bake", slugs: ["cookware", "bakeware"] },
  { title: "Prep & serve", slugs: ["utensils-gadgets", "cutlery", "tableware"] },
  { title: "Drink", slugs: ["glassware-drinkware", "coffee-tea", "bar-wine"] },
  { title: "Store & linen", slugs: ["storage-organisation", "kitchen-table-linen"] },
];

export const FURNITURE_ZONES: Record<"shelves" | "drawers" | "cupboards" | "hooks", string[]> = {
  shelves: ["tableware", "glassware-drinkware"],
  drawers: ["utensils-gadgets", "cutlery", "kitchen-table-linen"],
  cupboards: ["cookware", "bakeware", "storage-organisation"],
  hooks: ["coffee-tea", "bar-wine"],
};

export function navCategory(slug: string): NavCategory | undefined {
  return NAV_CATEGORIES.find((c) => c.slug === slug);
}

export const HELP_LINKS: { href: string; label: string; signedInHref?: string }[] = [
  { href: "/policies/shipping", label: "Delivery" },
  { href: "/policies/returns", label: "Returns & refunds" },
  { href: "/policies/warranty", label: "Warranty" },
  { href: "/policies/payment", label: "Payment" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/contact?topic=order", signedInHref: "/account/orders", label: "Track an order" },
];

export const POLICY_LINKS = [
  { href: "/policies/terms", label: "Terms & conditions" },
  { href: "/policies/privacy", label: "Privacy policy" },
  { href: "/policies/cookies", label: "Cookie policy" },
  { href: "/policies", label: "All policies" },
];
