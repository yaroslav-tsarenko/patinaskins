"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { FilterChip, FilterChipRow } from "@/components/ui/Chip";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import { ProductSort, CATALOG_SORTS } from "@/components/product/ProductSort/ProductSort";
import { FilterSummary, ProductFilters, ProductFiltersDrawer, useDisplayPrice, type FilterSelection } from "@/components/product/ProductFilters/ProductFilters";
import type { ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";
import { CATALOG_PAGE_SIZE, buildCatalogHref, clearedParams, hasActiveFilters, type CatalogFacets, type CatalogParams, type SortKey } from "./catalog-url";

export interface CatalogBrowserProps {
  basePath: string;
  fixed?: Record<string, string>;
  defaultSort?: SortKey;
  sortOptions?: SortKey[];
  params: CatalogParams;
  products: ShelfProduct[];
  total: number;
  page: number;
  totalPages: number;
  facets: CatalogFacets;
  contextLabel?: string | null;
  activeCategoryName?: string | null;
  related: { name: string; href: string }[];
  headingId: string;
  heading: string;
}

export function CatalogBrowser({
  basePath,
  fixed,
  defaultSort = "newest",
  sortOptions = CATALOG_SORTS,
  params,
  products,
  total,
  page,
  totalPages,
  facets,
  contextLabel,
  activeCategoryName,
  related,
  headingId,
  heading,
}: CatalogBrowserProps) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { format, toDisplay } = useDisplayPrice();
  const hrefOpts = { fixed, defaultSort };

  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  const apply = (next: Partial<CatalogParams>) => go(buildCatalogHref(basePath, params, next, hrefOpts));
  const clearAll = () => go(buildCatalogHref(basePath, clearedParams(params), {}, hrefOpts));

  const money = (base: number) => {
    const v = toDisplay(base);
    return format(v, Number.isInteger(v) ? 0 : 2);
  };
  const priceLabel =
    params.minPrice !== null && params.maxPrice !== null
      ? t("chipPriceRange", { min: money(params.minPrice), max: money(params.maxPrice) })
      : params.minPrice !== null
        ? t("chipPriceFrom", { min: money(params.minPrice) })
        : params.maxPrice !== null
          ? t("chipPriceTo", { max: money(params.maxPrice) })
          : null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (activeCategoryName) chips.push({ key: "category", label: activeCategoryName, onRemove: () => apply({ category: null }) });
  if (params.brand) chips.push({ key: "brand", label: params.brand, onRemove: () => apply({ brand: null }) });
  if (priceLabel) chips.push({ key: "price", label: priceLabel, onRemove: () => apply({ minPrice: null, maxPrice: null }) });
  if (params.inStock) chips.push({ key: "inStock", label: t("chipInStock"), onRemove: () => apply({ inStock: false }) });
  if (params.onSale) chips.push({ key: "onSale", label: t("chipReduced"), onRemove: () => apply({ onSale: false }) });

  const parts = [contextLabel, ...chips.map((c) => c.label)].filter((p): p is string => Boolean(p));
  const selection: FilterSelection = { brand: params.brand, minPrice: params.minPrice, maxPrice: params.maxPrice, inStock: params.inStock, onSale: params.onSale };
  const filtering = hasActiveFilters(params);
  const filterCount = chips.length;

  const filters = (inDrawer: boolean) => (
    <ProductFilters facets={facets} selection={selection} onChange={(next) => apply(next)} onNavigate={inDrawer ? () => setDrawerOpen(false) : undefined} />
  );

  const relatedLinks =
    related.length > 0 ? (
      <nav aria-label={t("relatedShelves")} className="mt-2 flex flex-col items-center gap-3">
        <p className="eyebrow text-ink-muted">{t("relatedShelves")}</p>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0">
          {related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    ) : null;

  return (
    <div data-catalog="" className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside aria-label={t("filtersTitle")} className="hidden lg:sticky lg:top-[calc(var(--header-height-compact)+24px)] lg:block lg:max-h-[calc(100dvh-var(--header-height-compact)-48px)] lg:overflow-y-auto lg:pb-6">
        {filters(false)}
      </aside>

      <section aria-labelledby={headingId} className="min-w-0">
        <h2 id={headingId} className="sr-only">
          {heading}
        </h2>
        <div
          data-catalog-toolbar=""
          className="sticky top-[var(--header-height-mobile)] z-30 -mx-gutter flex items-center justify-between gap-3 border-b border-line bg-surface px-gutter py-2 transition-[top] duration-[320ms] ease-[var(--ease-furniture)] lg:hidden [body:has([data-header-state=hidden])_&]:top-0"
        >
          <Button variant="outline" size="sm" onPress={() => setDrawerOpen(true)} startContent={<SlidersHorizontal size={16} aria-hidden="true" />}>
            {filterCount > 0 ? t("filterCount", { count: filterCount }) : t("filter")}
          </Button>
          <ProductSort value={params.sort} options={sortOptions} onChange={(sort) => apply({ sort })} />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-8 pt-5 lg:pt-0">
          <FilterSummary total={total} parts={parts} chips={chips} onClearAll={chips.length > 0 ? clearAll : undefined} />
          <ProductSort value={params.sort} options={sortOptions} onChange={(sort) => apply({ sort })} className="hidden lg:flex" />
        </div>

        <span aria-live="polite" className="sr-only">
          {pending ? t("updating") : ""}
        </span>

        <div aria-busy={pending || undefined} className={cn("transition-opacity duration-[160ms]", pending && "opacity-50")}>
          {total === 0 ? (
            filtering ? (
              <EmptyState title={t("emptyFiltersTitle")} subtitle={t("emptyFiltersBody")}>
                {chips.length > 0 ? (
                  <FilterChipRow onClearAll={clearAll} className="justify-center">
                    {chips.map((chip) => (
                      <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                    ))}
                  </FilterChipRow>
                ) : null}
                {relatedLinks}
              </EmptyState>
            ) : (
              <EmptyState title={t("emptyCategoryTitle")} subtitle={t("emptyCategoryBody")}>
                {relatedLinks}
              </EmptyState>
            )
          ) : (
            <>
              <ProductGrid products={products} priorityCount={2} />
              <Pagination
                page={page}
                totalPages={totalPages}
                hrefForPage={(p) => buildCatalogHref(basePath, params, { page: p }, hrefOpts)}
                className="mt-16 pb-6"
              />
              {totalPages > 1 ? (
                <p className="meta tabular mt-2 text-center text-ink-muted">
                  {t("showingRange", { from: (page - 1) * CATALOG_PAGE_SIZE + 1, to: Math.min(page * CATALOG_PAGE_SIZE, total), total })}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <ProductFiltersDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} total={total} onClearAll={clearAll}>
        {filters(true)}
      </ProductFiltersDrawer>
    </div>
  );
}
