const SUPPLIER_LINES = [
  "accessories", "baby", "beauty", "car", "christmas", "cooking", "fashion", "gadget", "garden",
  "health", "home", "kids", "kitchen", "office", "outdoor", "party", "pets", "sport", "sports",
  "tech", "tools", "toys", "wellness",
];

const SUPPLIER_TEST = /big\s*-?\s*bu[yi]/i;

const SUPPLIER_PHRASE = new RegExp(
  `\\s*(?:from|by|via)?\\s*\\bbig\\s*-?\\s*bu[yi]\\b(?:\\s+(?:${SUPPLIER_LINES.join("|")})\\b)?`,
  "gi"
);

export function mentionsSupplier(value: string | null | undefined): boolean {
  return Boolean(value && SUPPLIER_TEST.test(value));
}

export function publicBrand(brand: string | null | undefined): string | null {
  if (!brand || mentionsSupplier(brand)) return null;
  return brand;
}

export function stripSupplierMentions(value: string): string {
  if (!mentionsSupplier(value)) return value;
  return value
    .replace(SUPPLIER_PHRASE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/^[\s,.;:\-–—|]+|[\s,;:\-–—|]+$/g, "")
    .trim();
}

export function publicText(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return mentionsSupplier(value) ? null : value;
}

export const SUPPLIER_HOSTS = ["bigbuy.eu", "bigbuy.com", "bigbuy.es", "cdnbigbuy.com"];

const SUPPLIER_HOST_TEST = /big-?bu[yi]/i;

const SUPPLIER_URL = /(?:https?:\/\/|\/\/|www\.)?(?:[a-z0-9-]+\.)*(?:cdn)?big-?bu[yi]\.[a-z]{2,}(?:\.[a-z]{2,})?(?:[/?#][^\s"'<>)]*)?/gi;

const SUPPLIER_SKU = /\b(?:BB-?)?[A-Z]\d{7}\b/g;

const SKU_LABEL = String.raw`(?:ref(?:erence)?|sku|item\s*(?:no|number|code)|product\s*code|art(?:icle)?\s*(?:no|nr|number)?)\.?\s*[:#]?\s*`;

const DISTRIBUTOR_SENTENCE = /(?<=^|[.!?\n>]\s*)\s*(?:[^.!?\n<]|\.(?!\s|$))*?\b(?:distributed|imported|marketed)\s+(?:in\s+[a-z ]+\s+)?(?:by|through)\b(?:[^.!?\n<]|\.(?!\s|$))*(?:[.!?](?=\s|$)|(?=\n|<|$))/gi;

const DISTRIBUTOR_LABEL = /(?:^|(?<=[.!?\n>]))\s*(?:distributor|importer|imported by|distributed by)\s*:[^\n<]*/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isBlockedImageHost(url: string | null | undefined, supplierHosted: boolean): boolean {
  return !supplierHosted && isSupplierHost(url);
}

export function isSupplierHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return SUPPLIER_HOST_TEST.test(new URL(url, "https://local.invalid").hostname);
  } catch {
    return SUPPLIER_HOST_TEST.test(url);
  }
}

export function isDistributorLine(value: string | null | undefined): boolean {
  if (!value) return false;
  DISTRIBUTOR_SENTENCE.lastIndex = 0;
  DISTRIBUTOR_LABEL.lastIndex = 0;
  return DISTRIBUTOR_SENTENCE.test(value) || DISTRIBUTOR_LABEL.test(value);
}

export function hasSupplierSku(value: string | null | undefined, knownSkus: string[] = []): boolean {
  if (!value) return false;
  SUPPLIER_SKU.lastIndex = 0;
  if (SUPPLIER_SKU.test(value)) return true;
  return knownSkus.some((sku) => sku && sku.length >= 4 && new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(sku)}(?![A-Za-z0-9])`, "i").test(value));
}

export function containsSupplierTrace(value: string | null | undefined, knownSkus: string[] = []): boolean {
  if (!value) return false;
  SUPPLIER_URL.lastIndex = 0;
  return mentionsSupplier(value) || SUPPLIER_URL.test(value) || isDistributorLine(value) || hasSupplierSku(value, knownSkus);
}

function dropSentencesWithSupplierUrl(value: string): string {
  return value
    .split(/(?<=[.!?])(?=\s)/)
    .filter((sentence) => {
      SUPPLIER_URL.lastIndex = 0;
      return !SUPPLIER_URL.test(sentence);
    })
    .join("");
}

export function scrubSupplierText(value: string, knownSkus: string[] = []): string {
  let out = dropSentencesWithSupplierUrl(value)
    .replace(SUPPLIER_URL, " ")
    .replace(DISTRIBUTOR_LABEL, "")
    .replace(DISTRIBUTOR_SENTENCE, "");
  const skuSources = [SUPPLIER_SKU.source, ...knownSkus.filter((sku) => sku && sku.length >= 4).map(escapeRegExp)];
  for (const source of skuSources) {
    out = out
      .replace(new RegExp(`[(\\[]?\\s*${SKU_LABEL}(?<![A-Za-z0-9])${source}(?![A-Za-z0-9])\\s*[)\\]]?`, "gi"), " ")
      .replace(new RegExp(`[(\\[]\\s*(?<![A-Za-z0-9])${source}(?![A-Za-z0-9])\\s*[)\\]]`, "g"), " ")
      .replace(new RegExp(`(?<![A-Za-z0-9])${source}(?![A-Za-z0-9])`, "g"), " ");
  }
  out = stripSupplierMentions(out);
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/([.!?])\s*[.,;:]+/g, "$1")
    .replace(/^[\s,.;:\-–—|]+|[\s,;:\-–—|]+$/g, "")
    .trim();
}

const CLEARED_KEYS = new Set(["brand", "subtitle", "badgeText", "ctaLabel", "discountText", "alt"]);

const STRIPPED_KEYS = new Set([
  "name", "title", "description", "shortDescription", "metaTitle", "metaDescription",
  "label", "content", "viewAllLabel", "productName", "variantName",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeCharacteristics(value: unknown): unknown {
  if (!isPlainObject(value)) return value;
  const cleaned: Record<string, unknown> = {};
  for (const [group, entries] of Object.entries(value)) {
    if (isPlainObject(entries)) {
      const kept: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(entries)) {
        if (typeof entry === "string" && mentionsSupplier(entry)) continue;
        kept[stripSupplierMentions(key) || key] = entry;
      }
      if (Object.keys(kept).length) cleaned[stripSupplierMentions(group) || group] = kept;
    } else if (!(typeof entries === "string" && mentionsSupplier(entries))) {
      cleaned[group] = entries;
    }
  }
  return cleaned;
}

export function sanitizeSupplierData<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach((entry) => sanitizeSupplierData(entry));
    return value;
  }
  if (!isPlainObject(value)) return value;

  const record: Record<string, unknown> = value;
  for (const [key, entry] of Object.entries(record)) {
    if (key === "characteristics") {
      record[key] = sanitizeCharacteristics(entry);
    } else if (typeof entry === "string") {
      if (!mentionsSupplier(entry)) continue;
      if (CLEARED_KEYS.has(key)) record[key] = null;
      else if (STRIPPED_KEYS.has(key)) record[key] = stripSupplierMentions(entry);
    } else if (typeof entry === "object" && entry !== null) {
      sanitizeSupplierData(entry);
    }
  }
  return value;
}
