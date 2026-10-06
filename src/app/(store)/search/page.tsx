import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { categoryCounts, getCategoryTree, queryCatalog } from "@/components/catalog/catalog-query";
import { hasActiveFilters, parseCatalogParams, type RawSearchParams, type SortKey } from "@/components/catalog/catalog-url";
import { SearchForm, SearchNoResults } from "@/components/search/SearchResults/SearchResults";
import { noindexMetadata } from "@/lib/seo/metadata";

interface SearchPageProps {
  searchParams: Promise<RawSearchParams>;
}

const SEARCH_SORTS: SortKey[] = ["relevance", "newest", "price-asc", "price-desc", "popular", "name-asc"];

function readQuery(raw: RawSearchParams): string {
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  return (q ?? "").trim().slice(0, 100);
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const query = readQuery(await searchParams);
  return noindexMetadata(query ? t("metaSearchQuery", { query }) : t("searchTitle"), t("metaSearchDescription"), "/search");
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const query = readQuery(raw);
  const params = parseCatalogParams(raw, "relevance");
  const t = await getTranslations("catalog");
  const tree = await getCategoryTree();
  const counts = await categoryCounts(tree);
  const categoryLinks = tree.roots
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .map((c) => ({ name: c.name, href: `/catalog/${c.slug}`, count: counts.get(c.id) ?? 0 }));

  const searchable = query.length >= 2;
  const result = searchable ? await queryCatalog({ kind: "search", query }, params, { basePath: "/search", fixed: { q: query }, defaultSort: "relevance" }) : null;
  const showBrowser = result && (result.scopeTotal > 0 || hasActiveFilters(params));

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("searchTitle") }]} />
      <div className="max-w-[760px] pb-8 pt-2">
        <SearchForm query={query} label={t("searchLabel")} placeholder={t("searchPlaceholder")} submit={t("searchSubmit")} />
      </div>

      <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 pb-8">
        <h1 className="text-step-4 leading-[1.05] text-ink [overflow-wrap:anywhere]">{searchable ? t("queryHeading", { query }) : t("searchTitle")}</h1>
        {result ? <p className="tabular text-step-0 text-ink-muted">{t("results", { count: result.scopeTotal })}</p> : null}
      </header>

      {showBrowser && result ? (
        <CatalogBrowser
          basePath="/search"
          fixed={{ q: query }}
          defaultSort="relevance"
          sortOptions={SEARCH_SORTS}
          params={{ ...params, page: result.page }}
          products={result.products}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          facets={result.facets}
          activeCategoryName={result.activeCategoryName}
          related={categoryLinks.slice(0, 3)}
          headingId="search-results"
          heading={t("resultsHeading")}
        />
      ) : (
        <SearchNoResults query={searchable ? query : ""} categories={categoryLinks} />
      )}
    </div>
  );
}
