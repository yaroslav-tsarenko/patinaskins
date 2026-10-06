export const BRAND = {
  name: "Brasmora",
  domain: "brasmora.com",
  tagline: "Kitchen, cookware and tableware",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND.domain}`).replace(/\/+$/, "");
