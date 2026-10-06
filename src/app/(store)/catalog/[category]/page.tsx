import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata, pagedDescription } from "@/lib/seo/metadata";
import { MEGA_ZONES } from "@/config/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryOpener } from "@/components/catalog/CategoryOpener";
import { SubcategoryRow } from "@/components/catalog/SubcategoryRow";
import { categoryCounts, categoryStats, getCategoryTree, queryCatalog, type CategoryRecord, type CategoryTree } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams } from "@/components/catalog/catalog-url";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
}

function chainOf(tree: CategoryTree, category: CategoryRecord): CategoryRecord[] {
  const chain: CategoryRecord[] = [];
  let current: CategoryRecord | undefined = category;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? tree.byId.get(current.parentId) : undefined;
  }
  return chain;
}

function relatedRoots(tree: CategoryTree, counts: Map<string, number>, root: CategoryRecord) {
  const zone = MEGA_ZONES.find((z) => z.slugs.includes(root.slug));
  const zoneSlugs = zone ? zone.slugs.filter((s) => s !== root.slug) : [];
  const ordered = [...zoneSlugs.map((s) => tree.bySlug.get(s)).filter((c): c is CategoryRecord => Boolean(c)), ...tree.roots.filter((c) => c.id !== root.id && !zoneSlugs.includes(c.slug))];
  return ordered.filter((c) => (counts.get(c.id) ?? 0) > 0).slice(0, 3);
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: true } };
  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams);
  const stats = await categoryStats(tree.subtreeIds(category.id));
  const chain = chainOf(tree, category);
  const title = chain.length > 1 ? `${category.name} — ${chain[0].name}` : category.name;
  const pagedTitle = query.page > 1 ? t("titleWithPage", { title, page: query.page }) : title;
  const lead = category.description || t("metaCategoryFallback", { name: category.name });
  const description = pagedDescription(`${lead} ${t("metaCategoryCount", { count: stats.count })}`, query.page, (text, page) => t("descriptionWithPage", { description: text, page }));
  const filtered = hasActiveFilters(query);
  return pageMetadata({
    title: pagedTitle,
    description,
    path: query.page > 1 ? `/catalog/${category.slug}?page=${query.page}` : `/catalog/${category.slug}`,
    canonical: !filtered,
    images: false,
    index: !filtered && stats.count > 0,
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug);
  if (!category) notFound();

  const t = await getTranslations("catalog");
  const query = parseCatalogParams(await searchParams);
  const basePath = `/catalog/${category.slug}`;
  const chain = chainOf(tree, category);
  const root = chain[0];
  const parent = category.parentId ? tree.byId.get(category.parentId) ?? null : null;
  const anchor = parent ?? category;

  const [counts, stats, result] = await Promise.all([
    categoryCounts(tree),
    categoryStats(tree.subtreeIds(category.id)),
    queryCatalog({ kind: "category", category }, { ...query, category: null }, { basePath }),
  ]);

  const children = tree.children(category.id).filter((c) => (counts.get(c.id) ?? 0) > 0);
  const subLinks = [
    { slug: anchor.slug, label: t("allIn", { name: anchor.name }), count: counts.get(anchor.id) ?? 0, href: `/catalog/${anchor.slug}`, active: anchor.id === category.id },
    ...tree
      .children(anchor.id)
      .filter((c) => (counts.get(c.id) ?? 0) > 0)
      .map((c) => ({ slug: c.slug, label: c.name, count: counts.get(c.id) ?? 0, href: `/catalog/${c.slug}`, active: c.id === category.id })),
  ];

  const related = relatedRoots(tree, counts, root).map((c) => ({ name: c.name, href: `/catalog/${c.slug}` }));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          { label: t("shop"), href: "/catalog" },
          ...chain.slice(0, -1).map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })),
          { label: category.name },
        ]}
      />
      <CategoryOpener
        name={category.name}
        description={category.description}
        artUrl={tree.uniqueArt(category)}
        count={stats.count}
        inStock={stats.inStock}
        subCount={children.length}
        minPrice={stats.minPrice}
        maxPrice={stats.maxPrice}
      />
      <SubcategoryRow label={t("subcategories")} links={subLinks} />
      <CatalogBrowser
        basePath={basePath}
        params={{ ...query, category: null, page: result.page }}
        products={result.products}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        facets={result.facets}
        contextLabel={category.name}
        related={related}
        headingId="category-results"
        heading={t("resultsIn", { name: category.name })}
      />
    </div>
  );
}
