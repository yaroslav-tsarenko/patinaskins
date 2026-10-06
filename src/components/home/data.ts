import { prisma } from "@/lib/prisma";
import { RARITIES, WEAPON_TYPES, weaponSlug } from "@/lib/skins/cs2";
import { loadShelfProducts } from "@/components/catalog/catalog-query";
import type { HomeData } from "./types";

const FEATURED_LIMIT = 8;
const NEWEST_LIMIT = 8;

export async function getHomeData(): Promise<HomeData> {
  const [byWeapon, byRarity, featuredFlagged, newest] = await Promise.all([
    prisma.skin.groupBy({
      by: ["weaponType", "weapon"],
      where: { product: { status: "ACTIVE" } },
      _count: { _all: true },
    }),
    prisma.skin.groupBy({ by: ["rarity"], where: { product: { status: "ACTIVE" } }, _count: { _all: true } }),
    prisma.product.findMany({
      where: { status: "ACTIVE", isFeatured: true, quantity: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: FEATURED_LIMIT,
      select: { id: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", quantity: { gt: 0 }, skin: { isNot: null } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: NEWEST_LIMIT,
      select: { id: true },
    }),
  ]);

  const minPrices = await prisma.$queryRaw<{ weaponType: string; min: number }[]>`
    SELECT s."weaponType", MIN(p."price")::float AS min
    FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
    WHERE p."status" = 'ACTIVE'::"ProductStatus"
    GROUP BY s."weaponType"`;
  const minByType = new Map(minPrices.map((r) => [r.weaponType, r.min]));

  const types = WEAPON_TYPES.map((type) => {
    const rows = byWeapon.filter((r) => r.weaponType === type.key);
    const weapons = type.weapons
      .map((name) => ({ name, slug: weaponSlug(name), count: rows.find((r) => r.weapon === name)?._count._all ?? 0 }))
      .filter((w) => w.count > 0);
    return {
      key: type.key,
      name: type.label,
      count: rows.reduce((sum, r) => sum + r._count._all, 0),
      minPrice: minByType.get(type.key) ?? null,
      weapons,
    };
  }).filter((t) => t.count > 0);

  let featuredIds = featuredFlagged.map((p) => p.id);
  if (featuredIds.length < FEATURED_LIMIT) {
    const picks = await prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT ON (s."weapon") p."id"
      FROM "Skin" s JOIN "Product" p ON p."id" = s."productId"
      WHERE p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0
        AND s."rarity" IN ('extraordinary', 'covert', 'contraband')
      ORDER BY s."weapon", p."price" DESC`;
    const extra = picks.map((p) => p.id).filter((id) => !featuredIds.includes(id));
    featuredIds = [...featuredIds, ...extra.slice(0, FEATURED_LIMIT - featuredIds.length)];
  }

  const rarityCounts = new Map(byRarity.map((r) => [r.rarity, r._count._all]));
  const rarities = [...RARITIES]
    .reverse()
    .map((r) => ({ key: r.key, label: r.label, color: r.color, count: rarityCounts.get(r.key) ?? 0 }))
    .filter((r) => r.count > 0);

  const [featured, newestProducts] = await Promise.all([loadShelfProducts(featuredIds), loadShelfProducts(newest.map((p) => p.id))]);

  return {
    totalProducts: types.reduce((sum, t) => sum + t.count, 0),
    types,
    featured,
    rarities,
    newest: newestProducts,
  };
}
