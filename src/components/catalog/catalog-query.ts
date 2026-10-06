import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mentionsSupplier, publicBrand } from "@/lib/utils/supplier";
import { isNewArrival, newArrivalCutoff } from "@/lib/new-arrivals";
import type { ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";
import { CATALOG_PAGE_SIZE, buildCatalogHref, type CatalogFacets, type CatalogParams, type CategoryOption, type SortKey } from "./catalog-url";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
}

export interface CategoryTree {
  all: CategoryRecord[];
  roots: CategoryRecord[];
  bySlug: Map<string, CategoryRecord>;
  byId: Map<string, CategoryRecord>;
  children: (id: string) => CategoryRecord[];
  subtreeIds: (id: string) => string[];
  uniqueArt: (category: CategoryRecord) => string | null;
}

export const getCategoryTree = cache(async (): Promise<CategoryTree> => {
  const all = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true, parentId: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const byId = new Map(all.map((c) => [c.id, c]));
  const childMap = new Map<string, CategoryRecord[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    const list = childMap.get(c.parentId) ?? [];
    list.push(c);
    childMap.set(c.parentId, list);
  }
  const children = (id: string) => childMap.get(id) ?? [];
  const subtreeIds = (id: string): string[] => [id, ...children(id).flatMap((c) => subtreeIds(c.id))];
  const artOwner = new Map<string, string>();
  const depth = (c: CategoryRecord): number => (c.parentId && byId.has(c.parentId) ? 1 + depth(byId.get(c.parentId)!) : 0);
  for (const c of [...all].sort((a, b) => depth(a) - depth(b) || a.sortOrder - b.sortOrder)) {
    if (c.imageUrl && !artOwner.has(c.imageUrl)) artOwner.set(c.imageUrl, c.id);
  }
  const uniqueArt = (c: CategoryRecord) => (c.imageUrl && artOwner.get(c.imageUrl) === c.id ? c.imageUrl : null);
  return { all, roots: all.filter((c) => !c.parentId), bySlug, byId, children, subtreeIds, uniqueArt };
});

interface Row {
  id: string;
  name: string;
  price: number;
  compare: number | null;
  quantity: number;
  tracked: boolean;
  brand: string | null;
  createdAt: number;
  orders: number;
  cats: Set<string>;
  score: number;
}

type Facet = "category" | "brand" | "price" | "inStock" | "onSale";

export type CatalogScope =
  | { kind: "all" }
  | { kind: "category"; category: CategoryRecord }
  | { kind: "search"; query: string };

export interface CatalogResult {
  products: ShelfProduct[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  scopeTotal: number;
  facets: CatalogFacets;
  activeCategoryName: string | null;
}

function searchWhere(query: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ],
  };
}

function scoreFor(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n.startsWith(q)) return 3;
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(n)) return 2;
  if (n.includes(q)) return 1;
  return 0;
}

async function loadRows(scope: CatalogScope, tree: CategoryTree): Promise<Row[]> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (scope.kind === "category") where.categories = { some: { categoryId: { in: tree.subtreeIds(scope.category.id) } } };
  if (scope.kind === "search") {
    if (scope.query.length < 2 || mentionsSupplier(scope.query)) return [];
    Object.assign(where, searchWhere(scope.query));
  }
  const rows = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      price: true,
      comparePrice: true,
      quantity: true,
      trackInventory: true,
      brand: true,
      createdAt: true,
      categories: { select: { categoryId: true } },
      _count: { select: { orderItems: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    compare: r.comparePrice != null ? Number(r.comparePrice) : null,
    quantity: r.quantity,
    tracked: r.trackInventory,
    brand: publicBrand(r.brand),
    createdAt: r.createdAt.getTime(),
    orders: r._count.orderItems,
    cats: new Set(r.categories.map((c) => c.categoryId)),
    score: scope.kind === "search" ? scoreFor(r.name, scope.query) : 0,
  }));
}

const available = (r: Row) => !r.tracked || r.quantity > 0;
const reduced = (r: Row) => r.compare !== null && r.compare > r.price;

