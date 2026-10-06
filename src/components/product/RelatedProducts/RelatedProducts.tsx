import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import type { ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";

export async function RelatedProducts({ products }: { products: ShelfProduct[] }) {
  if (products.length === 0) return null;
  const t = await getTranslations("product");
  return (
    <section aria-labelledby="related-title" data-related="" className="mt-20">
      <h2 id="related-title" className="mb-8 text-step-3 leading-[1.12] text-ink">
        {t("relatedTitle")}
      </h2>
      <ProductGrid products={products} className="lg:max-xl:[&>div>article:nth-child(n+4)]:hidden" />
    </section>
  );
}
