import fs from "fs";
import path from "path";
import { reliableFetch } from "../../src/lib/utils/reliable-fetch";

export const BIGBUY_URL = "https://api.bigbuy.eu";

export interface BbTaxonomy { id: number; name: string; url?: string | null; parentTaxonomy?: number | null; }
export interface BbManufacturer { id: number; name: string; urlImage?: string | null; reference?: string | null; }
export interface BbProduct {
  id: number; sku: string; ean13: string | null; weight: number | null;
  manufacturer: number | null; taxonomy: number | null;
  wholesalePrice: number; retailPrice: number; active: boolean; condition: string | null;
}
export interface BbInfo { id: number; sku: string | null; name: string | null; description: string | null; shortDescription: string | null; }
export interface BbImage {
  id: number; url: string; name: string | null; isCover: boolean; position: number;
  logo: boolean; whiteBackground: boolean; flagged: boolean;
}
export interface BbImages { id: number; images: BbImage[]; }
export interface BbStock { id: number; quantity: number; }

export interface SourceData {
  origin: "api" | "fixtures";
  taxonomies: BbTaxonomy[];
  manufacturers: BbManufacturer[];
  products: BbProduct[];
  info: BbInfo[];
  images: BbImages[];
  stock: BbStock[] | null;
  dropped: Record<string, number>;
}

export interface LoadOptions {
  fixturesDir?: string | null;
  token?: string | null;
  isoCode: string;
  cacheDir: string;
  cacheTtlHours: number;
  refresh: boolean;
  log: (line: string) => void;
}

type Raw = Record<string, unknown>;

function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function bool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function idOf(value: unknown): number | null {
  const n = num(value);
  return n != null && n > 0 ? n : null;
}

function asArray(data: unknown, label: string): Raw[] {
  if (Array.isArray(data)) return data.filter((r): r is Raw => typeof r === "object" && r !== null);
  if (data && typeof data === "object") {
    for (const key of ["data", "items", "results"]) {
      const inner = (data as Raw)[key];
      if (Array.isArray(inner)) return inner.filter((r): r is Raw => typeof r === "object" && r !== null);
    }
  }
  throw new Error(`${label}: expected a JSON array, got ${data === null ? "null" : typeof data}`);
}

function parseList<T>(data: unknown, label: string, map: (r: Raw) => T | null, dropped: Record<string, number>): T[] {
  const out: T[] = [];
  for (const r of asArray(data, label)) {
    const v = map(r);
    if (v) out.push(v);
    else dropped[label] = (dropped[label] || 0) + 1;
  }
  return out;
}

function parseTaxonomy(r: Raw): BbTaxonomy | null {
  const id = idOf(r.id);
  const name = str(r.name);
  if (!id || !name) return null;
  return { id, name, url: str(r.url), parentTaxonomy: idOf(r.parentTaxonomy) };
}

function parseManufacturer(r: Raw): BbManufacturer | null {
  const id = idOf(r.id);
  const name = str(r.name);
  if (!id || !name) return null;
  return { id, name, urlImage: str(r.urlImage), reference: str(r.reference) };
}

function parseProduct(r: Raw): BbProduct | null {
  const id = idOf(r.id);
  const sku = str(r.sku);
  if (!id || !sku) return null;
  return {
    id,
    sku: sku.trim(),
    ean13: str(r.ean13),
    weight: num(r.weight),
    manufacturer: idOf(r.manufacturer),
    taxonomy: idOf(r.taxonomy),
    wholesalePrice: num(r.wholesalePrice) ?? 0,
    retailPrice: num(r.retailPrice) ?? 0,
    active: r.active === undefined ? true : bool(r.active),
    condition: str(r.condition),
  };
}

function parseInfoFor(isoCode: string) {
  return (r: Raw): BbInfo | null => {
    const id = idOf(r.id);
    if (!id) return null;
    const lang = str(r.isoCode);
    if (lang && lang.toLowerCase() !== isoCode.toLowerCase()) return null;
    return parseInfo(id, r);
  };
}

function parseInfo(id: number, r: Raw): BbInfo {
  return { id, sku: str(r.sku), name: str(r.name), description: str(r.description), shortDescription: str(r.shortDescription) };
}

function parseImages(r: Raw): BbImages | null {
  const id = idOf(r.id);
  if (!id || !Array.isArray(r.images)) return null;
  const images: BbImage[] = [];
  r.images.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const img = raw as Raw;
    const url = str(img.url);
    if (!url || !/^https?:\/\//i.test(url)) return;
    images.push({
      id: idOf(img.id) ?? idx + 1,
      url,
      name: str(img.name),
      isCover: bool(img.isCover),
      position: num(img.position) ?? idx,
      logo: bool(img.logo),
      whiteBackground: bool(img.whiteBackground),
      flagged: bool(img.energyEfficiency) || bool(img.icon) || bool(img.brand) || bool(img.packagingPhoto),
    });
  });
  return { id, images };
}

