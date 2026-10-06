import { BRAND } from "@/lib/brand";

export type CookieCategory = "necessary" | "analytics" | "marketing";

export interface CookieRecord {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  kind: "Cookie" | "Local storage" | "Session storage";
}

export const COOKIE_CATEGORIES: { id: CookieCategory; title: string; purpose: string }[] = [
  {
    id: "necessary",
    title: "Necessary",
    purpose: "Keep the store working: your bag, sign-in, display currency, theme and the choices you make here.",
  },
  {
    id: "analytics",
    title: "Analytics",
    purpose: "Count visits and see which pages are used, so we can fix what is slow or confusing.",
  },
  {
    id: "marketing",
    title: "Marketing",
    purpose: "Measure whether our adverts lead to orders and show you relevant adverts on other sites.",
  },
];

export const COOKIE_TABLE: Record<CookieCategory, CookieRecord[]> = {
  necessary: [
    { name: "session_token", provider: BRAND.name, purpose: "Keeps you signed in to your account", expiry: "7 days", kind: "Cookie" },
    { name: "NEXT_LOCALE", provider: BRAND.name, purpose: "Remembers the site language", expiry: "1 year", kind: "Cookie" },
    { name: "e-commerce-cart", provider: BRAND.name, purpose: "Remembers the items in your bag", expiry: "Until you clear it", kind: "Local storage" },
    { name: "currency", provider: BRAND.name, purpose: "Remembers your display currency (GBP, EUR or USD)", expiry: "Until you clear it", kind: "Local storage" },
    { name: "theme", provider: BRAND.name, purpose: "Remembers light or dark theme", expiry: "Until you clear it", kind: "Local storage" },
    { name: "brasmora.locale", provider: BRAND.name, purpose: "Remembers the site language", expiry: "Until you clear it", kind: "Local storage" },
    { name: "brasmora-consent", provider: BRAND.name, purpose: "Stores your cookie choices, their version and when you made them", expiry: "12 months, then we ask again", kind: "Local storage" },
    { name: "header:categories, mega:featured:*", provider: BRAND.name, purpose: "Caches the category menu and its featured products so pages load faster", expiry: "End of the browser session", kind: "Session storage" },
    { name: "brasmora-checkout-draft", provider: BRAND.name, purpose: "Keeps the delivery details you typed at checkout if you reload the page (never card details)", expiry: "End of the browser session", kind: "Session storage" },
    { name: "brasmora-doors-*", provider: BRAND.name, purpose: "Remembers that the order confirmation animation has already played", expiry: "End of the browser session", kind: "Session storage" },
  ],
  analytics: [],
  marketing: [],
};
