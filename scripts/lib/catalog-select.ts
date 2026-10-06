import type { CatalogConfig, MatchScope } from "../../src/config/catalog";
import { containsSupplierTrace, publicBrand } from "../../src/lib/utils/supplier";
import type { BbImage, SourceData } from "./bigbuy-source";
import {
  anyMatch,
  cleanDescriptionHtml,
  cleanProductName,
  compileMatchers,
  createSlugAllocator,
  descriptionProblem,
  looksEnglishName,
  matcherLabel,
  median,
  normalizeText,
  shortDescriptionFrom,
  stripPhrases,
} from "./catalog-text";

export interface SelectedImage {
  sourceUrl: string;
  isCover: boolean;
  whiteBackground: boolean;
}

export interface SelectedProduct {
  sourceId: number;
  sourceSku: string;
  sku: string;
  name: string;
  slug: string;
  descriptionHtml: string;
  descriptionText: string;
  shortDescription: string | null;
  brand: string | null;
  price: number;
  costPrice: number | null;
  weight: number | null;
  ean: string | null;
  quantity: number;
  primary: string;
  sub: string | null;
  images: SelectedImage[];
  quality: number;
  taxonomyPath: string;
}

export interface CategoryNode {
  slug: string;
  name: string;
  description: string | null;
  parentSlug: string | null;
  sortOrder: number;
  productCount: number;
  artProductSlug: string | null;
  artPinned: boolean;
}

export interface PathCount {
  path: string;
  count: number;
}

export interface SelectionResult {
  products: SelectedProduct[];
  categories: CategoryNode[];
  excluded: Record<string, number>;
  excludedSamples: Record<string, string[]>;
  demotedSubs: Array<{ slug: string; name: string; primary: string; count: number }>;
  droppedPrimaries: Array<{ slug: string; name: string; count: number }>;
  emptySubs: Array<{ slug: string; primary: string }>;
  unmapped: PathCount[];
  routedTaxonomies: Array<PathCount & { to: string }>;
  primaryMedians: Record<string, number>;
  brands: Array<{ name: string; count: number }>;
  stats: {
    sourceProducts: number;
    active: number;
    inScope: number;
    passedFilters: number;
    selected: number;
    stockKnown: boolean;
  };
}

export type TaxonomyDecision =
  | { kind: "route"; primary: string; sub: string | null; matched: string }
  | { kind: "blocked"; rule: string; matched: string }
  | { kind: "unmapped" }
  | { kind: "out-of-scope" };

interface Candidate extends Omit<SelectedProduct, "slug" | "sku"> {
  familyKey: string;
  nameKey: string;
  coverWhite: boolean;
}

const COLOUR_WORDS = [
  "black", "white", "red", "blue", "green", "grey", "gray", "pink", "yellow", "orange", "purple", "brown", "beige",
  "silver", "gold", "golden", "cream", "turquoise", "navy", "multicolour", "multicolor", "transparent", "natural",
  "copper", "bronze", "lilac", "mint", "coral", "ivory", "anthracite", "graphite", "taupe", "mustard", "burgundy",
  "terracotta", "olive", "aqua", "fuchsia", "violet", "khaki", "dark", "light",
];
const COLOUR_RE = new RegExp(`\\b(?:${COLOUR_WORDS.join("|")})\\b`, "g");

const PACK_PATTERNS = [
  /\(\s*(\d+)\s*(?:units?|uds?\.?|unidades)\s*\)/gi,
  /\(\s*pack\s*(?:of\s*)?(\d+)\s*x?\s*\)/gi,
  /\b(\d+)\s*(?:units|unidades)\b/gi,
];

function pathKey(path: string): string {
  return path
    .split(">")
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join(" > ");
}

export function packUnits(name: string): number {
  let units = 1;
  for (const re of PACK_PATTERNS) {
    for (const m of name.matchAll(re)) units = Math.max(units, Number(m[1]) || 1);
  }
  return units;
}

