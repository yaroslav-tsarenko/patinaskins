import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/brand";
import { catalogConfig } from "@/config/catalog";
import { isBlockedImageHost } from "@/lib/utils/supplier";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_PALETTE = {
  paint: "#3b2620",
  plinth: "#2e1d18",
  chalk: "#f1f3f2",
  chalkDeep: "#e5e8e6",
  stage: "#ffffff",
  ink: "#2a1a15",
  inkMuted: "#5b4c47",
  onPaintMuted: "#c8bbb3",
  onPaintLine: "rgba(241, 243, 242, 0.16)",
  brass: "#c9a04e",
  onBrass: "#2a1a15",
  brassOnPaint: "#d6b064",
  shelf: "#3b2620",
  shelfHairline: "rgba(59, 38, 32, 0.28)",
  contact: "rgba(42, 26, 21, 0.2)",
} as const;

type FontSpec = { name: string; file: string; weight: 400 | 600; style: "normal" };

const FONT_FILES: FontSpec[] = [
  { name: "Gloock", file: "gloock-latin-400-normal.woff", weight: 400, style: "normal" },
  { name: "Commissioner", file: "commissioner-latin-400-normal.woff", weight: 400, style: "normal" },
  { name: "Commissioner", file: "commissioner-latin-600-normal.woff", weight: 600, style: "normal" },
];

let fontCache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[]> | null = null;

export function ogFonts() {
  fontCache ??= Promise.all(
    FONT_FILES.map(async (font) => {
      try {
        const buffer = await readFile(join(process.cwd(), "public", "fonts", font.file));
        return { name: font.name, data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer, weight: font.weight, style: font.style };
      } catch {
        return null;
      }
    }),
  ).then((fonts) => fonts.filter((f): f is NonNullable<typeof f> => f !== null));
  return fontCache;
}

function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 12).startsWith("ftypavi")) return "image/avif";
  if (buf.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return null;
}

function publicFile(url: string): string | null {
  let pathname: string;
  if (url.startsWith("/") && !url.startsWith("//")) {
    pathname = url.split(/[?#]/)[0];
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== new URL(SITE_URL).origin) return null;
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const segments = decoded.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === "." || segment === ".." || segment.includes("\0"))) return null;
  return segments.join("/");
}

async function readBytes(url: string): Promise<Buffer | null> {
  const local = publicFile(url);
  if (local) {
    try {
      return await readFile(join(process.cwd(), "public", local));
    } catch {
      if (url.startsWith("/")) return null;
    }
  }
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function toPng(buf: Buffer, max: number): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buf).resize({ width: max, height: max, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function ogImageSource(url: string | null | undefined, max = 900): Promise<string | null> {
  if (!url || isBlockedImageHost(url, catalogConfig.images.hosting === "supplier")) return null;
  const bytes = await readBytes(url);
  if (!bytes) return null;
  const type = sniff(bytes);
  if (!type) return null;
  const png = await toPng(bytes, max);
  if (png) return `data:image/png;base64,${png.toString("base64")}`;
  if (type === "image/png" || type === "image/jpeg") return `data:${type};base64,${bytes.toString("base64")}`;
  return null;
}