function parseStock(r: Raw): BbStock | null {
  const id = idOf(r.id);
  if (!id) return null;
  if (Array.isArray(r.stocks)) {
    const quantity = r.stocks.reduce<number>((sum, s) => sum + (s && typeof s === "object" ? num((s as Raw).quantity) ?? 0 : 0), 0);
    return { id, quantity };
  }
  const q = num(r.quantity);
  return q == null ? null : { id, quantity: q };
}

async function fetchCached(url: string, cacheFile: string, opts: LoadOptions): Promise<unknown> {
  const cachePath = path.join(opts.cacheDir, cacheFile);
  if (!opts.refresh && fs.existsSync(cachePath)) {
    const stat = fs.statSync(cachePath);
    if (Date.now() - stat.mtimeMs < opts.cacheTtlHours * 3600 * 1000) {
      opts.log(`  cache hit: ${cacheFile} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    }
  }
  opts.log(`  fetching ${url}`);
  const res = await reliableFetch(url, { headers: { Authorization: `Bearer ${opts.token}`, Accept: "application/json" } }, 4);
  if (!res.ok) throw new Error(`Supplier API ${url}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const text = await res.text();
  const parsed = JSON.parse(text);
  fs.writeFileSync(cachePath, text);
  opts.log(`  cached ${cacheFile} (${(text.length / 1024 / 1024).toFixed(1)}MB)`);
  return parsed;
}

function readFixture(dir: string, file: string, required: boolean): unknown {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) {
    if (required) throw new Error(`fixture missing: ${full}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

export async function loadSource(opts: LoadOptions): Promise<SourceData> {
  const dropped: Record<string, number> = {};
  const iso = opts.isoCode;
  let raw: Record<string, unknown>;
  let origin: SourceData["origin"];

  if (opts.fixturesDir) {
    origin = "fixtures";
    opts.log(`  reading fixtures from ${opts.fixturesDir}`);
    raw = {
      taxonomies: readFixture(opts.fixturesDir, "taxonomies.json", true),
      manufacturers: readFixture(opts.fixturesDir, "manufacturers.json", true),
      products: readFixture(opts.fixturesDir, "products.json", true),
      info: readFixture(opts.fixturesDir, "productsinformation.json", true),
      images: readFixture(opts.fixturesDir, "productsimages.json", true),
      stock: readFixture(opts.fixturesDir, "productsstock.json", false),
    };
  } else {
    origin = "api";
    if (!opts.token) throw new Error("BIGBUY_API_PRODUCTION missing in .env (or pass --fixtures <dir>)");
    fs.mkdirSync(opts.cacheDir, { recursive: true });
    const taxonomies = await fetchCached(`${BIGBUY_URL}/rest/catalog/taxonomies.json?isoCode=${iso}`, `taxonomies-${iso}.json`, opts);
    const manufacturers = await fetchCached(`${BIGBUY_URL}/rest/catalog/manufacturers.json?isoCode=${iso}`, `manufacturers-${iso}.json`, opts);
    const products = await fetchCached(`${BIGBUY_URL}/rest/catalog/products.json`, "products.json", opts);
    const info = await fetchCached(`${BIGBUY_URL}/rest/catalog/productsinformation.json?isoCode=${iso}`, `productsinformation-${iso}.json`, opts);
    const images = await fetchCached(`${BIGBUY_URL}/rest/catalog/productsimages.json`, "productsimages.json", opts);
    let stock: unknown = null;
    try {
      stock = await fetchCached(`${BIGBUY_URL}/rest/catalog/productsstock.json`, "productsstock.json", opts);
    } catch (err) {
      opts.log(`  ! stock endpoint unavailable, stock filter disabled: ${(err as Error).message.slice(0, 160)}`);
    }
    raw = { taxonomies, manufacturers, products, info, images, stock };
  }

  let stock: BbStock[] | null = null;
  if (raw.stock != null) {
    try {
      stock = parseList(raw.stock, "stock", parseStock, dropped);
    } catch (err) {
      opts.log(`  ! stock payload unreadable, stock filter disabled: ${(err as Error).message}`);
    }
  }

  return {
    origin,
    taxonomies: parseList(raw.taxonomies, "taxonomies", parseTaxonomy, dropped),
    manufacturers: parseList(raw.manufacturers, "manufacturers", parseManufacturer, dropped),
    products: parseList(raw.products, "products", parseProduct, dropped),
    info: parseList(raw.info, "productsinformation", parseInfoFor(iso), dropped),
    images: parseList(raw.images, "productsimages", parseImages, dropped),
    stock,
    dropped,
  };
}
