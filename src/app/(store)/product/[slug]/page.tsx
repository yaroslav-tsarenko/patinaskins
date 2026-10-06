import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo/metadata";
import { publicBrand } from "@/lib/utils/supplier";
import { clampText, extractLabelledSpecs, htmlToText, sanitizeHtml } from "@/lib/utils/sanitize-html";
import { careFor } from "@/config/care";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { ProductGallery } from "@/components/product/ProductGallery/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo/ProductInfo";
import { ProductTabs, type SpecRow } from "@/components/product/ProductTabs/ProductTabs";
import { ProductReviews } from "@/components/product/ProductReviews/ProductReviews";
import { RelatedProducts } from "@/components/product/RelatedProducts/RelatedProducts";
import { productJsonLd, validGtin13 } from "@/components/product/product-structured-data";
import { getCategoryTree, loadShelfProducts } from "@/components/catalog/catalog-query";
import type { ProductVariantOption } from "@/components/product/VariantSelector/VariantSelector";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const getProduct = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      quantity: true,
      trackInventory: true,
      lowStockAlert: true,
      weight: true,
      metaTitle: true,
      metaDescription: true,
      status: true,
      brand: true,
      gtin: true,
      ean: true,
      condition: true,
      characteristics: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
      categories: { select: { category: { select: { id: true, name: true, slug: true, parentId: true, isActive: true } } } },
      variants: { select: { id: true, name: true, sku: true, price: true, quantity: true, options: true } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });
  if (!product || product.status !== "ACTIVE") return null;
  return product;
});

type ProductRecord = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

function summaryOf(product: ProductRecord): string {
  const text = htmlToText(product.shortDescription) || htmlToText(product.description);
  return text;
}

function metaDescription(product: ProductRecord): string {
  const base = htmlToText(product.metaDescription) || summaryOf(product) || product.name;
  return clampText(base, 160);
}

async function categoryPath(product: ProductRecord) {
  const tree = await getCategoryTree();
  const linked = product.categories.map((c) => c.category).filter((c) => c.isActive && tree.byId.has(c.id));
  const leaf = linked.find((c) => c.parentId) ?? linked[0] ?? null;
  const chain: { id: string; name: string; slug: string }[] = [];
  let current = leaf ? tree.byId.get(leaf.id) ?? null : null;
  while (current) {
    chain.unshift({ id: current.id, name: current.name, slug: current.slug });
    current = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
  }
  return { chain, tree };
}

function characteristicRows(value: unknown): SpecRow[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const rows: SpecRow[] = [];
  for (const [group, entries] of Object.entries(value as Record<string, unknown>)) {
    if (entries && typeof entries === "object" && !Array.isArray(entries)) {
      for (const [label, v] of Object.entries(entries as Record<string, unknown>)) {
        if (typeof v === "string" || typeof v === "number") rows.push({ label, value: String(v) });
      }
    } else if (typeof entries === "string" || typeof entries === "number") {
      rows.push({ label: group, value: String(entries) });
    }
  }
  return rows;
}

