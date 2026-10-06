export const SORT_KEYS = ["newest", "price-asc", "price-desc", "popular", "name-asc", "relevance"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const CATALOG_PAGE_SIZE = 24;

export interface CatalogParams {
  sort: SortKey;
  page: number;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  onSale: boolean;
  brand: string | null;
  category: string | null;
}

export interface CategoryOption {
  key: string;
  name: string;
  count: number;
  href: string;
  active: boolean;
  depth: 0 | 1;
}

export interface CatalogFacets {
  categoryTitle: "category" | "subcategory";
  categories: CategoryOption[];
  brands: { name: string; count: number }[];
  price: { min: number; max: number } | null;
  inStockCount: number;
  onSaleCount: number;
  narrowingInStock: boolean;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function price(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export function parseCatalogParams(raw: RawSearchParams, defaultSort: SortKey = "newest"): CatalogParams {
  const sortRaw = first(raw.sort) as SortKey;
  const page = parseInt(first(raw.page), 10);
  let minPrice = price(first(raw.minPrice));
  let maxPrice = price(first(raw.maxPrice));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  return {
    sort: SORT_KEYS.includes(sortRaw) ? sortRaw : defaultSort,
    page: Number.isFinite(page) && page > 1 ? page : 1,
    minPrice,
    maxPrice,
    inStock: first(raw.inStock) === "true",
    onSale: first(raw.onSale) === "true",
    brand: first(raw.brand).trim() || null,
    category: first(raw.category).trim() || null,
  };
}

export function hasActiveFilters(params: CatalogParams): boolean {
  return params.minPrice !== null || params.maxPrice !== null || params.inStock || params.onSale || Boolean(params.brand) || Boolean(params.category);
}

export type ParamOverrides = Partial<CatalogParams>;

export function buildCatalogHref(
  basePath: string,
  params: CatalogParams,
  overrides: ParamOverrides = {},
  options: { fixed?: Record<string, string>; defaultSort?: SortKey; resetPage?: boolean } = {},
): string {
  const next: CatalogParams = { ...params, ...overrides };
  const resetPage = options.resetPage ?? !("page" in overrides);
  if (resetPage) next.page = 1;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(options.fixed ?? {})) if (value) qs.set(key, value);
  if (next.category) qs.set("category", next.category);
  if (next.brand) qs.set("brand", next.brand);
  if (next.minPrice !== null) qs.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== null) qs.set("maxPrice", String(next.maxPrice));
  if (next.inStock) qs.set("inStock", "true");
  if (next.onSale) qs.set("onSale", "true");
  if (next.sort !== (options.defaultSort ?? "newest")) qs.set("sort", next.sort);
  if (next.page > 1) qs.set("page", String(next.page));
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function clearedParams(params: CatalogParams): CatalogParams {
  return { ...params, minPrice: null, maxPrice: null, inStock: false, onSale: false, brand: null, category: null, page: 1 };
}
