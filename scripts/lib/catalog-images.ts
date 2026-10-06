import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { reliableFetch } from "../../src/lib/utils/reliable-fetch";
import { encodeVariantWidths, parseVariantWidths, variantPath, variantWidthsFor, withVariantMarker } from "../../src/lib/image-loader";

export interface ImageStore {
  head(key: string): Promise<{ exists: boolean; metadata: Record<string, string> }>;
  put(key: string, body: Buffer, contentType: string, metadata: Record<string, string>): Promise<string>;
  publicUrl(key: string): string;
  get?(key: string): Promise<Buffer | null>;
}

export interface VariantOptions {
  widths: readonly number[];
  quality: number;
  effort: number;
}

export interface ImageSyncInput {
  slug: string;
  images: Array<{ sourceUrl: string }>;
}

export interface ImageSyncOptions {
  prefix: string;
  concurrency: number;
  timeoutMs: number;
  maxBytes: number;
  manifestPath: string;
  log: (line: string) => void;
  fetchImage?: (url: string, timeoutMs: number) => Promise<Buffer>;
  variants?: VariantOptions | null;
}

export interface ImageSyncResult {
  urls: Map<string, string[]>;
  uploaded: number;
  fromManifest: number;
  alreadyInBucket: number;
  failed: number;
  failures: Array<{ slug: string; index: number; error: string }>;
  variantsGenerated: number;
  variantsFailed: number;
  variantFailures: Array<{ slug: string; index: number; error: string }>;
  bytes: { originals: number; images: number; byWidth: Record<number, { bytes: number; count: number }> };
}

interface ManifestEntry {
  srcHash: string;
  bytes: number;
  contentType: string;
  at: string;
  width?: number;
  variants?: number[];
  variantSig?: string;
}

interface Manifest {
  version: 1;
  entries: Record<string, ManifestEntry>;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function sourceHash(url: string): string {
  return crypto.createHash("sha1").update(url).digest("hex").slice(0, 20);
}

export function extFromUrl(url: string): string {
  const m = /\.([a-z0-9]{3,4})(?:$|[?#])/i.exec(new URL(url, "https://local.invalid").pathname);
  const ext = m?.[1]?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext && ["jpg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
}

export function imageKey(prefix: string, slug: string, index: number, sourceUrl: string): string {
  return `${prefix.replace(/\/+$/, "")}/${slug}/${index}.${extFromUrl(sourceUrl)}`;
}

export function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (buf.toString("ascii", 4, 12) === "ftypavif") return "image/avif";
  return null;
}

export function variantSignature(opts: VariantOptions): string {
  return `${encodeVariantWidths([...opts.widths].sort((a, b) => a - b))}@q${opts.quality}`;
}

function sourceWidth(meta: sharp.Metadata): number {
  if (meta.autoOrient?.width) return meta.autoOrient.width;
  return (meta.orientation ?? 1) >= 5 ? meta.height ?? 0 : meta.width ?? 0;
}

export async function renderVariants(body: Buffer, opts: VariantOptions): Promise<{ width: number; variants: Array<{ width: number; body: Buffer }> }> {
  const base = sharp(body, { failOn: "error" }).rotate();
  const width = sourceWidth(await sharp(body).metadata());
  const widths = variantWidthsFor(width, opts.widths);
  if (!widths.length) throw new Error("unreadable image dimensions");
  const variants: Array<{ width: number; body: Buffer }> = [];
  for (const w of widths) {
    const out = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: opts.quality, effort: opts.effort }).toBuffer();
    variants.push({ width: w, body: out });
  }
  return { width, variants };
}

export function loadManifest(file: string): Manifest {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8")) as Manifest;
    if (parsed && parsed.version === 1 && parsed.entries && typeof parsed.entries === "object") return parsed;
  } catch {
    return { version: 1, entries: {} };
  }
  return { version: 1, entries: {} };
}

function saveManifest(file: string, manifest: Manifest) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(manifest));
  fs.renameSync(tmp, file);
}

async function defaultFetchImage(url: string, timeoutMs: number): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await reliableFetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*" } }, 1);
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        lastError = new Error(`HTTP ${res.status}`);
        break;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("download failed");
}

