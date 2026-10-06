import { prisma } from "@/lib/prisma";
import { isNewArrival, newArrivalCutoff } from "@/lib/new-arrivals";
import { FURNITURE_ZONES } from "@/config/navigation";
import {
  ORDER_RANKING_WINDOW_DAYS,
  featuredFirst,
  getFeaturedProducts,
  getNewProducts,
  getProductsByCategory,
  getSaleProducts,
  hasImage,
  isInStock,
  preferSubcategories,
  rankByOrders,
  subtreeSlugs,
  type HomepageCategory,
  type HomepageProduct,
} from "@/lib/homepage-products";
import type { HomeCategory, HomeData, HomeProduct } from "./types";

const PREFER: Record<string, string[]> = {
  "hero:tableware": ["bowls", "serveware", "dinner-sets"],
  "hero:glassware-drinkware": ["wine-champagne-glasses", "drinking-glasses", "jugs-carafes"],
  "hero:cookware": ["casseroles", "saucepans-stockpots", "frying-pans"],
  "hero:bakeware": ["oven-dishes", "cake-tins-moulds"],
  "drawer:tableware": ["serveware", "dinner-sets"],
  "drawer:coffee-tea": ["coffee-accessories", "teapots-infusers"],
  "drawer:bar-wine": ["ice-serving", "wine-accessories"],
  rack: ["plates", "bowls", "dinner-sets", "serveware"],
  "hooks:coffee-tea": ["mugs-cups", "cafetieres-pour-over", "moka-pots", "teapots-infusers"],
  "hooks:bar-wine": ["cocktail-tools", "wine-accessories"],
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  comparePrice: true,
  quantity: true,
  isFeatured: true,
  shortDescription: true,
  createdAt: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } },
  categories: { select: { category: { select: { name: true, slug: true } } } },
};

const EMPTY: HomeData = {
  hero: { shelves: [], cupboards: [], drawers: [] },
  drawers: [],
  topShelf: { ranked: false, products: [] },
  rack: { category: null, products: [] },
  hooks: { categories: [], products: [] },
  reduced: [],
  newest: [],
  totalProducts: 0,
};

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

async function unitsSoldRecently(): Promise<Map<string, number>> {
  const since = new Date(Date.now() - ORDER_RANKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { paymentStatus: "PAID", paidAt: { gte: since } } },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.productId, r._sum.quantity ?? 0]));
}

export async function getHomeData(): Promise<HomeData> {
  try {
    const [rawProducts, rawCategories, unitsSold, newSince] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 600,
      }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          children: { where: { isActive: true }, select: { slug: true } },
        },
      }),
      unitsSoldRecently(),
      newArrivalCutoff(),
    ]);

    const counts = await Promise.all(
      rawCategories.map((c) =>
        prisma.product.count({
          where: { status: "ACTIVE", categories: { some: { category: { slug: { in: subtreeSlugs(c) } } } } },
        }),
      ),
    );
    const totalProducts = await prisma.product.count({ where: { status: "ACTIVE" } });

    const products = (serialize(rawProducts) as unknown as HomepageProduct[]).map((p) => ({ ...p, isNew: isNewArrival(p.createdAt, newSince) }));
    const categories: (HomepageCategory & { count: number })[] = rawCategories.map((c, i) => ({ ...c, count: counts[i] }));
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const toHomeCategory = (c: HomepageCategory & { count: number }): HomeCategory => ({ name: c.name, slug: c.slug, count: c.count });

    const shelfReady = featuredFirst(products.filter((p) => isInStock(p) && hasImage(p)));
    const claimed = new Set<string>();
    const unclaimed = () => shelfReady.filter((p) => !claimed.has(p.id));
    const claim = (picked: HomeProduct[]) => {
      picked.forEach((p) => claimed.add(p.id));
      return picked;
    };
    const fromCategory = (slug: string, key: string, limit: number) => {
      const category = bySlug.get(slug);
      if (!category) return [];
      return claim(preferSubcategories(getProductsByCategory(unclaimed(), category), PREFER[key] ?? []).slice(0, limit));
    };

    const heroShelfLimits: Record<string, number> = { tableware: 4, "glassware-drinkware": 5 };
    const heroShelves = FURNITURE_ZONES.shelves
      .map((slug) => {
        const category = bySlug.get(slug);
        return category ? { category: toHomeCategory(category), products: fromCategory(slug, `hero:${slug}`, heroShelfLimits[slug] ?? 4) } : null;
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.products.length > 0));

    const heroCupboards = ["cookware", "bakeware"]
      .map((slug) => {
        const category = bySlug.get(slug);
        return category ? { category: toHomeCategory(category), products: fromCategory(slug, `hero:${slug}`, 2) } : null;
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.products.length > 0));

    const heroDrawers = FURNITURE_ZONES.drawers
      .map((slug) => bySlug.get(slug))
      .filter((c): c is NonNullable<typeof c> => Boolean(c && c.count > 0))
      .map(toHomeCategory);

    const drawers = categories
      .filter((c) => c.count > 0)
      .map((c) => ({ ...toHomeCategory(c), products: fromCategory(c.slug, `drawer:${c.slug}`, 3) }));

    const ranked = rankByOrders(unclaimed(), unitsSold, 5);
    const picked = getFeaturedProducts(unclaimed(), 5);
    const topShelfProducts = ranked.length > 0 ? ranked : [...picked, ...unclaimed().filter((p) => !picked.includes(p)).slice(0, 5 - picked.length)];
    const topShelf = { ranked: ranked.length > 0, products: claim(topShelfProducts) };

    const tableware = bySlug.get("tableware");
    const rack = {
      category: tableware ? toHomeCategory(tableware) : null,
      products: tableware ? claim(preferSubcategories(getProductsByCategory(unclaimed(), tableware), PREFER.rack).slice(0, 8)) : [],
    };

    const hookSlugs = FURNITURE_ZONES.hooks.filter((slug) => bySlug.has(slug));
    const hookProducts = hookSlugs.flatMap((slug) => fromCategory(slug, `hooks:${slug}`, 4));
    const hooks = {
      categories: hookSlugs.map((slug) => toHomeCategory(bySlug.get(slug)!)).filter((c) => c.count > 0),
      products: hookProducts,
    };

    const reduced = claim(getSaleProducts(unclaimed(), 4));
    const newestPool = getNewProducts(unclaimed().filter((p) => p.isNew), 8);
    const newest = claim(newestPool.slice(0, newestPool.length >= 8 ? 8 : newestPool.length >= 4 ? 4 : 0));

    return {
      hero: { shelves: heroShelves, cupboards: heroCupboards, drawers: heroDrawers },
      drawers,
      topShelf,
      rack,
      hooks,
      reduced,
      newest,
      totalProducts,
    };
  } catch (error) {
    console.error("Homepage data fetch error:", error);
    return EMPTY;
  }
}