function formatWeight(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${Number(kg.toFixed(2))} kg`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  return pageMetadata({
    title: product.metaTitle || product.name,
    description: metaDescription(product),
    path: `/product/${product.slug}`,
    images: false,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const nav = await getTranslations("catalog");
  const { chain, tree } = await categoryPath(product);
  const root = chain[0] ?? null;
  const leaf = chain[chain.length - 1] ?? null;

  const price = Number(product.price);
  const comparePrice = product.comparePrice != null ? Number(product.comparePrice) : null;
  const brand = publicBrand(product.brand);
  const available = !product.trackInventory || product.quantity > 0 || product.variants.some((v) => v.quantity > 0);
  const descriptionText = htmlToText(product.description);
  const gtin13 = validGtin13(product.ean, product.gtin);

  const labelled = extractLabelledSpecs(product.description);
  const specs: SpecRow[] = [
    ...(brand ? [{ label: t("specBrand"), value: brand }] : []),
    { label: t("specSku"), value: product.sku, mono: true },
    ...(gtin13 ? [{ label: t("specEan"), value: gtin13, mono: true }] : []),
    ...labelled,
    ...characteristicRows(product.characteristics),
  ];
  const seen = new Set<string>();
  const dedupedSpecs = specs.filter((row) => {
    const key = row.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (product.weight != null && Number(product.weight) > 0 && !seen.has("weight")) dedupedSpecs.push({ label: t("specWeight"), value: formatWeight(Number(product.weight)) });

  const careMatch = careFor(root?.slug, product.name, `${labelled.map((s) => `${s.label} ${s.value}`).join(" ")} ${descriptionText}`);
  const care = { guide: careMatch.guide, materials: careMatch.materials.map((m) => ({ id: m.id, title: m.title, steps: m.steps })) };

  const variants: ProductVariantOption[] = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: v.price != null ? Number(v.price) : null,
    quantity: v.quantity,
    options: Object.fromEntries(
      Object.entries((v.options && typeof v.options === "object" && !Array.isArray(v.options) ? v.options : {}) as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" || typeof value === "number")
        .map(([k, value]) => [k, String(value)]),
    ),
  }));

  const relatedSource = leaf ? tree.subtreeIds(leaf.id) : [];
  const relatedRows = relatedSource.length
    ? await prisma.product.findMany({
        where: { status: "ACTIVE", id: { not: product.id }, categories: { some: { categoryId: { in: relatedSource } } } },
        select: { id: true, quantity: true, trackInventory: true },
        orderBy: { createdAt: "desc" },
        take: 24,
      })
    : [];
  const inStock = (r: { quantity: number; trackInventory: boolean }) => Number(!r.trackInventory || r.quantity > 0);
  let relatedIds = relatedRows.sort((a, b) => inStock(b) - inStock(a)).map((r) => r.id);
  if (relatedIds.length < 4 && root && root.id !== leaf?.id) {
    const more = await prisma.product.findMany({
      where: { status: "ACTIVE", id: { notIn: [product.id, ...relatedIds] }, categories: { some: { categoryId: { in: tree.subtreeIds(root.id) } } }, OR: [{ trackInventory: false }, { quantity: { gt: 0 } }] },
      select: { id: true },
      orderBy: { createdAt: "desc" },
      take: 4 - relatedIds.length,
    });
    relatedIds = [...relatedIds, ...more.map((m) => m.id)];
  }
  const related = await loadShelfProducts(relatedIds.slice(0, 4));

  const reviews = product.reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, author: r.user?.name ?? null, createdAt: r.createdAt }));

  const breadcrumbItems = [
    { label: nav("home"), href: "/" },
    { label: nav("shop"), href: "/catalog" },
    ...chain.map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })),
    { label: product.name },
  ];

  const jsonLd = productJsonLd({
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: clampText(descriptionText || summaryOf(product), 5000),
    images: product.images.map((i) => i.url),
    brand,
    ean: product.ean,
    gtin: product.gtin,
    price,
    available,
    condition: product.condition,
    category: chain.map((c) => c.name).join(" > ") || null,
    reviews,
  });

  return (
    <div className="mx-auto max-w-container px-gutter pb-28 lg:pb-24">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={breadcrumbItems} className="lg:hidden" withJsonLd={false} />

      <div data-product="" className="grid gap-x-10 gap-y-8 lg:grid-cols-12 lg:pt-8">
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-height-compact)+24px)]">
            <ProductInfo
              id={product.id}
              name={product.name}
              slug={product.slug}
              sku={product.sku}
              price={price}
              comparePrice={comparePrice}
              quantity={product.quantity}
              trackInventory={product.trackInventory}
              lowStockAlert={product.lowStockAlert}
              summary={summaryOf(product) ? clampText(summaryOf(product), 320) : null}
              categoryName={leaf?.name ?? null}
              imageUrl={product.images[0]?.url ?? null}
              variants={variants}
              breadcrumbs={<Breadcrumbs items={breadcrumbItems} className="hidden pt-0 lg:block" />}
            />
          </div>
        </div>
      </div>

      <div className="mt-16 lg:mt-24">
        <ProductTabs descriptionHtml={sanitizeHtml(product.description)} specs={dedupedSpecs} care={care} />
      </div>

      {reviews.length ? <ProductReviews reviews={reviews} /> : null}
      <RelatedProducts products={related} />
    </div>
  );
}