function matcher(params: CatalogParams, categoryIds: Set<string> | null) {
  return (row: Row, except: Facet | null = null) => {
    if (except !== "category" && categoryIds && ![...row.cats].some((id) => categoryIds.has(id))) return false;
    if (except !== "brand" && params.brand && row.brand !== params.brand) return false;
    if (except !== "price") {
      if (params.minPrice !== null && row.price < params.minPrice) return false;
      if (params.maxPrice !== null && row.price > params.maxPrice) return false;
    }
    if (except !== "inStock" && params.inStock && !available(row)) return false;
    if (except !== "onSale" && params.onSale && !reduced(row)) return false;
    return true;
  };
}

function sorter(sort: SortKey) {
  const byNewest = (a: Row, b: Row) => b.createdAt - a.createdAt || a.name.localeCompare(b.name);
  switch (sort) {
    case "price-asc":
      return (a: Row, b: Row) => a.price - b.price || byNewest(a, b);
    case "price-desc":
      return (a: Row, b: Row) => b.price - a.price || byNewest(a, b);
    case "name-asc":
      return (a: Row, b: Row) => a.name.localeCompare(b.name, "en-GB");
    case "popular":
      return (a: Row, b: Row) => b.orders - a.orders || byNewest(a, b);
    case "relevance":
      return (a: Row, b: Row) => b.score - a.score || Number(available(b)) - Number(available(a)) || a.name.localeCompare(b.name, "en-GB");
    default:
      return byNewest;
  }
}

function leafCategory(categories: { category: { name: string; slug: string; parentId: string | null } }[]) {
  const leaf = categories.find((c) => c.category.parentId) ?? categories[0];
  return leaf?.category ?? null;
}

export async function loadShelfProducts(ids: string[]): Promise<ShelfProduct[]> {
  if (ids.length === 0) return [];
  const [records, newSince] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        comparePrice: true,
        quantity: true,
        trackInventory: true,
        createdAt: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
        categories: { select: { category: { select: { name: true, slug: true, parentId: true } } } },
      },
    }),
    newArrivalCutoff(),
  ]);
  const byId = new Map(records.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => {
      const leaf = leafCategory(r.categories);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        sku: r.sku,
        price: Number(r.price),
        comparePrice: r.comparePrice != null ? Number(r.comparePrice) : null,
        quantity: r.trackInventory ? r.quantity : undefined,
        images: r.images.map((img) => ({ url: img.url, alt: img.alt })),
        category: leaf?.name ?? null,
        createdAt: r.createdAt.toISOString(),
        isNew: isNewArrival(r.createdAt, newSince),
      };
    });
}