export function validateConfig(config: CatalogConfig): string[] {
  const problems: string[] = [];
  if (config.storefront.length > config.limits.maxTopLevel) {
    problems.push(`storefront has ${config.storefront.length} top-level categories, max is ${config.limits.maxTopLevel}`);
  }
  const slugs = new Set<string>();
  for (const p of config.storefront) {
    for (const slug of [p.slug, ...p.subs.map((s) => s.slug)]) {
      if (slugs.has(slug)) problems.push(`duplicate storefront slug "${slug}"`);
      slugs.add(slug);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) problems.push(`invalid slug "${slug}"`);
    }
  }
  const checkTarget = (to: string, label: string) => {
    const [primary, sub] = to.split("/");
    const p = config.storefront.find((x) => x.slug === primary);
    if (!p) problems.push(`${label} points to unknown category "${to}"`);
    else if (sub && !p.subs.some((s) => s.slug === sub)) problems.push(`${label} points to unknown subcategory "${to}"`);
  };
  const seen = new Map<string, string>();
  for (const r of config.taxonomy.routes) {
    checkTarget(r.to, `taxonomy route "${r.path}"`);
    const key = pathKey(r.path);
    if (seen.has(key)) problems.push(`taxonomy path "${r.path}" is listed twice`);
    seen.set(key, r.to);
  }
  const ruleIds = new Set(config.exclude.rules.map((r) => r.id));
  for (const e of config.taxonomy.exclude) {
    if (!ruleIds.has(e.rule)) problems.push(`taxonomy exclusion "${e.path}" uses unknown rule "${e.rule}"`);
    const key = pathKey(e.path);
    if (seen.has(key)) problems.push(`taxonomy path "${e.path}" is both routed and excluded`);
    seen.set(key, e.rule);
  }
  for (const r of config.taxonomy.reroute) checkTarget(r.to, `reroute "${r.startsWith.join(", ")}"`);
  for (const r of config.exclude.rules) for (const t of r.onlyIn || []) checkTarget(t, `exclude rule "${r.id}" onlyIn`);
  for (const slug of Object.keys(config.quality.maxPackUnitsByPrimary)) {
    if (!config.storefront.some((p) => p.slug === slug)) problems.push(`quality.maxPackUnitsByPrimary has unknown category "${slug}"`);
  }
  if (config.limits.maxPerPrimary < config.limits.minPerPrimary) problems.push("limits.maxPerPrimary < limits.minPerPrimary");
  if (config.limits.maxPerSub < config.limits.minPerSub) problems.push("limits.maxPerSub < limits.minPerSub");
  if (config.price.minRetail >= config.price.maxRetail) problems.push("price.minRetail >= price.maxRetail");
  if (!(config.price.sourceToBaseRate > 0)) problems.push("price.sourceToBaseRate must be positive");
  return problems;
}

