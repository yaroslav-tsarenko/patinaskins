export const BRAND = {
  name: "Patinaskins",
  domain: "patinaskins.com",
  tagline: "Counter-Strike 2 skins, delivered by Steam trade offer",
} as const;

/** The public origin. A *.vercel.app value is ignored so canonicals, sitemaps and emails always use the real domain. */
export function publicOrigin(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v || /\.vercel\.app(?:[/:]|$)/i.test(v)) return null;
  return v.replace(/\/+$/, "");
}

export const SITE_URL = publicOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? `https://www.${BRAND.domain}`;
export const COMPANY_REGISTERED = true;
