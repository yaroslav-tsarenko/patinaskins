import { WEAPON_TYPES } from "@/lib/skins/cs2";

export interface NavCategory {
  slug: string;
  name: string;
  short: string;
}

export const NAV_CATEGORIES: NavCategory[] = WEAPON_TYPES.map((t) => ({ slug: t.key, name: t.label, short: t.label }));

export const CORNICE_LINKS = ["knives", "gloves", "rifles", "sniper-rifles", "pistols", "smgs"];

export const MEGA_ZONES: { title: string; slugs: string[] }[] = [
  { title: "Rare items", slugs: ["knives", "gloves"] },
  { title: "Primary weapons", slugs: ["rifles", "sniper-rifles", "smgs"] },
  { title: "Secondary and heavy", slugs: ["pistols", "shotguns", "machine-guns"] },
];

export function navCategory(slug: string): NavCategory | undefined {
  return NAV_CATEGORIES.find((c) => c.slug === slug);
}

export const HELP_LINKS: { href: string; label: string; signedInHref?: string }[] = [
  { href: "/policies/shipping", label: "Delivery via Steam" },
  { href: "/policies/returns", label: "Refunds" },
  { href: "/policies/warranty", label: "Item guarantee" },
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