export function storefrontSku(sourceId: number): string {
  return `BRS-${sourceId.toString(36).toUpperCase().padStart(5, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computePrice(retail: number, config: CatalogConfig["price"]): number {
  let price = round2(retail * config.sourceToBaseRate * (1 + config.vatPercent / 100) * config.multiplier);
  if (config.roundToNinetyNine && price > 1) price = round2(Math.ceil(price) - 0.01);
  return price;
}

export function computeCost(wholesale: number, config: CatalogConfig["price"]): number {
  return round2(wholesale * config.sourceToBaseRate);
}

function qualityScore(images: SelectedImage[], descriptionText: string, descriptionHtml: string, ean: string | null, brand: string | null, units: number): number {
  let q = Math.min(images.length, 5) * 2;
  if (images[0]?.whiteBackground) q += 3;
  q += Math.min(descriptionText.length / 300, 4);
  if (descriptionHtml.includes("<ul>")) q += 1;
  if (ean) q += 1;
  if (brand) q += 2;
  if (units > 6) q -= 2;
  else if (units > 1) q -= 1;
  return round2(q);
}

function priceFit(price: number, med: number): number {
  if (!(med > 0) || !(price > 0)) return 0;
  return -Math.min(3, Math.abs(Math.log(price / med)) * 1.5);
}

export function pickImages(images: BbImage[], quality: CatalogConfig["quality"]): SelectedImage[] {
  const seen = new Set<string>();
  return [...images]
    .filter((img) => !img.flagged && !(quality.skipLogoImages && img.logo))
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position)
    .filter((img) => {
      const key = img.url.split("?")[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, quality.maxImagesPerProduct)
    .map((img) => ({ sourceUrl: img.url, isCover: img.isCover, whiteBackground: img.whiteBackground }));
}

export function familyKeyOf(name: string): { nameKey: string; familyKey: string } {
  const nameKey = normalizeText(name).replace(/[^a-z0-9]+/g, " ").trim();
  const familyKey = normalizeText(name)
    .replace(/\([^)]*\)/g, " ")
    .replace(COLOUR_RE, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:cm|mm|ml|cl|l|litres?|liters?|oz|units?|pcs|pieces?|x)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return { nameKey, familyKey };
}

export function createTaxonomyRouter(config: CatalogConfig["taxonomy"]) {
  const root = pathKey(config.root);
  const entries = new Map<string, TaxonomyDecision>();
  for (const r of config.routes) {
    const [primary, sub] = r.to.split("/");
    entries.set(pathKey(r.path), { kind: "route", primary, sub: sub || null, matched: r.path });
  }
  for (const e of config.exclude) entries.set(pathKey(e.path), { kind: "blocked", rule: e.rule, matched: e.path });
  const watch = config.watch.map(pathKey);
  const reroutes = config.reroute.map((r) => {
    const [primary, sub] = r.to.split("/");
    const alternatives = r.startsWith.map((s) => normalizeText(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return { test: new RegExp(`^(?:${alternatives})(?![a-z0-9])`), primary, sub: sub || null, label: r.startsWith[0] };
  });

  function decide(segments: string[]): TaxonomyDecision {
    const parts = segments.map((s) => normalizeText(s)).filter(Boolean);
    if (!parts.length || parts[0] !== root) return { kind: "out-of-scope" };
    const rel = parts.slice(1);
    for (let i = rel.length; i > 0; i--) {
      const hit = entries.get(rel.slice(0, i).join(" > "));
      if (hit) return hit;
    }
    const relKey = rel.join(" > ");
    return watch.some((w) => relKey === w || relKey.startsWith(`${w} > `)) ? { kind: "unmapped" } : { kind: "out-of-scope" };
  }

  function reroute(decision: TaxonomyDecision, name: string): TaxonomyDecision {
    if (decision.kind !== "route") return decision;
    const norm = normalizeText(name);
    const hit = reroutes.find((r) => r.test.test(norm));
    if (!hit || (hit.primary === decision.primary && hit.sub === decision.sub)) return decision;
    return { kind: "route", primary: hit.primary, sub: hit.sub, matched: `${decision.matched} → name "${hit.label}"` };
  }

  return { decide, reroute };
}

export interface ExcludeTexts {
  target: string;
  leaf: string;
  name: string;
  description: string;
  brand: string;
}

export function createExcluder(config: CatalogConfig) {
  const ignore = compileMatchers(config.exclude.ignorePhrases);
  const rules = config.exclude.rules.map((r) => ({
    id: r.id,
    scopes: r.scopes,
    keywords: compileMatchers(r.keywords),
    unless: compileMatchers(r.unless || []),
    onlyIn: r.onlyIn || null,
  }));
  return (texts: ExcludeTexts): { rule: string; keyword: string } | null => {
    const prepared: Record<MatchScope, string> = {
      leaf: stripPhrases(normalizeText(texts.leaf), ignore),
      name: stripPhrases(normalizeText(texts.name), ignore),
      description: stripPhrases(normalizeText(texts.description), ignore),
      brand: normalizeText(texts.brand),
    };
    const rawName = normalizeText(texts.name);
    for (const rule of rules) {
      if (rule.onlyIn && !rule.onlyIn.some((t) => texts.target === t || texts.target.startsWith(`${t}/`))) continue;
      if (rule.unless.length && anyMatch(rawName, rule.unless)) continue;
      for (const scope of rule.scopes) {
        const text = prepared[scope];
        if (!text) continue;
        const hit = anyMatch(text, rule.keywords);
        if (hit) return { rule: rule.id, keyword: `${scope}:${matcherLabel(hit)}` };
      }
    }
    return null;
  };
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function topPaths(map: Map<string, number>, limit: number): PathCount[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([path, count]) => ({ path, count }));
}

function withoutBrand(name: string, brand: string | null): string {
  if (!brand) return name;
  const escaped = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return name.replace(new RegExp(escaped, "gi"), " ").replace(/\s+/g, " ").trim() || name;
}

function seededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const SAMPLE_SIZE = 12;

export function selectCatalog(source: SourceData, config: CatalogConfig, options: { limit?: number; trace?: Map<number, string> } = {}): SelectionResult {
  const excluded: Record<string, number> = {};
  const excludedSamples: Record<string, string[]> = {};
  const random = seededRandom(20261006);
  const exclude = (reason: string, label: string | null) => {
    const seen = (excluded[reason] = (excluded[reason] || 0) + 1);
    if (label == null) return;
    const id = options.trace ? /\[(\d+)\]/.exec(label) : null;
    if (id) options.trace!.set(Number(id[1]), reason);
    const list = (excludedSamples[reason] ||= []);
    if (list.length < SAMPLE_SIZE) list.push(label);
    else {
      const j = Math.floor(random() * seen);
      if (j < SAMPLE_SIZE) list[j] = label;
    }
  };

  const taxById = new Map(source.taxonomies.map((t) => [t.id, t]));
  const mfgById = new Map(source.manufacturers.map((m) => [m.id, m.name]));
  const infoById = new Map(source.info.map((i) => [i.id, i]));
  const imagesById = new Map(source.images.map((i) => [i.id, i.images]));
  const stockById = source.stock && source.stock.length ? new Map(source.stock.map((s) => [s.id, s.quantity])) : null;

  const chainCache = new Map<number, string[]>();
  function taxChain(id: number | null): string[] {
    if (!id) return [];
    const cached = chainCache.get(id);
    if (cached) return cached;
    const out: string[] = [];
    const seen = new Set<number>();
    let cur: number | null = id;
    while (cur && !seen.has(cur)) {
      const node = taxById.get(cur);
      if (!node) break;
      seen.add(cur);
      out.unshift(node.name.replace(/\s+/g, " ").trim());
      cur = node.parentTaxonomy && node.parentTaxonomy > 0 ? node.parentTaxonomy : null;
    }
    chainCache.set(id, out);
    return out;
  }

  const router = createTaxonomyRouter(config.taxonomy);
  const decisionCache = new Map<number, TaxonomyDecision>();
  const excludeCheck = createExcluder(config);
  const primaries = config.storefront;
  const allowedConditions = new Set(config.quality.allowedConditions.map((c) => c.toUpperCase()));

  const unmapped = new Map<string, number>();
  const routedTax = new Map<string, { count: number; to: string }>();
  let active = 0;
  let inScope = 0;
  const candidates: Candidate[] = [];

  let pool = source.products;
  if (options.limit && Number.isFinite(options.limit)) pool = pool.slice(0, options.limit);

  for (const p of pool) {
    const info = infoById.get(p.id);
    const rawName = info?.name?.trim() || "";
    const label = `${rawName || "(no name)"} [${p.id}]`;
    if (!p.active) {
      exclude("inactive", options.trace ? label : null);
      continue;
    }
    active++;
    const segments = taxChain(p.taxonomy);
    const pathLabel = segments.join(" > ") || "(no taxonomy)";
    let decision = p.taxonomy ? decisionCache.get(p.taxonomy) : undefined;
    if (!decision) {
      decision = router.decide(segments);
      if (p.taxonomy) decisionCache.set(p.taxonomy, decision);
    }
    if (decision.kind === "out-of-scope") {
      exclude("out-of-scope", options.trace ? `${label} <${pathLabel}>` : null);
      continue;
    }
    if (decision.kind === "unmapped") {
      bump(unmapped, pathLabel);
      exclude("unmapped-taxonomy", `${label} <${pathLabel}>`);
      continue;
    }
    if (decision.kind === "blocked") {
      exclude(decision.rule, `${label} {taxonomy:${decision.matched}}`);
      continue;
    }
    inScope++;

    const knownSkus = [p.sku];
    const name = cleanProductName(rawName, knownSkus);
    const routed = router.reroute(decision, name);
    if (routed.kind !== "route") continue;

    if (allowedConditions.size && p.condition && !allowedConditions.has(p.condition.toUpperCase())) {
      exclude("condition", `${label} {condition:${p.condition}}`);
      continue;
    }

    const brandRaw = p.manufacturer ? mfgById.get(p.manufacturer) ?? null : null;
    const desc = cleanDescriptionHtml(info?.description, knownSkus);
    const hit = excludeCheck({
      target: `${routed.primary}${routed.sub ? `/${routed.sub}` : ""}`,
      leaf: segments[segments.length - 1] || "",
      name: rawName,
      description: desc.text,
      brand: brandRaw || "",
    });
    if (hit) {
      exclude(hit.rule, `${label} {${hit.keyword}}`);
      continue;
    }

    if (stockById && config.quality.requireInStock && (stockById.get(p.id) ?? 0) <= 0) {
      exclude("out-of-stock", label);
      continue;
    }
    if (!name || name.length < config.quality.minNameLength || !/[a-z]/i.test(name)) {
      exclude("no-name", label);
      continue;
    }
    if (name.length > config.quality.maxNameLength) {
      exclude("name-too-long", label);
      continue;
    }
    if (!looksEnglishName(withoutBrand(name, brandRaw))) {
      exclude("name-not-english", label);
      continue;
    }
    const units = packUnits(name);
    const maxUnits = config.quality.maxPackUnitsByPrimary[routed.primary] ?? config.quality.maxPackUnits;
    if (units > maxUnits) {
      exclude("bulk-pack", `${label} {${units} units > ${maxUnits}}`);
      continue;
    }
    const descProblem = descriptionProblem(desc.text, config.quality.minDescriptionChars);
    if (descProblem) {
      exclude(`description-${descProblem}`, label);
      continue;
    }
    const images = pickImages(imagesById.get(p.id) || [], config.quality);
    if (images.length < config.quality.minImages) {
      exclude("no-images", label);
      continue;
    }
    const price = computePrice(p.retailPrice, config.price);
    const cost = p.wholesalePrice > 0 ? computeCost(p.wholesalePrice, config.price) : null;
    if (!(price > 0) || price < config.price.minRetail) {
      exclude("price-below-min", `${label} £${price}`);
      continue;
    }
    if (price > config.price.maxRetail) {
      exclude("price-above-max", `${label} £${price}`);
      continue;
    }
    const netPrice = price / (1 + config.price.vatPercent / 100);
    if (cost && netPrice < cost * config.price.minMarginOverWholesale) {
      exclude("low-margin", `${label} £${price} (net £${round2(netPrice)}) vs cost £${cost}`);
      continue;
    }

    const brandPublic = publicBrand(brandRaw);
    const brand = brandPublic && !/^(?:generic|unbranded|no brand|sin marca|n\/a|none|other)$/i.test(brandPublic.trim()) ? brandPublic.trim() : null;
    const shortDescription = shortDescriptionFrom(desc.text);
    const leak = [name, desc.html, shortDescription, brand].some((v) => containsSupplierTrace(v, knownSkus));
    if (leak) {
      exclude("supplier-leak", label);
      continue;
    }
    const ean = p.ean13 && /^\d{13}$/.test(p.ean13) ? p.ean13 : null;
    const to = `${routed.primary}${routed.sub ? `/${routed.sub}` : ""}`;
    const routeKey = `${pathLabel} → ${to}`;
    const prev = routedTax.get(routeKey);
    routedTax.set(routeKey, { count: (prev?.count || 0) + 1, to });

    candidates.push({
      sourceId: p.id,
      sourceSku: p.sku,
      name,
      descriptionHtml: desc.html,
      descriptionText: desc.text,
      shortDescription,
      brand,
      price,
      costPrice: cost,
      weight: p.weight && p.weight > 0 ? p.weight : null,
      ean,
      quantity: stockById ? Math.max(0, Math.floor(stockById.get(p.id) ?? 0)) : 999,
      primary: routed.primary,
      sub: routed.sub,
      images,
      quality: qualityScore(images, desc.text, desc.html, ean, brand, units),
      taxonomyPath: pathLabel,
      coverWhite: images[0]?.whiteBackground ?? false,
      ...familyKeyOf(name),
    });
  }

  const passedFilters = candidates.length;
  const byQuality = (a: Candidate, b: Candidate) => b.quality - a.quality || a.sourceId - b.sourceId;

  candidates.sort(byQuality);
  const nameSeen = new Set<string>();
  const familyCount = new Map<string, number>();
  const deduped: Candidate[] = [];
  for (const c of candidates) {
    if (nameSeen.has(c.nameKey)) {
      exclude("duplicate-name", `${c.name} [${c.sourceId}]`);
      continue;
    }
    const fam = familyCount.get(c.familyKey) || 0;
    if (fam >= config.quality.maxVariantsPerName) {
      exclude("too-many-variants", `${c.name} [${c.sourceId}]`);
      continue;
    }
    nameSeen.add(c.nameKey);
    familyCount.set(c.familyKey, fam + 1);
    deduped.push(c);
  }

  const primaryMedians: Record<string, number> = {};
  for (const p of primaries) {
    const prices = deduped.filter((c) => c.primary === p.slug).map((c) => c.price);
    primaryMedians[p.slug] = round2(median(prices));
  }
  const primarySize = new Map<string, number>();
  for (const c of deduped) bump(primarySize, c.primary);
  const subPrices = new Map<string, number[]>();
  for (const c of deduped) if (c.sub) (subPrices.get(c.sub) || subPrices.set(c.sub, []).get(c.sub)!).push(c.price);
  const subMedians = new Map([...subPrices.entries()].map(([k, v]) => [k, { n: v.length, med: median(v) }]));
  const medianFor = (c: Candidate) => {
    const sub = c.sub ? subMedians.get(c.sub) : undefined;
    const useSub = config.price.anomalyBasis === "subcategory" && sub && sub.n >= config.price.anomalyMinSample;
    return { med: useSub ? round2(sub.med) : primaryMedians[c.primary], sample: useSub ? sub.n : primarySize.get(c.primary) || 0 };
  };
  const priced = deduped.filter((c) => {
    const { med, sample } = medianFor(c);
    if (sample >= config.price.anomalyMinSample && med > 0 && c.price > med * config.price.anomalyFactor) {
      exclude("price-anomaly", `${c.name} [${c.sourceId}] £${c.price} vs median £${med}`);
      return false;
    }
    return true;
  });

  const rank = new Map(priced.map((c) => [c.sourceId, c.quality + priceFit(c.price, medianFor(c).med)]));
  const byRank = (a: Candidate, b: Candidate) => rank.get(b.sourceId)! - rank.get(a.sourceId)! || a.sourceId - b.sourceId;

  const limits = config.limits;
  const perPrimary = new Map<string, Candidate[]>();
  for (const p of primaries) perPrimary.set(p.slug, []);
  for (const c of priced) perPrimary.get(c.primary)?.push(c);

  const cappedPrimary = new Map<string, Candidate[]>();
  for (const p of primaries) {
    const list = perPrimary.get(p.slug) || [];
    const buckets = new Map<string, Candidate[]>();
    for (const c of list) {
      const key = c.sub || "";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(c);
    }
    for (const [key, items] of buckets) {
      items.sort(byRank);
      if (key && items.length > limits.maxPerSub) {
        for (const c of items.slice(limits.maxPerSub)) exclude("cap-per-sub", `${c.name} [${c.sourceId}]`);
        buckets.set(key, items.slice(0, limits.maxPerSub));
      }
    }
    const kept: Candidate[] = [];
    const queues = [...buckets.values()].map((q) => [...q]);
    while (kept.length < limits.maxPerPrimary && queues.some((q) => q.length)) {
      for (const q of queues) {
        const next = q.shift();
        if (next && kept.length < limits.maxPerPrimary) kept.push(next);
      }
    }
    for (const q of queues) for (const c of q) exclude("cap-per-primary", `${c.name} [${c.sourceId}]`);
    cappedPrimary.set(p.slug, kept);
  }

  const totalCap = Math.max(0, limits.maxProducts);
  const totalQueues = primaries.map((p) => [...(cappedPrimary.get(p.slug) || [])]);
  const finalList: Candidate[] = [];
  while (finalList.length < totalCap && totalQueues.some((q) => q.length)) {
    for (const q of totalQueues) {
      const next = q.shift();
      if (next && finalList.length < totalCap) finalList.push(next);
    }
  }
  for (const q of totalQueues) for (const c of q) exclude("cap-total", `${c.name} [${c.sourceId}]`);

  const tree = finalizeTree(finalList, config, exclude);
  const allocate = createSlugAllocator();
  const products: SelectedProduct[] = [...tree.kept]
    .sort((a, b) => a.sourceId - b.sourceId)
    .map((c) => toSelected(c, allocate(c.name, storefrontSku(c.sourceId))))
    .filter((p) => {
      if (containsSupplierTrace(p.slug, [p.sourceSku])) {
        exclude("supplier-leak", `${p.name} [${p.sourceId}]`);
        return false;
      }
      return true;
    });

  const categories = buildCategoryNodes(products, config, tree.demoted);
  const brandCounts = new Map<string, number>();
  for (const p of products) if (p.brand) bump(brandCounts, p.brand);
  const brands = [...brandCounts.entries()]
    .filter(([, count]) => count >= config.brands.minProducts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, config.brands.showcaseLimit)
    .map(([name, count]) => ({ name, count }));

  return {
    products,
    categories,
    excluded,
    excludedSamples,
    demotedSubs: tree.demotedList,
    droppedPrimaries: tree.dropped,
    emptySubs: tree.empty,
    unmapped: topPaths(unmapped, 80),
    routedTaxonomies: [...routedTax.entries()].sort((a, b) => b[1].count - a[1].count).map(([path, v]) => ({ path, count: v.count, to: v.to })),
    primaryMedians,
    brands,
    stats: {
      sourceProducts: source.products.length,
      active,
      inScope,
      passedFilters,
      selected: products.length,
      stockKnown: Boolean(stockById),
    },
  };
}

function toSelected(c: Candidate, slug: string): SelectedProduct {
  return {
    sourceId: c.sourceId,
    sourceSku: c.sourceSku,
    sku: storefrontSku(c.sourceId),
    name: c.name,
    slug,
    descriptionHtml: c.descriptionHtml,
    descriptionText: c.descriptionText,
    shortDescription: c.shortDescription,
    brand: c.brand,
    price: c.price,
    costPrice: c.costPrice,
    weight: c.weight,
    ean: c.ean,
    quantity: c.quantity,
    primary: c.primary,
    sub: c.sub,
    images: c.images,
    quality: c.quality,
    taxonomyPath: c.taxonomyPath,
  };
}

export function finalizeTree<T extends { primary: string; sub: string | null; name: string; sourceId: number }>(
  items: T[],
  config: CatalogConfig,
  exclude: (reason: string, label: string | null) => void,
): {
  kept: T[];
  demoted: Set<string>;
  demotedList: Array<{ slug: string; name: string; primary: string; count: number }>;
  dropped: Array<{ slug: string; name: string; count: number }>;
  empty: Array<{ slug: string; primary: string }>;
} {
  const demoted = new Set<string>();
  const demotedList: Array<{ slug: string; name: string; primary: string; count: number }> = [];
  const dropped: Array<{ slug: string; name: string; count: number }> = [];
  const empty: Array<{ slug: string; primary: string }> = [];
  const kept: T[] = [];
  for (const p of config.storefront) {
    const inPrimary = items.filter((c) => c.primary === p.slug);
    if (inPrimary.length < config.limits.minPerPrimary) {
      dropped.push({ slug: p.slug, name: p.name, count: inPrimary.length });
      for (const c of inPrimary) exclude("primary-below-min", `${c.name} [${c.sourceId}] in ${p.slug}`);
      continue;
    }
    for (const s of p.subs) {
      const count = inPrimary.filter((c) => c.sub === s.slug).length;
      if (count === 0) empty.push({ slug: s.slug, primary: p.slug });
      else if (count < config.limits.minPerSub) {
        demoted.add(s.slug);
        demotedList.push({ slug: s.slug, name: s.name, primary: p.slug, count });
      }
    }
    for (const c of inPrimary) {
      if (c.sub && demoted.has(c.sub)) c.sub = null;
      kept.push(c);
    }
  }
  return { kept, demoted, demotedList, dropped, empty };
}

export function buildCategoryNodes(products: SelectedProduct[], config: CatalogConfig, demoted: Set<string>): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  const usedArt = new Set<string>();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const rank = (a: SelectedProduct, b: SelectedProduct) =>
    Number(b.images[0]?.whiteBackground ?? false) - Number(a.images[0]?.whiteBackground ?? false) || b.quality - a.quality || a.sourceId - b.sourceId;
  const pickArt = (pool: SelectedProduct[], pinned: string | null | undefined): { slug: string | null; pinned: boolean } => {
    if (pinned && bySlug.has(pinned) && pool.some((p) => p.slug === pinned)) {
      usedArt.add(pinned);
      return { slug: pinned, pinned: true };
    }
    const best = [...pool].sort(rank).find((p) => !usedArt.has(p.slug)) ?? null;
    if (best) usedArt.add(best.slug);
    return { slug: best?.slug ?? null, pinned: false };
  };

  config.storefront.forEach((p, i) => {
    const inPrimary = products.filter((x) => x.primary === p.slug);
    if (!inPrimary.length) return;
    const subSizes = new Map<string, number>();
    for (const x of inPrimary) if (x.sub) subSizes.set(x.sub, (subSizes.get(x.sub) || 0) + 1);
    const largest = [...subSizes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const representative = largest ? inPrimary.filter((x) => x.sub === largest) : inPrimary;
    const art = p.categoryArt && inPrimary.some((x) => x.slug === p.categoryArt) ? pickArt(inPrimary, p.categoryArt) : pickArt(representative, null);
    nodes.push({ slug: p.slug, name: p.name, description: p.description ?? null, parentSlug: null, sortOrder: i, productCount: inPrimary.length, artProductSlug: art.slug, artPinned: art.pinned });
  });
  config.storefront.forEach((p) => {
    p.subs.forEach((s, j) => {
      if (demoted.has(s.slug)) return;
      const inSub = products.filter((x) => x.primary === p.slug && x.sub === s.slug);
      if (!inSub.length) return;
      const art = pickArt(inSub, s.categoryArt);
      nodes.push({ slug: s.slug, name: s.name, description: s.description ?? null, parentSlug: p.slug, sortOrder: j, productCount: inSub.length, artProductSlug: art.slug, artPinned: art.pinned });
    });
  });
  return nodes;
}

export function buildPreview(result: SelectionResult, meta: Record<string, unknown>) {
  const productsBySlug = new Map(result.products.map((p) => [p.slug, p]));
  const sample = (list: SelectedProduct[], seed: number) => {
    const random = seededRandom(seed);
    const shuffled = [...list].sort((a, b) => a.sourceId - b.sourceId);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled
      .slice(0, 10)
      .map((p) => ({ name: p.name, slug: p.slug, sku: p.sku, price: p.price, brand: p.brand, images: p.images.length, quality: p.quality, sourceTaxonomy: p.taxonomyPath }));
  };
  const tree = result.categories
    .filter((c) => !c.parentSlug)
    .map((c, i) => {
      const inPrimary = result.products.filter((p) => p.primary === c.slug);
      return {
        slug: c.slug,
        name: c.name,
        count: c.productCount,
        medianPrice: result.primaryMedians[c.slug] ?? null,
        categoryArt: c.artProductSlug ? { productSlug: c.artProductSlug, pinned: c.artPinned, product: productsBySlug.get(c.artProductSlug)?.name ?? null } : null,
        directOnly: inPrimary.filter((p) => !p.sub).length,
        subs: result.categories
          .filter((s) => s.parentSlug === c.slug)
          .map((s, j) => {
            const inSub = inPrimary.filter((p) => p.sub === s.slug);
            return {
              slug: s.slug,
              name: s.name,
              count: s.productCount,
              medianPrice: round2(median(inSub.map((p) => p.price))),
              categoryArt: s.artProductSlug ? { productSlug: s.artProductSlug, pinned: s.artPinned } : null,
              samples: sample(inSub, (i + 1) * 100 + j),
            };
          }),
        directSamples: sample(inPrimary.filter((p) => !p.sub), i + 1),
      };
    });
  const excludedTotal = Object.values(result.excluded).reduce((sum, n) => sum + n, 0);
  return {
    ...meta,
    totals: {
      ...result.stats,
      excluded: excludedTotal,
      topLevelCategories: tree.length,
      subcategories: result.categories.filter((c) => c.parentSlug).length,
      brandsInShowcase: result.brands.length,
    },
    excludedByRule: Object.fromEntries(Object.entries(result.excluded).sort((a, b) => b[1] - a[1])),
    tree,
    demotedSubcategories: result.demotedSubs,
    droppedTopLevel: result.droppedPrimaries,
    emptySubcategories: result.emptySubs,
    brands: result.brands,
    review: {
      excludedSamples: result.excludedSamples,
      unmappedTaxonomies: result.unmapped,
      routedTaxonomies: result.routedTaxonomies,
    },
  };
}