export async function queryCatalog(
  scope: CatalogScope,
  params: CatalogParams,
  options: { basePath: string; fixed?: Record<string, string>; defaultSort?: SortKey },
): Promise<CatalogResult> {
  const tree = await getCategoryTree();
  const rows = await loadRows(scope, tree);
  const hrefOpts = { fixed: options.fixed, defaultSort: options.defaultSort };

  const paramCategory = scope.kind === "search" && params.category ? tree.bySlug.get(params.category) ?? null : null;
  const categoryIds = paramCategory ? new Set(tree.subtreeIds(paramCategory.id)) : null;
  const passes = matcher(params, categoryIds);

  const inSubtree = (row: Row, id: string) => {
    const ids = tree.subtreeIds(id);
    return ids.some((cid) => row.cats.has(cid));
  };
  const countIn = (id: string) => rows.filter((r) => passes(r, "category") && inSubtree(r, id)).length;

  let categoryTitle: CatalogFacets["categoryTitle"] = "category";
  let categories: CategoryOption[] = [];
  if (scope.kind === "all") {
    categories = tree.roots
      .map((c) => ({
        key: c.slug,
        name: c.name,
        count: countIn(c.id),
        href: buildCatalogHref(`/catalog/${c.slug}`, params, { category: null }, hrefOpts),
        active: false,
        depth: 0 as const,
      }))
      .filter((o) => o.count > 0);
  } else if (scope.kind === "category") {
    const current = scope.category;
    const parent = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
    const anchor = parent ?? current;
    const siblings = tree.children(anchor.id);
    if (siblings.length > 0) {
      categoryTitle = "subcategory";
      const siblingRows = parent ? await loadRows({ kind: "category", category: anchor }, tree) : rows;
      const anchorCount = siblingRows.filter((r) => passes(r, "category")).length;
      const siblingCount = (id: string) => siblingRows.filter((r) => passes(r, "category") && inSubtree(r, id)).length;
      categories = [
        {
          key: anchor.slug,
          name: anchor.name,
          count: anchorCount,
          href: buildCatalogHref(`/catalog/${anchor.slug}`, params, {}, hrefOpts),
          active: !parent,
          depth: 0 as const,
        },
        ...siblings.map((c) => ({
          key: c.slug,
          name: c.name,
          count: siblingCount(c.id),
          href: buildCatalogHref(`/catalog/${c.slug}`, params, {}, hrefOpts),
          active: c.id === current.id,
          depth: 1 as const,
        })),
      ].filter((o) => o.count > 0 || o.active);
    }
  } else {
    categories = tree.roots
      .map((c) => ({
        key: c.slug,
        name: c.name,
        count: countIn(c.id),
        href: buildCatalogHref(options.basePath, params, { category: c.slug }, hrefOpts),
        active: paramCategory?.id === c.id,
        depth: 0 as const,
      }))
      .filter((o) => o.count > 0 || o.active);
  }

  const brandCounts = new Map<string, number>();
  for (const r of rows) if (r.brand && passes(r, "brand")) brandCounts.set(r.brand, (brandCounts.get(r.brand) ?? 0) + 1);
  const brands = [...brandCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
  if (params.brand && !brandCounts.has(params.brand)) brands.push({ name: params.brand, count: 0 });

  const priceRows = rows.filter((r) => passes(r, "price"));
  const price = priceRows.length
    ? { min: Math.min(...priceRows.map((r) => r.price)), max: Math.max(...priceRows.map((r) => r.price)) }
    : null;

  const stockBase = rows.filter((r) => passes(r, "inStock"));
  const inStockCount = stockBase.filter(available).length;
  const onSaleCount = rows.filter((r) => passes(r, "onSale") && reduced(r)).length;

  const matched = rows.filter((r) => passes(r)).sort(sorter(params.sort));
  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const pageIds = matched.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE).map((r) => r.id);
  const products = await loadShelfProducts(pageIds);

  return {
    products,
    total,
    page,
    totalPages,
    pageSize: CATALOG_PAGE_SIZE,
    scopeTotal: rows.length,
    activeCategoryName: paramCategory?.name ?? null,
    facets: {
      categoryTitle,
      categories,
      brands,
      price,
      inStockCount,
      onSaleCount,
      narrowingInStock: inStockCount > 0 && inStockCount < stockBase.length,
    },
  };
}

export interface CategoryStats {
  count: number;
  inStock: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export async function categoryStats(categoryIds: string[]): Promise<CategoryStats> {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", categories: { some: { categoryId: { in: categoryIds } } } },
    select: { price: true, quantity: true, trackInventory: true },
  });
  const prices = rows.map((r) => Number(r.price));
  return {
    count: rows.length,
    inStock: rows.filter((r) => !r.trackInventory || r.quantity > 0).length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
}

export async function categoryCounts(tree: CategoryTree): Promise<Map<string, number>> {
  const links = await prisma.productCategory.findMany({
    where: { product: { status: "ACTIVE" }, category: { isActive: true } },
    select: { productId: true, categoryId: true },
  });
  const byCategory = new Map<string, Set<string>>();
  for (const link of links) {
    const set = byCategory.get(link.categoryId) ?? new Set<string>();
    set.add(link.productId);
    byCategory.set(link.categoryId, set);
  }
  const counts = new Map<string, number>();
  for (const c of tree.all) {
    const ids = new Set<string>();
    for (const id of tree.subtreeIds(c.id)) for (const pid of byCategory.get(id) ?? []) ids.add(pid);
    counts.set(c.id, ids.size);
  }
  return counts;
}