export async function syncImages(products: ImageSyncInput[], store: ImageStore, opts: ImageSyncOptions): Promise<ImageSyncResult> {
  const manifest = loadManifest(opts.manifestPath);
  const fetchImage = opts.fetchImage ?? defaultFetchImage;
  const jobs = products.flatMap((p) => p.images.map((img, i) => ({ slug: p.slug, index: i + 1, sourceUrl: img.sourceUrl })));
  const resultUrls = new Map<string, Array<string | null>>();
  for (const p of products) resultUrls.set(p.slug, new Array(p.images.length).fill(null));
  const result: ImageSyncResult = {
    urls: new Map(),
    uploaded: 0,
    fromManifest: 0,
    alreadyInBucket: 0,
    failed: 0,
    failures: [],
    variantsGenerated: 0,
    variantsFailed: 0,
    variantFailures: [],
    bytes: { originals: 0, images: 0, byWidth: {} },
  };
  const sig = opts.variants ? variantSignature(opts.variants) : null;

  let done = 0;
  let sinceSave = 0;
  let cursor = 0;
  const startedAt = Date.now();

  const report = () => {
    const rate = done / Math.max(1, (Date.now() - startedAt) / 1000);
    process.stdout.write(`\r  images: ${done}/${jobs.length}  uploaded ${result.uploaded}, variants ${result.variantsGenerated}, cached ${result.fromManifest + result.alreadyInBucket}, failed ${result.failed}  (${rate.toFixed(1)}/s)   `);
  };

  const urlFor = (key: string, widths: number[] | undefined) => (widths?.length ? withVariantMarker(store.publicUrl(key), widths) : store.publicUrl(key));

  async function makeVariants(job: { slug: string; index: number }, key: string, hash: string, body: Buffer): Promise<{ width: number; widths: number[] } | null> {
    if (!opts.variants) return null;
    try {
      const rendered = await renderVariants(body, opts.variants);
      for (const v of rendered.variants) {
        await store.put(variantPath(key, v.width), v.body, "image/webp", { "src-hash": hash });
        const slot = (result.bytes.byWidth[v.width] ??= { bytes: 0, count: 0 });
        slot.bytes += v.body.length;
        slot.count++;
      }
      result.bytes.originals += body.length;
      result.bytes.images++;
      result.variantsGenerated++;
      return { width: rendered.width, widths: rendered.variants.map((v) => v.width) };
    } catch (err) {
      result.variantsFailed++;
      if (result.variantFailures.length < 200) result.variantFailures.push({ slug: job.slug, index: job.index, error: (err as Error).message.slice(0, 200) });
      return null;
    }
  }

  async function handle(job: { slug: string; index: number; sourceUrl: string }) {
    const key = imageKey(opts.prefix, job.slug, job.index, job.sourceUrl);
    const hash = sourceHash(job.sourceUrl);
    const slot = resultUrls.get(job.slug)!;
    const known = manifest.entries[key];
    if (known && known.srcHash === hash && (!sig || known.variantSig === sig)) {
      slot[job.index - 1] = urlFor(key, known.variants);
      result.fromManifest++;
      return;
    }
    const head = await store.head(key);
    const inBucket = head.exists && head.metadata["src-hash"] === hash;
    if (inBucket) {
      const headSig = head.metadata["variant-sig"];
      const headWidths = parseVariantWidths(head.metadata["variant-widths"]) ?? undefined;
      if (!sig || (headSig === sig && headWidths)) {
        manifest.entries[key] = {
          srcHash: hash,
          bytes: known?.srcHash === hash ? known.bytes : 0,
          contentType: known?.srcHash === hash ? known.contentType : "",
          at: new Date().toISOString(),
          ...(headWidths ? { variants: headWidths, variantSig: headSig } : {}),
        };
        slot[job.index - 1] = urlFor(key, headWidths);
        result.alreadyInBucket++;
        return;
      }
    }
    let body: Buffer | null = inBucket && store.get ? await store.get(key).catch(() => null) : null;
    if (!body) body = await fetchImage(job.sourceUrl, opts.timeoutMs);
    if (body.length < 1024) throw new Error(`image too small (${body.length} bytes)`);
    if (body.length > opts.maxBytes) throw new Error(`image too large (${(body.length / 1024 / 1024).toFixed(1)}MB)`);
    const contentType = sniffImageType(body);
    if (!contentType || !EXT_BY_MIME[contentType]) throw new Error("payload is not a supported image");
    const made = await makeVariants(job, key, hash, body);
    const metadata: Record<string, string> = { "src-hash": hash };
    if (made && sig) {
      metadata["variant-sig"] = sig;
      metadata["variant-widths"] = encodeVariantWidths(made.widths);
    }
    if (!inBucket || made) await store.put(key, body, contentType, metadata);
    manifest.entries[key] = {
      srcHash: hash,
      bytes: body.length,
      contentType,
      at: new Date().toISOString(),
      ...(made && sig ? { width: made.width, variants: made.widths, variantSig: sig } : {}),
    };
    slot[job.index - 1] = urlFor(key, made?.widths);
    if (!inBucket) result.uploaded++;
  }

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        await handle(job);
      } catch (err) {
        result.failed++;
        if (result.failures.length < 200) result.failures.push({ slug: job.slug, index: job.index, error: (err as Error).message.slice(0, 200) });
      }
      done++;
      sinceSave++;
      if (sinceSave >= 25) {
        saveManifest(opts.manifestPath, manifest);
        sinceSave = 0;
      }
      if (done % 10 === 0 || done === jobs.length) report();
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency, jobs.length || 1)) }, () => worker()));
  saveManifest(opts.manifestPath, manifest);
  if (jobs.length) process.stdout.write("\n");

  for (const [slug, urls] of resultUrls) result.urls.set(slug, urls.filter((u): u is string => Boolean(u)));
  return result;
}
