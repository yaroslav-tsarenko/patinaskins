/** Template or obviously unfinished profile URLs, e.g. instagram.com/your-handle/. */
const PLACEHOLDER = /your[-_]?(handle|company|page|profile|account|brand)|example\.(com|org)|\/(username|handle|company)\/?$/i;

/** A profile URL worth linking: absolute https, on the expected network, with a real handle. */
function profile(url: string | undefined, host: RegExp): string | null {
  const v = url?.trim();
  if (!v || PLACEHOLDER.test(v)) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || !host.test(u.hostname)) return null;
    if (u.pathname.replace(/\/+/g, "/").replace(/^\/|\/$/g, "").split("/").filter(Boolean).length === 0) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// process.env.NEXT_PUBLIC_* must stay literal so Next inlines them into client bundles.
export const SOCIAL_LINKS = [
  { label: "Instagram", href: profile(process.env.NEXT_PUBLIC_INSTAGRAM_URL, /(^|\.)instagram\.com$/i) },
  { label: "LinkedIn", href: profile(process.env.NEXT_PUBLIC_LINKEDIN_URL, /(^|\.)linkedin\.com$/i) },
  { label: "Facebook", href: profile(process.env.NEXT_PUBLIC_FACEBOOK_URL, /(^|\.)facebook\.com$/i) },
].filter((s): s is { label: string; href: string } => Boolean(s.href));
